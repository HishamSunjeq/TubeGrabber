@echo off
echo ===================================================
echo YouTube Downloader - Installation and Setup
echo ===================================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo Checking system requirements...

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Installing Node.js...
    echo Downloading Node.js installer...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi' -OutFile 'node-installer.msi'}"
    echo Installing Node.js...
    start /wait msiexec /i node-installer.msi /qn
    del node-installer.msi
    
    REM Verify installation
    where node >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo Node.js installation failed.
        echo Please download and install Node.js manually from https://nodejs.org/
        pause
        exit /b 1
    )
    echo Node.js installed successfully.
) else (
    echo Node.js is already installed.
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python is not installed. Installing Python...
    echo Downloading Python installer...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe' -OutFile 'python-installer.exe'}"
    echo Installing Python...
    start /wait python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-installer.exe
    
    REM Verify installation
    where python >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo Python installation failed.
        echo Please download and install Python manually from https://www.python.org/downloads/
        pause
        exit /b 1
    )
    echo Python installed successfully.
) else (
    echo Python is already installed.
)

REM Install yt-dlp
echo Installing yt-dlp...
pip install --upgrade yt-dlp
if %ERRORLEVEL% neq 0 (
    echo Failed to install yt-dlp.
    echo Please run this command manually: pip install --upgrade yt-dlp
    pause
    exit /b 1
)

REM Install aria2 if it's being used in your application
echo Installing aria2...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip' -OutFile 'aria2.zip'}"
powershell -Command "& {Expand-Archive -Path 'aria2.zip' -DestinationPath 'aria2' -Force}"
copy aria2\aria2-1.36.0-win-64bit-build1\aria2c.exe %WINDIR%\System32\
del aria2.zip
rmdir /s /q aria2

REM Install dependencies for backend and frontend
echo Installing application dependencies...
cd backend
call npm install --production
cd ..\frontend
call npm install --production
cd ..

echo.
echo Installation completed successfully!
echo.
echo To start the YouTube Downloader, run the "start-app.bat" file.
echo.
pause
