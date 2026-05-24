# AuraTube — AI Agent Handoff & Project Context Document

> **Last updated:** 2026-05-24
> **Project Location:** `C:\Users\Abhimanyu Vishwakarm\GitHub\AuraTube`
> **Original workspace:** `C:\Users\Abhimanyu Vishwakarm\GitHub\ytvideo to drive` *(same code, renamed folder)*

---

## 🎯 Project Overview

**AuraTube** is a full-stack SaaS web application that allows users to:
- Download YouTube videos and playlists (up to 4K)
- Upload videos directly to their **Google Drive** account (server-side, no bandwidth used)
- Manage downloads via a dashboard
- Sign in / create an account
- Subscribe to **Free** or **Premium** plans (Stripe/Razorpay billing integrated)

---

## 🗂 Project Structure

```
AuraTube/
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── App.jsx         # Main app component (all routing, header, hero, stats, sections)
│       ├── index.css       # Design system (CSS variables, dark/light theme, animations)
│       └── components/
│           ├── UrlInput.jsx          # YouTube URL paste input
│           ├── FormatSelector.jsx    # Format & quality selection
│           ├── PlaylistManager.jsx   # Playlist handling
│           ├── GoogleDriveSetup.jsx  # Google Drive connect panel
│           ├── DownloadDashboard.jsx # Active download task management
│           ├── AuthModal.jsx         # Login / Register modal
│           ├── PricingModal.jsx      # Pricing tiers popup
│           └── FaqModal.jsx          # Smart AI-style FAQ assistant chatbot
├── backend/                # FastAPI Python backend
│   ├── app/
│   │   ├── main.py         # FastAPI routes (download, drive, auth, status)
│   │   ├── downloader.py   # yt-dlp integration
│   │   ├── drive_uploader.py # Google Drive API upload
│   │   ├── auth.py         # JWT auth helpers
│   │   ├── billing.py      # Stripe / Razorpay webhook handlers
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── database.py     # DB session setup
│   │   └── config.py       # Environment variable config
│   ├── requirements.txt
│   └── run.py
├── vercel.json             # Vercel multi-service deployment config
├── run_app.bat             # Windows one-click dev startup script
└── TESTING_TODO.md         # Feature checklist
```

---

## ✅ Features Already Built

### Frontend
- [x] **Dark/Light theme toggle** — persisted in localStorage
- [x] **Responsive navbar** — hamburger menu on mobile (≤768px), full tabs on desktop
- [x] **Nav scroll links** — Home, Features, About, Contact Us scroll to their sections
- [x] **Hero section** with animated stats (4K, Login/Drive quota, 12K+ videos)
- [x] **Paste YouTube URL** input with Analyze button (orange theme accent)
- [x] **Google Drive Login panel** — shows real storage quota when connected
- [x] **FAQ Assistant modal** — smart keyword-matching chatbot with typing animation, pre-saved Q&A, clickable suggestion chips that appear on input focus/hover
- [x] **About section** — bottom of page
- [x] **Contact Us section** — includes FAQ assistant button
- [x] **PricingModal** — Free vs Premium comparison popup
- [x] **AuthModal** — Sign in / Register

### Backend
- [x] FastAPI server with CORS
- [x] YouTube download via yt-dlp
- [x] Google Drive OAuth2 connect + upload
- [x] Drive storage quota fetched from Google API (`storageQuota.limit`)
- [x] JWT user authentication
- [x] SQLAlchemy database (SQLite locally, can switch to PostgreSQL)
- [x] Stripe & Razorpay billing endpoints

---

## 🔧 How to Run Locally

### Backend
```bash
cd AuraTube/backend
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd AuraTube/frontend
npm run dev
```

Or use the one-click **`run_app.bat`** in the project root.

Frontend runs at: **http://localhost:5173**
Backend runs at: **http://localhost:8000**

---

## 🌐 Environment Variables

### Frontend (`frontend/.env`)
```
VITE_BACKEND_URL=http://127.0.0.1:8000   # Change to live URL for production
```
The `App.jsx` is already configured to use `import.meta.env.VITE_BACKEND_URL` with a localhost fallback.

### Backend (`backend/config.py` / `.env`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SECRET_KEY` (JWT)
- `STRIPE_SECRET_KEY`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`

---

## 🚀 Vercel Deployment

A `vercel.json` is present at the root for deploying both frontend + backend to Vercel.

**Important Caveat:** Vercel Serverless Functions have a **10-second timeout** on the free tier. For heavy video downloads, consider hosting the backend on:
- **Render.com** (recommended, has free tier)
- **Railway.app**
- **Fly.io**

### Vercel Setup Steps
1. Push code to GitHub (`mrAbhimanyuVishwakarm/AuraTube`)
2. Import to Vercel → set Root Directory to `frontend/` if deploying frontend only
3. Add environment variable: `VITE_BACKEND_URL` = your live backend URL
4. Deploy

---

## 🎨 Design System

**Color palette** (CSS variables in `index.css`):
- `--accent-primary`: Orange (`#f97316`)
- `--bg-main`: Very dark (`#0a0a0a`)
- `--bg-card`: Dark card (`#141414`)
- `--text-main`: White/light
- `--text-muted`: Muted grey

**Fonts:** System default (can upgrade to Inter/Outfit from Google Fonts)

---

## 🐛 Known Issues / Next Steps

- [ ] **Backend on Vercel times out** for large downloads — recommend separate backend host
- [ ] Mobile menu does not include Google Drive pill / theme toggle (they're in the full-screen overlay instead)
- [ ] No progress bar for direct-to-Drive uploads (only polling task status)
- [ ] SQLite DB (`aura_tube.db`) is local — needs PostgreSQL for production
- [ ] Google OAuth redirect URI needs updating for production domain

---

## 📝 For the Next AI Agent

If you are picking this up from here:
1. **Read this file first** for full context.
2. Open the workspace at `C:\Users\Abhimanyu Vishwakarm\GitHub\AuraTube`
3. The main files you'll edit most often are:
   - `frontend/src/App.jsx` — main UI, hero, stats, sections
   - `frontend/src/index.css` — all styling and responsive rules
   - `frontend/src/components/FaqModal.jsx` — FAQ chatbot logic
   - `backend/app/main.py` — all API endpoints
4. Start the dev servers before making UI changes so you can preview live
5. The user prefers **orange accent color** (`var(--accent-primary)`) for all headings/icons matching the brand

