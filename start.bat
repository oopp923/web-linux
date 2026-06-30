@echo off
title Web Linux
echo.
echo  Web Linux Emulator
echo  ========================================
echo  Starting server...
start /b python server.py >nul 2>&1
if %errorlevel% neq 0 (
    echo  Error: Python not found. Install Python or use:
    echo    python server.py
    pause
    exit /b
)
timeout /t 2 /nobreak >nul
start http://localhost:8080/
echo  Server: http://localhost:8080/
echo  Close this window to stop.
pause
