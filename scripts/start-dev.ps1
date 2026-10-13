$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Error "Backend virtual environment not found at $python. Create it and install backend\requirements.txt first."
}

Write-Host "Starting Basha Finder backend at http://127.0.0.1:8000 ..."
Start-Process powershell.exe `
    -WorkingDirectory $backend `
    -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "& '$python' -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
    ) | Out-Null

Write-Host "Starting Basha Finder frontend at http://localhost:5173 ..."
Start-Process powershell.exe `
    -WorkingDirectory $frontend `
    -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "npm run dev -- --host 127.0.0.1"
    ) | Out-Null

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Basha Finder is starting in two terminal windows."
Write-Host "Frontend: http://localhost:5173/"
Write-Host "Backend:  http://127.0.0.1:8000/health"
Write-Host "Keep both terminal windows open while using the app."
