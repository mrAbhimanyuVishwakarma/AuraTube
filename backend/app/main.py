import os
import uuid
import json
import asyncio
import datetime
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, Request, Depends, status
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from app.config import load_settings, save_settings, AppSettings, CACHE_DIR, CLIENT_SECRETS_FILE, TOKEN_FILE, ensure_client_secrets
from app.downloader import get_video_info, download_video
from app.drive_uploader import (
    get_auth_url,
    handle_oauth_callback,
    get_credentials,
    upload_to_drive
)

# SaaS imports
from app.database import engine, Base, get_db
from app.models import User, Transaction
from app.schemas import UserCreate, UserLogin, UserResponse, Token, DownloadRequest, SettingsRequest
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_optional_current_user
)
from app.billing import router as billing_router

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-create Google OAuth client_secrets.json from env vars on startup
ensure_client_secrets()

app = FastAPI(title="AuraTube SaaS - Video Downloader & Uploader")

# Enable CORS - allow Vercel frontend and local dev
ALLOW_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for now; restrict to ALLOW_ORIGINS in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Billing Router
app.include_router(billing_router)

# Global dictionary to track download and upload tasks
active_downloads = {}

# Simple in-memory tracker for daily downloads by IP (for free users)
# Format: { ip_address: [datetime, datetime, ...] }
free_download_limits = {}

def check_free_limit(ip: str) -> bool:
    """Checks if a free user has exceeded their daily limit of 5 downloads."""
    now = datetime.datetime.utcnow()
    day_ago = now - datetime.timedelta(days=1)
    
    if ip not in free_download_limits:
        free_download_limits[ip] = []
        
    # Filter downloads in the last 24h
    free_download_limits[ip] = [dt for dt in free_download_limits[ip] if dt > day_ago]
    
    return len(free_download_limits[ip]) < 5

def record_free_download(ip: str):
    """Logs a free download to calculate limits."""
    if ip not in free_download_limits:
        free_download_limits[ip] = []
    free_download_limits[ip].append(datetime.datetime.utcnow())

# --- Authentication Endpoints ---

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(req: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user on the SaaS platform."""
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    
    hashed_pw = get_password_hash(req.password)
    new_user = User(email=req.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a JWT access token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
def get_user_profile(user: User = Depends(get_current_user)):
    """Returns profile details of the currently authenticated user."""
    # Run active check
    user.is_premium = user.check_premium_status()
    return user

# --- Core Download Endpoints ---

@app.post("/api/extract")
def extract_metadata(req: dict, user: Optional[User] = Depends(get_optional_current_user)):
    """Extracts metadata from a YouTube video or playlist URL."""
    url = req.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required.")
    try:
        info = get_video_info(url)
        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def format_speed(bytes_per_sec):
    if bytes_per_sec > 1024 * 1024:
        return f"{bytes_per_sec / (1024 * 1024):.2f} MB/s"
    elif bytes_per_sec > 1024:
        return f"{bytes_per_sec / 1024:.2f} KB/s"
    return f"{bytes_per_sec:.2f} B/s"

def format_size(num_bytes):
    if not num_bytes:
        return "Unknown"
    for unit in ['B', 'KB', 'MB', 'GB']:
        if num_bytes < 1024.0:
            return f"{num_bytes:.2f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.2f} TB"

async def run_download_task(task_id: str, req: DownloadRequest):
    """Background task to download and optionally upload to Drive."""
    task = active_downloads[task_id]
    
    try:
        settings = load_settings()
        
        if req.target == "drive":
            temp_dir = CACHE_DIR / task_id
            temp_dir.mkdir(parents=True, exist_ok=True)
            task["status"] = "downloading"
            
            def dl_hook(p_info):
                if p_info["status"] == "downloading":
                    task["progress"] = p_info["progress"]
                    task["speed"] = format_speed(p_info["speed"])
                    task["eta"] = f"{p_info['eta']}s" if p_info['eta'] else "unknown"
                    task["downloaded"] = format_size(p_info["downloaded_bytes"])
                    task["total_size"] = format_size(p_info["total_bytes"])
                elif p_info["status"] == "merging":
                    task["status"] = "merging"
                    task["progress"] = 99
                    task["speed"] = "0 B/s"
                    task["eta"] = "merging audio & video..."

            loop = asyncio.get_event_loop()
            local_filepath = await loop.run_in_executor(
                None, 
                download_video, 
                req.url, 
                req.format_id, 
                req.ext, 
                req.resolution, 
                dl_hook, 
                str(temp_dir)
            )
            
            task["status"] = "uploading"
            task["progress"] = 0
            task["speed"] = "Uploading..."
            task["eta"] = ""
            
            def upload_hook(progress_pct):
                task["progress"] = progress_pct
                task["speed"] = "Uploading..."
                task["eta"] = f"{progress_pct}%"

            drive_link, drive_id = await loop.run_in_executor(
                None,
                upload_to_drive,
                local_filepath,
                upload_hook
            )
            
            try:
                if os.path.exists(local_filepath):
                    os.remove(local_filepath)
                if temp_dir.exists():
                    os.rmdir(temp_dir)
            except Exception as clean_err:
                print(f"Error cleaning temp directory: {clean_err}")
                
            task["status"] = "completed"
            task["progress"] = 100
            task["drive_link"] = drive_link
            task["drive_id"] = drive_id
            
        else:
            task["status"] = "downloading"
            
            def dl_hook(p_info):
                if p_info["status"] == "downloading":
                    task["progress"] = p_info["progress"]
                    task["speed"] = format_speed(p_info["speed"])
                    task["eta"] = f"{p_info['eta']}s" if p_info['eta'] else "unknown"
                    task["downloaded"] = format_size(p_info["downloaded_bytes"])
                    task["total_size"] = format_size(p_info["total_bytes"])
                elif p_info["status"] == "merging":
                    task["status"] = "merging"
                    task["progress"] = 99
                    task["speed"] = "0 B/s"
                    task["eta"] = "merging audio & video..."

            loop = asyncio.get_event_loop()
            local_filepath = await loop.run_in_executor(
                None, 
                download_video, 
                req.url, 
                req.format_id, 
                req.ext, 
                req.resolution, 
                dl_hook, 
                settings.downloads_dir
            )
            
            task["status"] = "completed"
            task["progress"] = 100
            task["speed"] = "Finished"
            task["eta"] = ""
            task["local_path"] = local_filepath

    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)
        if req.target == "drive":
            try:
                temp_dir = CACHE_DIR / task_id
                if temp_dir.exists():
                    for f in temp_dir.iterdir():
                        os.remove(f)
                    os.rmdir(temp_dir)
            except Exception:
                pass

@app.post("/api/download")
def start_download(
    req: DownloadRequest, 
    request: Request,
    background_tasks: BackgroundTasks,
    user: Optional[User] = Depends(get_optional_current_user)
):
    """Enqueues a new download / upload job, enforcing Premium SaaS limits."""
    # 1. Premium Check for direct Google Drive upload
    if req.target == "drive":
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="Authentication is required to download directly to Google Drive."
            )
        if not user.check_premium_status():
            raise HTTPException(
                status_code=403, 
                detail="Direct saving to Google Drive is a Premium feature. Please upgrade your account."
            )
            
    # 2. Premium Check for high resolution downloads (above 720p)
    is_high_res = False
    try:
        # Extract height from resolution (e.g., "1080p" -> 1080)
        import re
        height_match = re.search(r'\d+', req.resolution)
        if height_match:
            height = int(height_match.group())
            if height > 720:
                is_high_res = True
    except Exception:
        pass
        
    if is_high_res:
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="Authentication is required to download high resolution formats."
            )
        if not user.check_premium_status():
            raise HTTPException(
                status_code=403, 
                detail="High-definition downloads (1080p, 1440p, 4K) are restricted to Premium users. Please upgrade."
            )
            
    # 3. Rate Limit Check for free users (5 downloads per day)
    is_premium = user and user.check_premium_status()
    if not is_premium:
        client_ip = request.client.host
        if not check_free_limit(client_ip):
            raise HTTPException(
                status_code=429,
                detail="You have reached the free limit of 5 downloads per day. Please upgrade to Premium for unlimited downloads."
            )
        record_free_download(client_ip)

    # All checks passed, start background task
    task_id = str(uuid.uuid4())
    client_ip = request.client.host
    
    if not is_premium:
        # Check active downloads for this IP (1 at a time)
        active_for_ip = [
            t for t in active_downloads.values() 
            if t.get("ip") == client_ip and t["status"] in ["pending", "downloading", "uploading", "merging"]
        ]
        if len(active_for_ip) >= 1:
            raise HTTPException(
                status_code=429,
                detail="Free users can only download one video at a time. Upgrade to Premium for bulk/playlist support."
            )

    active_downloads[task_id] = {
        "id": task_id,
        "title": req.title,
        "resolution": req.resolution,
        "target": req.target,
        "status": "pending",
        "progress": 0,
        "speed": "0 B/s",
        "eta": "waiting...",
        "downloaded": "0 B",
        "total_size": "Calculating...",
        "error": None,
        "ip": client_ip,
        "user_id": user.id if user else None
    }
    
    background_tasks.add_task(run_download_task, task_id, req)
    return {"task_id": task_id, "status": "queued"}

@app.get("/api/progress")
async def get_progress(request: Request):
    """SSE endpoint returning list of active/completed download status updates."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            tasks = list(active_downloads.values())
            yield f"data: {json.dumps(tasks)}\n\n"
            await asyncio.sleep(1)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/tasks/clear")
def clear_completed_tasks():
    global active_downloads
    active_downloads = {
        tid: task for tid, task in active_downloads.items() 
        if task["status"] not in ["completed", "failed"]
    }
    return {"status": "ok"}

# --- Settings Endpoints ---

@app.get("/api/settings")
def get_settings():
    settings = load_settings()
    return {
        "downloads_dir": settings.downloads_dir,
        "google_client_id": settings.google_client_id,
        "google_client_secret": settings.google_client_secret
    }

@app.post("/api/settings")
def update_settings(req: SettingsRequest):
    settings = load_settings()
    settings.downloads_dir = req.downloads_dir
    settings.google_client_id = req.google_client_id
    settings.google_client_secret = req.google_client_secret
    
    try:
        save_settings(settings)
        return {"status": "success", "message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Google Drive Authentication Endpoints ---

@app.get("/api/drive/status")
def check_drive_status():
    has_client_secrets = CLIENT_SECRETS_FILE.exists()
    
    creds = get_credentials()
    is_connected = creds is not None and not creds.expired
    
    email = None
    storage_limit = None
    if is_connected:
        try:
            from googleapiclient.discovery import build
            service = build('drive', 'v3', credentials=creds)
            about = service.about().get(fields="user(emailAddress), storageQuota").execute()
            email = about.get('user', {}).get('emailAddress')
            quota = about.get('storageQuota', {})
            storage_limit = quota.get('limit')
        except Exception:
            pass

    return {
        "is_configured": has_client_secrets,
        "is_connected": is_connected,
        "email": email,
        "storage_limit": storage_limit
    }

@app.get("/api/drive/auth-url")
def get_drive_auth_url():
    try:
        url, _ = get_auth_url()
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/drive/callback", response_class=HTMLResponse)
def drive_oauth_callback(request: Request):
    try:
        full_url = str(request.url)
        if "https://" in full_url and "localhost" in full_url:
            full_url = full_url.replace("https://", "http://")
            
        handle_oauth_callback(full_url)
        
        return """
        <html>
            <body style="font-family: sans-serif; background-color: #0f0c1b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                    <h2 style="color: #a78bfa; margin-top: 0;">Google Account Connected!</h2>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Authentication completed successfully. You can close this tab now.</p>
                    <button onclick="window.close()" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 1rem; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);">
                        Close Window
                    </button>
                </div>
                <script>
                    try {
                        window.opener.postMessage("oauth-success", "*");
                        setTimeout(function() { window.close(); }, 1500);
                    } catch (e) {
                        console.error(e);
                    }
                </script>
            </body>
        </html>
        """
    except Exception as e:
        return f"""
        <html>
            <body style="font-family: sans-serif; background-color: #0f0c1b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(239,68,68,0.2); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                    <h2 style="color: #ef4444; margin-top: 0;">Authentication Failed</h2>
                    <p style="color: #94a3b8; font-size: 0.95rem; max-width: 400px; line-height: 1.5;">Error exchanging oauth token: {str(e)}</p>
                    <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 1rem;">
                        Close Window
                    </button>
                </div>
            </body>
        </html>
        """

@app.post("/api/drive/disconnect")
def disconnect_drive():
    try:
        if TOKEN_FILE.exists():
            os.remove(TOKEN_FILE)
        return {"status": "success", "message": "Disconnected Google Drive"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
