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

REM Create a temporary VBS script to run the backend invisibly
echo Creating launcher scripts...
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\run_backend.vbs"
echo WshShell.Run "cmd /c cd %CD%\backend && npm start", 0, false >> "%TEMP%\run_backend.vbs"

REM Create a temporary VBS script to run the frontend invisibly without opening a browser
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\run_frontend.vbs"
echo WshShell.Run "cmd /c cd %CD%\frontend && set BROWSER=none&& npm start", 0, false >> "%TEMP%\run_frontend.vbs"

REM Start the backend server using the VBS script (completely hidden)
echo Starting backend server...
cscript //nologo "%TEMP%\run_backend.vbs"

REM Wait for backend to initialize
echo Waiting for servers to initialize...
timeout /t 5 /nobreak > nul

REM Start the frontend using the VBS script (completely hidden)
echo Starting frontend...
cscript //nologo "%TEMP%\run_frontend.vbs"

REM Wait for frontend to initialize
timeout /t 3 /nobreak > nul

REM Open the browser manually (only once)
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
