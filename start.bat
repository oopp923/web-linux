@echo off
title Web Linux
echo.
echo  Web Linux Emulator
echo  ========================================

where python >nul 2>nul
if %errorlevel%==0 (
    echo  Starting with Python...
    start /b python server.py >nul 2>&1
    goto wait_ready
)

where powershell >nul 2>nul
if %errorlevel%==0 (
    echo  Starting with PowerShell...
    start /b powershell -NoProfile -File "%~dp0server.ps1" >nul 2>&1
    goto wait_ready
)

echo  Error: Python or PowerShell not found.
pause
exit /b

:wait_ready
echo  Waiting for server...
powershell -NoProfile -Command "try{$c=New-Object Net.Sockets.TcpClient 'localhost',8080;$c.Close();exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel%==0 goto open
timeout /t 1 /nobreak >nul
goto wait_ready

:open
echo  Opening browser...
start http://localhost:8080/
echo  Server running. Close this window to stop.
pause
