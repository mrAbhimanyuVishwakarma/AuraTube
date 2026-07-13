import os
import json
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BACKEND_DIR / "cache"
CONFIG_DIR = BACKEND_DIR / "config"

# Create required directories
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

CLIENT_SECRETS_FILE = CONFIG_DIR / "client_secrets.json"
TOKEN_FILE = CONFIG_DIR / "token.json"
SETTINGS_FILE = CONFIG_DIR / "settings.json"
COOKIES_FILE = CONFIG_DIR / "cookies.txt"

class AppSettings(BaseModel):
    google_client_id: str = ""
    google_client_secret: str = ""
    port: int = 8000
    host: str = "127.0.0.1"

def load_settings() -> AppSettings:
    # First try reading from environment variables (production on Render)
    env_client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    env_client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")

    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
                settings = AppSettings(**data)
                # Override with env vars if set
                if env_client_id:
                    settings.google_client_id = env_client_id
                if env_client_secret:
                    settings.google_client_secret = env_client_secret
                return settings
        except Exception:
            pass

    # No settings file — build from environment variables
    settings = AppSettings(
        google_client_id=env_client_id,
        google_client_secret=env_client_secret
    )
    return settings

def _write_client_secrets(client_id: str, client_secret: str):
    """Writes client_secrets.json for Google OAuth."""
    backend_url = os.environ.get("RENDER_EXTERNAL_URL", os.environ.get("RENDER_URL", os.environ.get("BACKEND_URL", "http://localhost:8000"))).rstrip("/")
    secrets_data = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "redirect_uris": [
                "http://localhost:8000/api/drive/callback",
                f"{backend_url}/api/drive/callback"
            ]
        }
    }
    with open(CLIENT_SECRETS_FILE, "w") as f:
        json.dump(secrets_data, f, indent=4)

def save_settings(settings: AppSettings):
    with open(SETTINGS_FILE, "w") as f:
        f.write(settings.model_dump_json(indent=4))

    # Also update client_secrets.json if credentials exist
    if settings.google_client_id and settings.google_client_secret:
        _write_client_secrets(settings.google_client_id, settings.google_client_secret)

def ensure_client_secrets():
    """
    Called on app startup. If env vars are set but client_secrets.json
    doesn't exist yet, create it automatically.
    """
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    if client_id and client_secret and not CLIENT_SECRETS_FILE.exists():
        _write_client_secrets(client_id, client_secret)

import logging

logger = logging.getLogger(__name__)

def validate_cookies_content(content: str) -> bool:
    """Validates that the content is a proper Netscape HTTP Cookie File"""
    if not content:
        return False
    # Check if there's at least one valid cookie row (tab-separated with 7 fields)
    has_valid_row = False
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) >= 7:
            has_valid_row = True
            break
    return has_valid_row

def ensure_youtube_cookies():
    """
    Called on app startup. If a Secret File exists at /etc/secrets/cookies.txt,
    or if YOUTUBE_COOKIES env var exists, write it to cookies.txt for yt-dlp to use.
    """
    secret_file_path = Path("/etc/secrets/cookies.txt")
    cookies_content = None

    if secret_file_path.exists():
        with open(secret_file_path, "r", encoding="utf-8") as sf:
            cookies_content = sf.read()
    else:
        cookies_content = os.environ.get("YOUTUBE_COOKIES")

    if cookies_content:
        cookies_content = cookies_content.replace("\\n", "\n").strip()
        
        if validate_cookies_content(cookies_content):
            if not cookies_content.startswith("# Netscape HTTP Cookie File"):
                cookies_content = "# Netscape HTTP Cookie File\n\n" + cookies_content
            with open(COOKIES_FILE, "w", encoding="utf-8") as f:
                f.write(cookies_content)
        else:
            logger.warning("Invalid cookie format detected. Skipping cookie file creation.")
            if COOKIES_FILE.exists():
                COOKIES_FILE.unlink()

def get_cookie_status() -> dict:
    is_enabled = os.environ.get("YTDLP_USE_COOKIES", "false").lower() == "true"
    status = {
        "configured": is_enabled,
        "valid_format": False,
        "youtube_cookie_count": 0
    }
    if COOKIES_FILE.exists():
        try:
            with open(COOKIES_FILE, "r", encoding="utf-8") as f:
                content = f.read()
                count = sum(1 for line in content.splitlines() if line.strip() and not line.strip().startswith('#') and len(line.split('\t')) >= 7)
                status["valid_format"] = count > 0
                status["youtube_cookie_count"] = count
        except Exception:
            pass
    return status
