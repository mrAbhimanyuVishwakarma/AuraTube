import os
import re
import yt_dlp
from app.config import CACHE_DIR, DOWNLOADS_DIR

def get_video_info(url):
    """Extracts metadata and list of available formats for a video."""
    ydl_opts = {
        'nocheckcertificate': True,
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        # Bypass YouTube bot detection on cloud servers
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
                'player_skip': ['webpage', 'configs'],
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as e:
            raise Exception(f"Failed to fetch video details: {str(e)}")
        
        # If it's a playlist
        if 'entries' in info:
            # We got a playlist
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

def parse_single_video_info(info):
    """Helper to parse a single video info dict into clean client-friendly formats."""
    # Find best audio stream size to add to video-only streams
    best_audio_size = 0
    audio_formats = [f for f in info.get('formats', []) if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
    if audio_formats:
        # Find one with filesize or filesize_approx
        audio_sizes = [f.get('filesize') or f.get('filesize_approx') or 0 for f in audio_formats]
        best_audio_size = max(audio_sizes) if audio_sizes else 0
        if best_audio_size == 0:
            # Guess based on bitrate (e.g. 128kbps * duration)
            duration = info.get('duration') or 0
            best_audio_size = int((128 * 1024 / 8) * duration)

    formats_by_resolution = {}
    
    # Process formats
    for f in info.get('formats', []):
        vcodec = f.get('vcodec', 'none')
        acodec = f.get('acodec', 'none')
        height = f.get('height')
        
        # We want to offer video resolutions
        if vcodec != 'none' and height:
            res_key = f"{height}p"
            
            # Check size
            size = f.get('filesize') or f.get('filesize_approx')
            if size:
                # If separate video-only, add best audio size since we will merge them
                if acodec == 'none':
                    size += best_audio_size
            else:
                # Approximate size based on bitrate
                bitrate = f.get('tbr') or 0  # kbps
                duration = info.get('duration') or 0
                if bitrate > 0 and duration > 0:
                    size = int((bitrate * 1000 / 8) * duration)
                else:
                    size = 0

            # We prefer MP4 containers or higher bitrates, let's keep the best one per resolution
            existing = formats_by_resolution.get(res_key)
            if not existing or (size and existing.get('size', 0) < size):
                formats_by_resolution[res_key] = {
                    'format_id': f.get('format_id'),
                    'resolution': res_key,
                    'height': height,
                    'ext': 'mp4' if f.get('ext') == 'mp4' else f.get('ext', 'mp4'),
                    'size': size,
                    'is_dash': acodec == 'none' # Requires merging
                }

    # Audio formats
    audio_options = []
    # Add a standard high-quality MP3 choice (will convert best audio to MP3)
    best_audio = None
    best_audio_fs = 0
    for af in audio_formats:
        fs = af.get('filesize') or af.get('filesize_approx') or 0
        if fs > best_audio_fs:
            best_audio_fs = fs
            best_audio = af

    if best_audio:
        audio_options.append({
            'format_id': 'bestaudio/best',
            'resolution': 'MP3 (160k)',
            'ext': 'mp3',
            'size': best_audio_fs or int((160 * 1024 / 8) * (info.get('duration') or 0)),
            'is_audio': True
        })
        # Add M4A direct if available
        m4a_audios = [af for af in audio_formats if af.get('ext') == 'm4a']
        if m4a_audios:
            m4a_best = m4a_audios[0]
            m4a_size = m4a_best.get('filesize') or m4a_best.get('filesize_approx') or 0
            audio_options.append({
                'format_id': m4a_best.get('format_id'),
                'resolution': 'M4A (Direct)',
                'ext': 'm4a',
                'size': m4a_size or int((128 * 1024 / 8) * (info.get('duration') or 0)),
                'is_audio': True
            })

    # Sort video resolutions descending (e.g. 1080p, 720p...)
    sorted_videos = sorted(
        formats_by_resolution.values(),
        key=lambda x: x['height'],
        reverse=True
    )
    
    return {
        'id': info.get('id'),
        'title': info.get('title'),
        'type': 'video',
        'duration': info.get('duration'),
        'thumbnail': info.get('thumbnail') or (info.get('thumbnails')[0]['url'] if info.get('thumbnails') else None),
        'formats': sorted_videos + audio_options
    }

def download_video(url, format_id, ext, resolution, on_progress_callback=None, target_dir=None):
    """
    Downloads a video from YouTube using yt-dlp.
    If separate audio and video are chosen, automatically merges them using ffmpeg.
    """
    target_path = target_dir or str(DOWNLOADS_DIR)
    
    # Progress hook wrapper
    def hook(d):
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            downloaded = d.get('downloaded_bytes') or 0
            speed = d.get('speed') or 0
            eta = d.get('eta') or 0
            
            progress = int((downloaded / total) * 100) if total > 0 else 0
            if on_progress_callback:
                on_progress_callback({
                    'status': 'downloading',
                    'progress': progress,
                    'speed': speed,
                    'eta': eta,
                    'downloaded_bytes': downloaded,
                    'total_bytes': total
                })
        elif d['status'] == 'finished':
            if on_progress_callback:
                on_progress_callback({
                    'status': 'merging',
                    'progress': 99,
                    'speed': 0,
                    'eta': 0
                })

    # Base configuration for yt-dlp
    ydl_opts = {
        'nocheckcertificate': True,
        'progress_hooks': [hook],
        'outtmpl': os.path.join(target_path, '%(title)s.%(ext)s'),
        'no_warnings': True,
        'quiet': True,
        # Bypass YouTube bot detection on cloud servers
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
                'player_skip': ['webpage', 'configs'],
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    }

    # Set up format options
    is_audio = 'mp3' in resolution.lower() or 'm4a' in resolution.lower() or ext in ['mp3', 'm4a']
    
    if is_audio:
        if ext == 'mp3':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '160',
                }],
            })
        else:
            # m4a direct
            ydl_opts.update({
                'format': format_id if format_id != 'bestaudio/best' else 'bestaudio[ext=m4a]/best',
            })
    else:
        # It's a video
        # Height extraction from resolution string (e.g. "1080p" -> 1080)
        height_match = re.search(r'\d+', resolution)
        height = int(height_match.group()) if height_match else None
        
        if height:
            # We download the specific height, and merge with best audio
            # bestvideo[height=1080]+bestaudio/best[height=1080]
            # We want to fall back to best video if height not exactly available, but capping at height
            ydl_opts.update({
                'format': f'bestvideo[height={height}]+bestaudio/bestvideo[height<={height}]+bestaudio/best[height<={height}]/best',
                'merge_output_format': 'mp4',
            })
        else:
            ydl_opts.update({
                'format': 'bestvideo+bestaudio/best',
                'merge_output_format': 'mp4',
            })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        # Get the final filename path
        filename = ydl.prepare_filename(info)
        
        # If we did postprocessing like converting to MP3, the extension changes
        if is_audio and ext == 'mp3':
            filename = os.path.splitext(filename)[0] + '.mp3'
        elif not is_audio:
            # Merge output format merges to mp4
            filename = os.path.splitext(filename)[0] + '.mp4'
            
        return filename
