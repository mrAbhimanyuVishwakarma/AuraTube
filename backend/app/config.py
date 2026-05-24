import os
import json
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DOWNLOADS_DIR = BASE_DIR / "downloads"
CACHE_DIR = BACKEND_DIR / "cache"
CONFIG_DIR = BACKEND_DIR / "config"

# Create required directories
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

CLIENT_SECRETS_FILE = CONFIG_DIR / "client_secrets.json"
TOKEN_FILE = CONFIG_DIR / "token.json"
SETTINGS_FILE = CONFIG_DIR / "settings.json"

class AppSettings(BaseModel):
    downloads_dir: str = str(DOWNLOADS_DIR)
    google_client_id: str = ""
    google_client_secret: str = ""
    port: int = 8000
    host: str = "127.0.0.1"

def load_settings() -> AppSettings:
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
                return AppSettings(**data)
        except Exception:
            pass
    return AppSettings()

def save_settings(settings: AppSettings):
    with open(SETTINGS_FILE, "w") as f:
        f.write(settings.model_dump_json(indent=4))
    
    # Also update client_secrets.json if credentials exist
    if settings.google_client_id and settings.google_client_secret:
        secrets_data = {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [f"http://localhost:{settings.port}/api/drive/callback"]
            }
        }
        with open(CLIENT_SECRETS_FILE, "w") as f:
            json.dump(secrets_data, f, indent=4)
