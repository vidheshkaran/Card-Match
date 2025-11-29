# AirWatch AI Server Startup Script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting AirWatch AI Server..." -ForegroundColor Green
Write-Host ""

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
}

# Run the Flask app
Write-Host "Starting Flask server on http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
python app.py

