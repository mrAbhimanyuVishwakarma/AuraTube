import argparse
import os
import json
import logging
import asyncio
from app.downloader import get_video_info, download_video

# Configure basic logging for CLI test script
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def test_downloader(url: str, download: bool, resolution: str, is_audio: bool):
    try:
        logging.info(f"Extracting metadata for {url}...")
        info = get_video_info(url)
        
        # Don't print entire JSON, just safe metadata
        safe_info = {
            "title": info.get("title"),
            "id": info.get("id"),
            "duration": info.get("duration"),
            "type": info.get("type"),
            "formats_count": len(info.get("formats", [])) if "formats" in info else 0
        }
        print("\n--- Metadata Extracted ---")
        print(json.dumps(safe_info, indent=2))
        
        if download:
            logging.info(f"\nStarting download test (resolution: {resolution})...")
            
            def progress_hook(d):
                status = d.get('status')
                prog = d.get('progress')
                print(f"\rStatus: {status} | Progress: {prog}%", end='', flush=True)

            target_dir = os.path.join(os.getcwd(), 'downloads_test')
            os.makedirs(target_dir, exist_ok=True)
            
            filename = download_video(url, resolution, target_dir, on_progress_callback=progress_hook)
            print(f"\n\nDownload successful! Saved to: {filename}")
            
    except Exception as e:
        logging.error(f"Test failed: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test AuraTube Downloader Safely")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument("--download", action="store_true", help="Actually download the video")
    parser.add_argument("--resolution", default="1080p", help="Resolution to download (e.g. 1080p or mp3)")
    parser.add_argument("--audio", action="store_true", help="Download audio only")
    
    args = parser.parse_args()
    
    # Enable verbose if not specified quiet
    if not os.environ.get('YTDLP_QUIET'):
        os.environ['YTDLP_QUIET'] = 'false'
        
    res = 'mp3' if args.audio else args.resolution
    test_downloader(args.url, args.download, res, args.audio)
