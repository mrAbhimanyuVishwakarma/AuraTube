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
start /B "" cmd /c "cd backend && call .venv\Scripts\activate && python run.py"

:: Start Frontend Server
echo [2/2] Starting React Vite Frontend on port 8089...
start /B "" cmd /c "cd frontend && npm run dev"

echo.
echo Waiting for servers to start...
timeout /t 3 >nul

echo Opening browser...
start http://localhost:8089

echo.
echo ===================================================
echo AuraTube started successfully!
echo.
echo - Web Dashboard:   http://localhost:8089
echo - Backend API Docs: http://localhost:8000/docs
echo.
echo Close this launcher window to stop the servers.
echo ===================================================

:: Keep window open to allow stopping servers by closing it
:wait_loop
timeout /t 3600 /nobreak >nul
goto wait_loop
