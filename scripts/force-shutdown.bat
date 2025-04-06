@echo off
echo ===================================================
echo Shutting down YouTube Downloader Application...
echo ===================================================
echo.

REM Kill any existing Node.js processes that might be running our servers
echo Stopping all servers...
taskkill /F /FI "WINDOWTITLE eq YouTube Downloader*" >nul 2>nul

REM Kill any existing Node.js processes on ports 3000 and 5000
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') DO (
    echo Killing process with PID: %%P
    taskkill /F /PID %%P >nul 2>nul
)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') DO (
    echo Killing process with PID: %%P
    taskkill /F /PID %%P >nul 2>nul
)

echo.
echo All YouTube Downloader processes have been terminated.
echo ===================================================
