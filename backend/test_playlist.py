import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.downloader import get_video_info

url = "https://www.youtube.com/playlist?list=PLA3GkZPtsafbAjKYkhWnD6GdhRtm6JrD1"

try:
    info = get_video_info(url)
    print("Type:", info.get("type"))
    print("Video Count:", info.get("video_count"))
    if info.get("type") == "playlist" and info.get("videos"):
        print("First video title:", info["videos"][0].get("title"))
except Exception as e:
    print("Error:", repr(e))
