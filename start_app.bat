@echo off
echo Starting AirWatch AI Server...
echo.
cd backend
if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)
echo.
echo Starting Flask server...
python start_server.py
pause

