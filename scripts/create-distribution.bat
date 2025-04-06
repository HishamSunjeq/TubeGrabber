@echo off
echo ===================================================
echo Creating YouTube Downloader Distribution Package
echo ===================================================
echo.

REM Set the output directory and filename
set OUTPUT_DIR=dist
set OUTPUT_FILE=YouTube_Downloader.zip

REM Create output directory if it doesn't exist
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

REM Build the frontend for production
echo Building frontend for production...
cd frontend
call npm run build
cd ..

echo.
echo Creating distribution package...

REM Create a temporary directory for the distribution
if exist temp_dist rmdir /s /q temp_dist
mkdir temp_dist
mkdir temp_dist\backend
mkdir temp_dist\frontend
mkdir temp_dist\frontend\build

REM Copy necessary files
echo Copying files...

REM Copy backend files (excluding node_modules)
xcopy /E /I /Y backend\src temp_dist\backend\src
copy backend\package.json temp_dist\backend\
copy backend\package-lock.json temp_dist\backend\

REM Copy frontend build
xcopy /E /I /Y frontend\build temp_dist\frontend\build
copy frontend\package.json temp_dist\frontend\
copy frontend\package-lock.json temp_dist\frontend\

REM Copy root files
copy install-and-run.bat temp_dist\
copy start-app.bat temp_dist\
copy force-shutdown.bat temp_dist\
copy README.txt temp_dist\

REM Create empty directories for downloads and uploads
mkdir temp_dist\backend\downloads
mkdir temp_dist\backend\uploads

REM Create a desktop shortcut file
echo Creating desktop shortcut setup...
echo @echo off > temp_dist\create-shortcut.bat
echo echo Creating desktop shortcut for YouTube Downloader... >> temp_dist\create-shortcut.bat
echo powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\YouTube Downloader.lnk'); $Shortcut.TargetPath = '%~dp0start-app.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Launch YouTube Downloader Application'; $Shortcut.Save()" >> temp_dist\create-shortcut.bat
echo echo Desktop shortcut created successfully! >> temp_dist\create-shortcut.bat
echo echo. >> temp_dist\create-shortcut.bat
echo pause >> temp_dist\create-shortcut.bat

REM Create the ZIP file
echo Creating ZIP file...
if exist "%OUTPUT_DIR%\%OUTPUT_FILE%" del "%OUTPUT_DIR%\%OUTPUT_FILE%"
powershell -Command "& {Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('temp_dist', '%OUTPUT_DIR%\%OUTPUT_FILE%');}"

REM Clean up
rmdir /s /q temp_dist

echo.
echo Distribution package created successfully!
echo Location: %OUTPUT_DIR%\%OUTPUT_FILE%
echo.
echo Share this ZIP file with your friends. They just need to:
echo 1. Extract the ZIP file
echo 2. Run install-and-run.bat as administrator
echo 3. Use start-app.bat to launch the application
echo 4. Optionally run create-shortcut.bat to add a desktop shortcut
echo.
pause
