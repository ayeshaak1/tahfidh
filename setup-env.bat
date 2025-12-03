@echo off
echo ========================================
echo   Tahfidh - Environment Setup Script
echo ========================================
echo.

REM Check if .env file already exists
if exist "backend\.env" (
    echo [WARNING] backend\.env already exists!
    echo.
    set /p overwrite="Do you want to overwrite it? (y/N): "
    if /i not "%overwrite%"=="y" (
        echo Setup cancelled.
        pause
        exit /b
    )
)

echo Creating backend\.env file...
echo.

REM Create .env file with template
(
    echo # Quran.com API Credentials
    echo # Get these from: https://quran.com/api
    echo QURAN_CLIENT_ID=99b3cedc-45f3-4e02-abae-14bb9f492983
    echo QURAN_CLIENT_SECRET=MWai4iG9XJHKxnLN0bksbZy5ok
    echo.
    echo # Server Configuration
    echo PORT=5000
    echo NODE_ENV=development
) > backend\.env

echo [SUCCESS] backend\.env file created!
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Edit backend\.env and add your Quran.com API credentials:
echo    - QURAN_CLIENT_ID
echo    - QURAN_CLIENT_SECRET
echo.
echo 2. Get your API credentials from:
echo    https://quran.com/api
echo.
echo 3. Run the app:
echo    - Backend: cd backend ^&^& npm install ^&^& npm run dev
echo    - Frontend: npm install ^&^& npm start
echo.
pause


