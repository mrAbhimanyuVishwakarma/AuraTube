import os
import json
import mimetypes
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from app.config import CLIENT_SECRETS_FILE, load_settings

SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.file'
]


def _get_redirect_uri():
    """Returns the correct redirect URI based on environment."""
    backend_url = os.environ.get("RENDER_EXTERNAL_URL", os.environ.get("RENDER_URL", os.environ.get("BACKEND_URL", ""))).rstrip("/")
    if backend_url:
        return f"{backend_url}/api/drive/callback"
    settings = load_settings()
    return f"http://localhost:{settings.port}/api/drive/callback"


def get_credentials_from_token_json(token_json: str):
    """Builds Credentials from a stored JSON string (per-user token)."""
    try:
        creds = Credentials.from_authorized_user_info(json.loads(token_json), SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return creds, creds.to_json()  # Return refreshed token too
    except Exception:
        return None, None


def get_auth_url(state: str = None):
    """Generates Google authorization URL with optional state for user tracking."""
    if not CLIENT_SECRETS_FILE.exists():
        raise Exception("Google Client Credentials are not configured on the server.")

    flow = Flow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=_get_redirect_uri()
    )

    kwargs = {
        'access_type': 'offline',
        'include_granted_scopes': 'true',
        'prompt': 'consent'
    }
    if state:
        kwargs['state'] = state

    auth_url, flow_state = flow.authorization_url(**kwargs)
    return auth_url, flow_state


def handle_oauth_callback(authorization_response_url: str):
    """
    Processes authorization code from Google.
    Returns token JSON string — do NOT save to a file, store in DB per user.
    """
    flow = Flow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=_get_redirect_uri()
    )
    flow.fetch_token(authorization_response=authorization_response_url)
    creds = flow.credentials
    return creds.to_json()  # Return as string to store in DB


def fetch_drive_info(token_json: str):
    """Fetches the user's Drive email and storage quota from Google."""
    creds, _ = get_credentials_from_token_json(token_json)
    if not creds:
        return None, None
    try:
        service = build('drive', 'v3', credentials=creds)
        about = service.about().get(fields="user(emailAddress), storageQuota").execute()
        email = about.get('user', {}).get('emailAddress')
        storage_limit = about.get('storageQuota', {}).get('limit')
        return email, storage_limit
    except Exception:
        return None, None


def upload_to_drive(file_path, token_json: str, on_progress_callback=None):
    """Uploads a file to Google Drive using the user's stored token."""
    creds, refreshed_token = get_credentials_from_token_json(token_json)
    if not creds:
        raise Exception("Google Drive not authorized. Please reconnect your Google account.")

    service = build('drive', 'v3', credentials=creds)
    file_name = os.path.basename(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = 'application/octet-stream'

    # Find or create 'AuraTube Downloads' folder
    folder_name = 'AuraTube Downloads'
    folder_id = None
    
    # Search for the folder
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
    items = results.get('files', [])
    
    if not items:
        # Create folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')
    else:
        folder_id = items[0].get('id')

    file_metadata = {
        'name': file_name,
        'parents': [folder_id]
    }
    
    media = MediaFileUpload(
        file_path,
        mimetype=mime_type,
        resumable=True,
        chunksize=1024 * 1024
    )

    request = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink'
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status and on_progress_callback:
            on_progress_callback(int(status.progress() * 100))

    return response.get('webViewLink'), response.get('id'), refreshed_token
