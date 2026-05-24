import os
import mimetypes
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from app.config import CLIENT_SECRETS_FILE, TOKEN_FILE, load_settings

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_credentials():
    """Gets valid user credentials from storage."""
    creds = None
    if TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        except Exception:
            pass

    # If there are no (valid) credentials available, let the user log in.
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            # Save the refreshed credentials
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
        except Exception:
            creds = None

    return creds

def get_auth_url():
    """Generates Google authorization URL."""
    if not CLIENT_SECRETS_FILE.exists():
        raise Exception("Google Client Credentials are not configured yet. Please configure them in Settings.")
    
    settings = load_settings()
    backend_url = os.getenv("BACKEND_URL", f"http://localhost:{settings.port}").rstrip("/")
    redirect_uri = f"{backend_url}/api/drive/callback"
    
    flow = Flow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    return auth_url, state

def handle_oauth_callback(authorization_response_url):
    """Processes authorization code and saves tokens."""
    settings = load_settings()
    backend_url = os.getenv("BACKEND_URL", f"http://localhost:{settings.port}").rstrip("/")
    redirect_uri = f"{backend_url}/api/drive/callback"
    
    flow = Flow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    flow.fetch_token(authorization_response=authorization_response_url)
    
    creds = flow.credentials
    with open(TOKEN_FILE, 'w') as token:
        token.write(creds.to_json())
    return creds

def upload_to_drive(file_path, on_progress_callback=None):
    """Uploads a file to Google Drive in chunks, tracking progress."""
    creds = get_credentials()
    if not creds:
        raise Exception("Google Drive not authorized. Please connect your Google account.")
    
    service = build('drive', 'v3', credentials=creds)
    file_name = os.path.basename(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = 'application/octet-stream'

    file_metadata = {'name': file_name}
    
    # Create resumable upload
    media = MediaFileUpload(
        file_path, 
        mimetype=mime_type, 
        resumable=True, 
        chunksize=1024 * 1024  # 1MB chunk size
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
            progress = int(status.progress() * 100)
            on_progress_callback(progress)
            
    return response.get('webViewLink'), response.get('id')
