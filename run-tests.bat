@echo off
echo Running YouTube Downloader Tests...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if backend server is running
curl -s http://localhost:5000/health >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Backend server is not running.
    echo Starting backend server...
    start "YouTube Downloader Backend" cmd /c "cd backend && npm install && npm run dev"
    echo Waiting for backend to start...
    timeout /t 5 /nobreak >nul
)

REM Run the tests
echo Running API tests...
cd backend
npm test

echo.
echo Tests completed. Press any key to exit.
pause
cmd /k
