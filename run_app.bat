@echo off
title AuraTube Launcher
echo ===================================================
echo             Starting AuraTube App
echo ===================================================
echo.

:: Check backend venv
if not exist "backend\.venv\Scripts\activate" (
    echo [ERROR] Python virtual environment not found in backend\.venv
    echo Please ensure the backend is set up correctly.
    pause
    exit /b
)

:: Start Backend Server
echo [1/2] Starting FastAPI Backend on port 8000...
start "AuraTube Backend (FastAPI)" cmd /k "cd backend && .venv\Scripts\activate && python run.py"

:: Start Frontend Server
echo [2/2] Starting React Vite Frontend on port 5173...
start "AuraTube Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo AuraTube started successfully!
echo.
echo - Web Dashboard:   http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo.
echo Leave this launcher window open, or press any key to close this launcher.
echo (The backend and frontend console windows will continue running).
echo ===================================================
pause
