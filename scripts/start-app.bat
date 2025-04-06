@echo off
echo ===================================================
echo Starting YouTube Downloader Application...
echo ===================================================
echo.

REM Kill any existing Node.js processes that might be running our servers
echo Stopping any existing servers...
taskkill /F /FI "WINDOWTITLE eq YouTube Downloader*" >nul 2>nul

REM Kill any existing Node.js processes on ports 3000 and 5000
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') DO (
    taskkill /F /PID %%P >nul 2>nul
)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') DO (
    taskkill /F /PID %%P >nul 2>nul
)

REM Change to the project root directory
cd /d "%~dp0.."
set "PROJECT_ROOT=%CD%"

REM Create VBS scripts to run the servers invisibly
echo Creating launcher scripts...
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\run_backend.vbs"
echo WshShell.Run "cmd /c cd /d %PROJECT_ROOT%\backend && npm start", 0, false >> "%TEMP%\run_backend.vbs"

echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\run_frontend.vbs"
echo WshShell.Run "cmd /c cd /d %PROJECT_ROOT%\frontend && set BROWSER=none&& npm start", 0, false >> "%TEMP%\run_frontend.vbs"

REM Start the backend server invisibly
echo Starting backend server...
cscript //nologo "%TEMP%\run_backend.vbs"

REM Wait for backend to initialize
echo Waiting for backend server to initialize...
timeout /t 8 /nobreak > nul

REM Start the frontend invisibly
echo Starting frontend...
cscript //nologo "%TEMP%\run_frontend.vbs"

REM Wait for frontend to initialize
echo Waiting for frontend to initialize...
timeout /t 8 /nobreak > nul

REM Open the browser manually
echo Opening application in browser...
start http://localhost:3000

echo.
echo YouTube Downloader is running!
echo.
echo The application is now open in your browser.
echo.
echo Press any key to stop the application...
pause > nul

REM When the user presses a key, terminate all processes
echo.
echo Shutting down YouTube Downloader...

REM Kill processes by port
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') DO (
    taskkill /F /PID %%P >nul 2>nul
)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') DO (
    taskkill /F /PID %%P >nul 2>nul
)

REM Clean up temporary files
del "%TEMP%\run_backend.vbs" >nul 2>nul
del "%TEMP%\run_frontend.vbs" >nul 2>nul

echo.
echo YouTube Downloader has been shut down.
echo.
timeout /t 2 > nul
