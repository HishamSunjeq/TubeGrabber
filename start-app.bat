@echo off
echo Starting YouTube Downloader Application...
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

REM Check if Python is installed (needed for yt-dlp)
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Check if yt-dlp is installed
where yt-dlp >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo yt-dlp is not installed or not in PATH.
    echo Installing yt-dlp...
    pip install yt-dlp
    if %ERRORLEVEL% neq 0 (
        echo Failed to install yt-dlp. Please install it manually with:
        echo pip install yt-dlp
        echo.
        pause
        exit /b 1
    )
)

REM Kill any existing Node.js processes that might be running our servers
echo Stopping any existing servers...
taskkill /F /FI "WINDOWTITLE eq YouTube Downloader*" >nul 2>nul

REM Check if backend node_modules exists
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    cd ..
) else (
    echo Backend dependencies already installed, skipping npm install...
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
) else (
    echo Frontend dependencies already installed, skipping npm install...
)

REM Start the backend server
echo Starting backend server...
start "YouTube Downloader Backend" cmd /c "cd backend && npm run dev"

REM Start the frontend server in parallel
echo Starting frontend server...
start "YouTube Downloader Frontend" cmd /c "cd frontend && npm start"

REM Open the application in the default browser after a short delay
echo Waiting for servers to initialize...
timeout /t 8 /nobreak >nul
echo Opening application in browser...
start http://localhost:3000

echo.
echo YouTube Downloader Application is now running!
echo Backend server: http://localhost:5000
echo Frontend server: http://localhost:3000
echo.
echo To stop the application, close this window and the server windows.
echo.
pause
