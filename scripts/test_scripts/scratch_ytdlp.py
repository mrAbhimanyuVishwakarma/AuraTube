import yt_dlp

print("yt_dlp version:", yt_dlp.version.__version__)

url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
ydl_opts = {
    'nocheckcertificate': True,
    'quiet': True,
    'no_warnings': True,
    'extract_flat': False
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(url, download=False)
    print("Total formats:", len(info.get('formats', [])))
    audio_formats = [f for f in info.get('formats', []) if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
    print("Audio formats:", len(audio_formats))
