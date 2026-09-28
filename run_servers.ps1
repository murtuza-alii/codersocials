Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SANCTUARY // OS - Launching Services" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/2] Launching Django API Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; & '.\venv\Scripts\python.exe' 'serve_backend.py'"

Write-Host "[2/2] Launching React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev -- --host"

Write-Host "`nBoth servers launched successfully!" -ForegroundColor Yellow
Write-Host " - Frontend: http://localhost:5173/" -ForegroundColor Cyan
Write-Host " - Backend:  http://127.0.0.1:8000/" -ForegroundColor Cyan
