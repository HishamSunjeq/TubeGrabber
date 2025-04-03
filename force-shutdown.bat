@echo off
echo ===================================================
echo Force Shutting Down YouTube Downloader...
echo ===================================================
echo.

REM Kill processes by port
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') DO (
    echo Terminating process on port 3000 (PID: %%P)...
    taskkill /F /PID %%P >nul 2>nul
)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') DO (
    echo Terminating process on port 5000 (PID: %%P)...
    taskkill /F /PID %%P >nul 2>nul
)

REM Kill any node processes that might be related to our app
taskkill /F /IM node.exe >nul 2>nul

REM Clean up any temporary files
if exist "%TEMP%\run_backend.vbs" del "%TEMP%\run_backend.vbs" >nul 2>nul
if exist "%TEMP%\run_frontend.vbs" del "%TEMP%\run_frontend.vbs" >nul 2>nul

echo.
echo All YouTube Downloader processes have been terminated.
echo.
timeout /t 2 > nul
