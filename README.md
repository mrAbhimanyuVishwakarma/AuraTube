# AuraTube

## Project Overview

AuraTube is a web application that allows you to download YouTube videos and entire playlists in various resolutions. It features flexible download destinations, including direct-to-Google Drive uploads to save local disk space, and provides a modern glassmorphic UI.

---

## Architecture

```text
+-------------------+
|      Client       |
|  React / UI       |
+---------+---------+
          |
          v
+-------------------+
|   API Requests    |
+---------+---------+
          |
          v
+-------------------+
|   FastAPI App     |
+---------+---------+
          |
          |
          |
+---------v---------+
|   Downloader      |
|    (yt-dlp)       |
+---------+---------+
          |
          | Extract Video/Audio
          v
+---------v---------+
|   FFmpeg Merging  |
+---------+---------+
          |
          |
          v
+---------v---------+
|  Drive Uploader   |
|   (Google API)    |
+-------------------+
```

---

## Flowchart

```text
User Submits URL
    |
    v
Fetch Formats (yt-dlp)
    |
    v
Select Quality
    |
    v
Download to Local Server
    |
    +------------------+
    |                  |
    v                  v

Local Save Mode     Google Drive Mode
Keep on Disk        Upload to Drive
                    & Delete Local File
    |                  |
    v                  v
Download Completed
```

---

## Core Components

### 1. Backend Service
*   REST API powered by FastAPI
*   Video parsing and downloading using yt-dlp
*   Audio/Video merging using FFmpeg
*   Server-Sent Events (SSE) for real-time progress

### 2. Google Drive Integration
*   OAuth 2.0 Authentication
*   Resumable chunk uploads
*   Automatic local file cleanup

### 3. Frontend Service
*   Modern React UI (Vite)
*   Dark mode with glassmorphic elements
*   Real-time progress monitoring

---

## Tech Stack

*   **Backend:** Python (FastAPI), yt-dlp, FFmpeg, Google APIs Client
*   **Frontend:** React, Vite, CSS (Glassmorphism), Lucide React

---

## Prerequisites

*   **Python 3.10+**
*   **Node.js v18+**
*   **FFmpeg** (Must be added to system PATH)

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/mrAbhimanyuVishwakarma/AuraTube.git
cd AuraTube
```

### 2. Start the Application
Run the launcher script to automatically start both backend and frontend servers:
```cmd
run_app.bat
```

The application will be available at:
*   Frontend: `http://localhost:5173`
*   Backend API: `http://localhost:8000`

### 3. Google Drive Setup (Optional)
To enable direct-to-Drive downloads:
1. Create a project in Google Cloud Console.
2. Enable Google Drive API and set up the OAuth Consent Screen.
3. Create OAuth Client ID (Web Application) with redirect URI: `http://localhost:8000/api/drive/callback`
4. Enter the Client ID and Secret in the AuraTube Web UI settings.

---

## Deployment (Production)

This project is configured for a split-architecture deployment: Frontend on **Vercel** and Backend on **Render**.

### 1. Backend (Render)
The backend uses a Docker environment to ensure `ffmpeg` is available for `yt-dlp`.
1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Render should automatically detect the `render.yaml` configuration. If not, choose **Docker** as the environment and set the `Dockerfile` path to `./backend/Dockerfile`.
4. In the Render Dashboard, add the following Environment Variables:
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - `BACKEND_URL`: Your Render backend URL (e.g., `https://your-backend.onrender.com`)
   - `GOOGLE_CLIENT_ID`: (Optional) For Google Drive integration
   - `GOOGLE_CLIENT_SECRET`: (Optional) For Google Drive integration

### 2. Frontend (Vercel)
The frontend uses Vite and is ready for Vercel.
1. Create a new Project on [Vercel](https://vercel.com/) and import your repository.
2. The root `vercel.json` will automatically configure Vercel to build the `frontend` folder.
3. In the Vercel Dashboard, go to **Settings > Environment Variables** and add:
   - `VITE_BACKEND_URL`: Your deployed Render backend URL (e.g., `https://your-backend.onrender.com`)
4. Deploy!

<img width="514" height="395" alt="image" src="https://github.com/user-attachments/assets/927b6236-d1ba-49c0-933a-32cb32d86f95" />

<img width="328" height="376" alt="image" src="https://github.com/user-attachments/assets/a507a20b-6b8b-4ecd-ab45-e24ca0500bbc" />

<img width="674" height="388" alt="image" src="https://github.com/user-attachments/assets/784ddf12-b84f-47f6-9cff-24fdccb2ae2e" />
