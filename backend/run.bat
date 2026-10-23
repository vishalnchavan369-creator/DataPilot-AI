@echo off
setlocal

title DataPilot AI - Backend Server

echo.
echo ================================================
echo        DataPilot AI - Backend Server
echo ================================================
echo.

REM Move to the folder containing this BAT file
cd /d "%~dp0"

echo [1/5] Checking Python...

python --version >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: Python was not found.
    echo Please install Python 3.11 or later.
    echo.
    pause
    exit /b 1
)

python --version

echo.
echo [2/5] Checking virtual environment...

if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment not found.
    echo Creating .venv...
    echo.

    python -m venv .venv

    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create virtual environment.
        echo.
        pause
        exit /b 1
    )
)

echo Virtual environment ready.

echo.
echo [3/5] Activating virtual environment...

call ".venv\Scripts\activate.bat"

if errorlevel 1 (
    echo.
    echo ERROR: Could not activate virtual environment.
    echo.
    pause
    exit /b 1
)

echo Virtual environment activated.

echo.
echo [4/5] Checking dependencies...

if not exist "requirements.txt" (
    echo.
    echo ERROR: requirements.txt was not found.
    echo Current folder:
    echo %CD%
    echo.
    pause
    exit /b 1
)

python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Dependency installation failed.
    echo.
    pause
    exit /b 1
)

echo.
echo Dependencies are ready.

echo.
echo [5/5] Starting DataPilot AI API...
echo.
echo Backend:
echo http://127.0.0.1:8000
echo.
echo API Documentation:
echo http://127.0.0.1:8000/docs
echo.
echo Health Check:
echo http://127.0.0.1:8000/api/health
echo.
echo Press CTRL+C to stop the server.
echo ================================================
echo.

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

echo.
echo ================================================
echo DataPilot AI backend stopped.
echo ================================================
echo.

pause