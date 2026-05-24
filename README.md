# AuraTube - YouTube Video & Playlist Downloader

AuraTube is a premium self-hosted web application that allows you to download YouTube videos and entire playlists in various resolutions (similar to Snaptube) and save them to your local system or upload them directly to your Google Drive without keeping them permanently on your local disk.

---

## Key Features

1. **Flexible Download Destinations**:
   - **Local System**: Saves videos directly into a configured directory on your computer.
   - **Google Drive (Direct-to-Drive)**: Stream/download files to a temporary folder, upload directly to Google Drive via the official API, and immediately clean up the local disk space.
2. **Quality Selection (Snaptube-Style)**:
   - Supports downloading all YouTube video resolutions (e.g., 4K, 1440p, 1080p, 720p, 480p, 360p).
   - Audio extraction support (MP3 conversion or native M4A).
   - Automatically merges separate video and audio streams using `ffmpeg` for high resolutions.
3. **Playlist Downloader**:
   - Paste a playlist link to load the entire list.
   - Check/uncheck specific videos to download.
   - Set a global quality for bulk downloading or download individually.
4. **Modern Glassmorphic UI**:
   - Sleek violet/cyan neon dark mode theme.
   - Real-time download/upload progress status, download speeds, and ETAs powered by Server-Sent Events (SSE).

---

## Tech Stack

- **Backend**: Python (FastAPI), `yt-dlp` (for reliable parsing/downloading), Google APIs Client (for OAuth and Drive uploads), and `ffmpeg` (for merging streams).
- **Frontend**: React, Vite, Lucide React (icons), Vanilla CSS (animations & custom properties).

---

## Prerequisites

- **Python 3.10+** (Python 3.14 is verified and supported)
- **Node.js v18+**
- **FFmpeg**: Must be installed and available in your system `PATH` (already pre-configured on your system).

---

## How to Set Up & Run

1. **Start the Application**:
   Simply run the launcher script from the root folder:
   ```cmd
   run_app.bat
   ```
   This will automatically spin up two windows:
   - A window for the FastAPI backend running on `http://localhost:8000`.
   - A window for the React dev server running on `http://localhost:5173`.

2. **Open the Dashboard**:
   Open your browser and navigate to `http://localhost:5173`.

---

## Google Drive Integration Setup

To download directly to Google Drive, you need to create OAuth credentials in Google Cloud:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "AuraTube").
3. Go to **APIs & Services > Library**, search for **Google Drive API**, and click **Enable**.
4. Go to **APIs & Services > OAuth Consent Screen**:
   - Choose **External** user type.
   - Fill in the required fields (App name, support email, etc.).
   - Under **Scopes**, add `https://www.googleapis.com/auth/drive.file` (this scope allows AuraTube to read and write files it creates).
   - Set the publishing status to **Testing** and add your own Google email address as a **Test User** (required while in development).
5. Go to **APIs & Services > Credentials**:
   - Click **Create Credentials** &rarr; **OAuth Client ID**.
   - Select **Web Application** as the application type.
   - Add **Authorized Redirect URI**: `http://localhost:8000/api/drive/callback`
   - Click **Create** and copy the generated **Client ID** and **Client Secret**.
6. Paste these credentials into the **Setup & Integrations** panel in the AuraTube Web UI and click **Save Configurations**.
7. Click **Connect Google Account** to authenticate. A popup will appear. Grant the permissions and close the tab once connected!

---

## Development Notes

### Backend Folder
- `backend/app/main.py`: Core FastAPI app and endpoints.
- `backend/app/downloader.py`: Handles yt-dlp downloading and progress hooks.
- `backend/app/drive_uploader.py`: Handles OAuth flow and resumable chunk uploads.
- `backend/app/config.py`: Directory paths and settings manager.

### Frontend Folder
- `frontend/src/App.jsx`: Main interface dashboard.
- `frontend/src/index.css`: Theme customization, custom variables, and styles.
- `frontend/src/components/`: Sub-components for input, format grid, playlist listing, settings, and progress cards.
