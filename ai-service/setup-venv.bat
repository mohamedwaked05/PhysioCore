@echo off
echo Setting up AI service virtual environment with Python 3.13...

cd /d C:\Users\mohaw\OneDrive\Desktop\PhysioCore\ai-service

:: Create venv using Python 3.13
py -3.13 -m venv venv
if errorlevel 1 (
    echo ERROR: Python 3.13 not found.
    pause
    exit /b 1
)

:: Activate and install dependencies
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Setup complete. Run start-dev.bat to launch all services.
pause
