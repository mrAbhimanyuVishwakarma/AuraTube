import os
import re
import yt_dlp
import logging
from pathlib import Path
from typing import Optional, Any
from app.config import CACHE_DIR, DOWNLOADS_DIR, COOKIES_FILE
from app.errors import (
    DownloaderError,
    InvalidURLError,
    VideoUnavailableError,
    AuthenticationRequiredError,
    FormatNotAvailableError,
    RateLimitedError,
    NetworkTimeoutError,
    UnknownExtractorError
)

logger = logging.getLogger(__name__)

def build_ydl_options(
    *,
    download: bool,
    output_directory: Optional[str] = None,
    progress_hook=None,
    format_selector: Optional[str] = None,
) -> dict:
    """Builds a centralized configuration for yt-dlp."""
    ydl_opts = {
        'nocheckcertificate': False, # Safe default, don't disable unless necessary
        'quiet': os.environ.get('YTDLP_QUIET', 'true').lower() == 'true',
        'no_warnings': True,
        'restrictfilenames': True,
        'windowsfilenames': True,
        'retries': 3,
        'fragment_retries': 3,
        'socket_timeout': 30,
        'extractor_args': {},
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }
    
    # Configure clients
    clients_env = os.environ.get('YTDLP_PLAYER_CLIENTS', '').strip()
    if clients_env:
        ydl_opts['extractor_args']['youtube'] = [f"player_client={clients_env}"]
        
    if not ydl_opts['extractor_args']:
        del ydl_opts['extractor_args']

    # Cookies
    use_cookies = os.environ.get('YTDLP_USE_COOKIES', 'false').lower() == 'true'
    if use_cookies and COOKIES_FILE.exists():
        ydl_opts['cookiefile'] = str(COOKIES_FILE)
        
    if not download:
        ydl_opts['extract_flat'] = 'in_playlist'
    else:
        if output_directory:
            ydl_opts['outtmpl'] = os.path.join(output_directory, '%(title)s.%(ext)s')
        if format_selector:
            ydl_opts['format'] = format_selector
        
        if progress_hook:
            ydl_opts['progress_hooks'] = [progress_hook]

    return ydl_opts

def map_yt_dlp_exception(e: Exception) -> Exception:
    """Maps yt-dlp exceptions to custom API errors."""
    msg = str(e).lower()
    if "sign in" in msg or "authentication" in msg:
        return AuthenticationRequiredError(str(e))
    elif "private video" in msg or "unavailable" in msg or "geo-restricted" in msg or "drm" in msg:
        return VideoUnavailableError(str(e))
    elif "requested format is not available" in msg:
        return FormatNotAvailableError(str(e))
    elif "rate limit" in msg or "captcha" in msg or "429" in msg:
        return RateLimitedError(str(e))
    elif "invalid" in msg or "unsupported" in msg:
        return InvalidURLError(str(e))
    elif "timeout" in msg:
        return NetworkTimeoutError(str(e))
    else:
        return UnknownExtractorError(str(e))

def get_video_info(url: str) -> dict:
    """Extracts metadata and list of available formats for a video."""
    logger.info(f"Extracting metadata for URL: {url}")
    ydl_opts = build_ydl_options(download=False)
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # If it's a playlist
            if 'entries' in info:
                playlist_info = {
                    'id': info.get('id'),
                    'title': info.get('title'),
                    'type': 'playlist',
                    'video_count': len(info.get('entries', [])),
                    'videos': []
                }
                for entry in info.get('entries', []):
                    if entry:
                        playlist_info['videos'].append({
                            'id': entry.get('id'),
                            'title': entry.get('title'),
                            'url': f"https://www.youtube.com/watch?v={entry.get('id')}",
                            'duration': entry.get('duration'),
                            'thumbnail': entry.get('thumbnail') or (entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else None)
                        })
                return playlist_info
            
            # It's a single video
            return parse_single_video_info(info)
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"Download error during metadata extraction: {str(e)}")
        raise map_yt_dlp_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error during metadata extraction: {str(e)}")
        raise map_yt_dlp_exception(e)

def parse_single_video_info(info: dict) -> dict:
    """Helper to parse a single video info dict into clean client-friendly formats."""
    # Find best audio stream size to add to video-only streams
    best_audio_size = 0
    audio_formats = [f for f in info.get('formats', []) if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
    if audio_formats:
        audio_sizes = [f.get('filesize') or f.get('filesize_approx') or 0 for f in audio_formats]
        best_audio_size = max(audio_sizes) if audio_sizes else 0
        if best_audio_size == 0:
            duration = info.get('duration') or 0
            best_audio_size = int((128 * 1024 / 8) * duration)

    formats_by_resolution = {}
    
    for f in info.get('formats', []):
        vcodec = f.get('vcodec', 'none')
        acodec = f.get('acodec', 'none')
        height = f.get('height')
        
        # We want to offer video resolutions
        if vcodec != 'none' and height:
            res_key = f"{height}p"
            
            size = f.get('filesize') or f.get('filesize_approx')
            if size:
                if acodec == 'none':
                    size += best_audio_size
            else:
                bitrate = f.get('tbr') or 0  
                duration = info.get('duration') or 0
                if bitrate > 0 and duration > 0:
                    size = int((bitrate * 1000 / 8) * duration)
                else:
                    size = 0

            existing = formats_by_resolution.get(res_key)
            if not existing or (size and existing.get('size', 0) < size):
                formats_by_resolution[res_key] = {
                    'format_id': f.get('format_id'),
                    'resolution': res_key,
                    'size': size,
                    'ext': f.get('ext'),
                    'vcodec': vcodec,
                    'acodec': acodec
                }
                
    # Format the list for the client
    available_formats = []
    
    # Sort resolutions (highest first)
    sorted_res = sorted(
        formats_by_resolution.items(), 
        key=lambda x: int(x[0].replace('p', '')) if x[0].replace('p', '').isdigit() else 0,
        reverse=True
    )
    
    for res, data in sorted_res:
        formatted_size = "Unknown"
        if data['size']:
            mb = data['size'] / (1024 * 1024)
            formatted_size = f"{mb:.1f} MB"
            
        available_formats.append({
            'resolution': res,
            'size': formatted_size,
            'format_id': data['format_id']
        })
        
    # Also add MP3 format option explicitly
    available_formats.append({
        'resolution': 'MP3 (Audio)',
        'size': f"~{int(best_audio_size / (1024*1024))} MB" if best_audio_size else "Unknown",
        'format_id': 'bestaudio'
    })

    return {
        'id': info.get('id'),
        'title': info.get('title'),
        'thumbnail': info.get('thumbnail'),
        'duration': info.get('duration'),
        'formats': available_formats,
        'type': 'video'
    }

def download_video(url: str, resolution: str, target_path: str, on_progress_callback=None) -> str:
    """Downloads a video matching the requested resolution to target_path."""
    logger.info(f"Starting download for {url} at resolution {resolution}")
    
    def hook(d):
        if on_progress_callback:
            if d['status'] == 'downloading':
                percent_str = d.get('_percent_str', '0%').replace('\x1b[0;94m', '').replace('\x1b[0m', '').strip()
                try:
                    percent = float(percent_str.replace('%', ''))
                except:
                    percent = 0.0
                
                speed_str = d.get('_speed_str', '0KiB/s').replace('\x1b[0;92m', '').replace('\x1b[0m', '').strip()
                eta_str = d.get('_eta_str', '0s').replace('\x1b[0;93m', '').replace('\x1b[0m', '').strip()
                
                on_progress_callback({
                    'status': 'downloading',
                    'progress': percent,
                    'speed': speed_str,
                    'eta': eta_str
                })
            elif d['status'] == 'finished':
                on_progress_callback({
                    'status': 'merging',
                    'progress': 99,
                    'speed': 0,
                    'eta': 0
                })

    is_audio = 'mp3' in resolution.lower() or 'm4a' in resolution.lower()
    
    if is_audio:
        quality = '128'
        quality_match = re.search(r'\((\d+)k\)', resolution)
        if quality_match:
            quality = quality_match.group(1)
            
        format_selector = 'bestaudio/best'
        postprocessors = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': quality,
        }]
    else:
        height = ''.join(filter(str.isdigit, resolution)) or '1080'
        format_selector = f'bestvideo[ext=mp4][height<={height}]+bestaudio[ext=m4a]/best[ext=mp4][height<={height}]/best[height<={height}]/best'
        postprocessors = [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }]
        
    ydl_opts = build_ydl_options(
        download=True,
        output_directory=target_path,
        progress_hook=hook,
        format_selector=format_selector
    )
    ydl_opts['postprocessors'] = postprocessors

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info(f"Extracting info for download: {url}")
            info = ydl.extract_info(url, download=True)
            # Find the downloaded file path
            filename = ydl.prepare_filename(info)
            if is_audio:
                filename = os.path.splitext(filename)[0] + '.mp3'
            else:
                filename = os.path.splitext(filename)[0] + '.mp4'
            
            logger.info(f"Download completed successfully: {filename}")
            return filename
    except Exception as e:
        logger.error(f"Error during video download: {str(e)}")
        raise map_yt_dlp_exception(e)
