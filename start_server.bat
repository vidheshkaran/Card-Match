@echo off
echo ========================================
echo Starting AirWatch AI Flask Server
echo ========================================
cd backend
echo.
echo Checking Python...
python --version
echo.
echo Starting server...
echo.
if exist "venv\Scripts\python.exe" (
    echo Using virtual environment...
    venv\Scripts\python.exe app.py
) else (
    echo Using system Python...
    python app.py
)
echo.
echo Server stopped. Press any key to exit...
pause >nul
