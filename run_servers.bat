@echo off
title Sanctuary OS - Launch Services
echo ========================================================
echo   SANCTUARY // OS - Starting Backend & Frontend
echo ========================================================

echo [1/2] Starting Django API Backend on http://127.0.0.1:8000 ...
start "Sanctuary OS - Backend (Django)" cmd /k "call .\venv\Scripts\activate.bat && python serve_backend.py"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Sanctuary OS - Frontend (Vite)" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo Both servers initiated!
echo  - Frontend: http://localhost:5173/
echo  - Backend:  http://127.0.0.1:8000/
echo ========================================================
