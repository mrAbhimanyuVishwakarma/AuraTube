import requests
import json

try:
    print('Testing /api/extract...')
    res = requests.post('http://127.0.0.1:8000/api/extract', json={'url': 'https://www.youtube.com/playlist?list=PL22142A9BBE8B2735'})
    data = res.json()
    print('Type:', data.get('type'))
    print('Video Count:', data.get('video_count'))
    
    if data.get('type') == 'playlist' and data.get('videos'):
        print('\nTesting /api/download for the first 2 videos to check rate limit...')
        for i, vid in enumerate(data['videos'][:2]):
            print(f'Queueing video {i+1}: {vid.get("title")}')
            dl_res = requests.post('http://127.0.0.1:8000/api/download', json={
                'url': vid['url'],
                'format_id': 'best',
                'resolution': '720p',
                'ext': 'mp4',
                'target': 'local',
                'title': vid['title']
            })
            print(f'Response {dl_res.status_code}: {dl_res.text}')
except Exception as e:
    print('Error:', e)
