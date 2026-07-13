import yt_dlp
from pathlib import Path

COOKIES_FILE = Path("backend/config/cookies.txt").resolve()
print(f"Testing with cookies from: {COOKIES_FILE}")
print(f"Cookies exist? {COOKIES_FILE.exists()}")

ydl_opts = {
    'nocheckcertificate': True,
    'quiet': False,
    'no_warnings': False,
    'extract_flat': 'in_playlist',
    'extractor_args': {
        'youtube': ['player_client=android,ios,web']
    }
}
if COOKIES_FILE.exists():
    ydl_opts['cookiefile'] = str(COOKIES_FILE)

print("Starting extraction...")
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    try:
        info = ydl.extract_info("https://www.youtube.com/shorts/Q5Fw3M51qyo", download=False)
        print("SUCCESS!")
        print(info.get('title'))
    except Exception as e:
        print(f"FAILED: {e}")
