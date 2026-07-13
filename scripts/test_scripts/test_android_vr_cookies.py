import yt_dlp
import yt_dlp.extractor.youtube._base

# Monkeypatch yt_dlp to allow android_vr to use cookies
yt_dlp.extractor.youtube._base.INNERTUBE_CLIENTS['android_vr']['SUPPORTS_COOKIES'] = True

ydl_opts = {
    'nocheckcertificate': True,
    'quiet': False,
    'no_warnings': False,
    'extract_flat': 'in_playlist',
    'cookiefile': 'backend/config/cookies.txt',
    'extractor_args': {
        'youtube': ['player_client=android_vr']
    }
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info("https://www.youtube.com/watch?v=zp4RUHxLbu0", download=False)
    print("SUCCESS!", info['title'])
