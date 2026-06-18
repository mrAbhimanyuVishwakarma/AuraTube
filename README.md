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
