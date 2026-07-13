import yt_dlp
from pathlib import Path

COOKIES_FILE = Path("backend/config/cookies.txt").resolve()

ydl_opts = {
    'nocheckcertificate': True,
    'quiet': False,
    'no_warnings': False,
    'extract_flat': 'in_playlist',
    'extractor_args': {
        'youtube': ['player_client=android_vr,default']
    }
}
if COOKIES_FILE.exists():
    ydl_opts['cookiefile'] = str(COOKIES_FILE)

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    try:
        info = ydl.extract_info("https://www.youtube.com/watch?v=zp4RUHxLbu0", download=False)
        print("SUCCESS!")
    except Exception as e:
        print(f"FAILED: {e}")
