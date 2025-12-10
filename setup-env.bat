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
    echo QURAN_CLIENT_ID=YOUR_QURAN_CLIENT_ID_HERE
    echo QURAN_CLIENT_SECRET=YOUR_QURAN_CLIENT_SECRET_HERE
    echo.
    echo # Server Configuration
    echo PORT=5000
    echo NODE_ENV=development
    echo.
    echo # Database Configuration (PostgreSQL)
    echo DB_HOST=localhost
    echo DB_PORT=5432
    echo DB_NAME=tahfidh
    echo DB_USER=postgres
    echo DB_PASSWORD=your_postgres_password
    echo DB_SSL=false
    echo.
    echo # JWT Secret Key
    echo # Generate a secret key by running: node backend/generate-jwt-secret.js
    echo # Then copy the JWT_SECRET value and paste it here
    echo JWT_SECRET=your-jwt-secret-key-here
    echo.
    echo # Google OAuth Credentials
    echo # Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
    echo GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
    echo GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
    echo.
    echo # OAuth URLs (update for production after deployment)
    echo GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
    echo FRONTEND_URL=http://localhost:3000
    echo.
    echo # Session Secret (can use same as JWT_SECRET)
    echo SESSION_SECRET=your-session-secret-here
) > backend\.env

echo [SUCCESS] backend\.env file created!
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Generate JWT Secret:
echo    cd backend
echo    node generate-jwt-secret.js
echo    Copy the output and paste for JWT_SECRET and SESSION_SECRET
echo.
echo 2. Update PostgreSQL password in backend\.env
echo    - Set DB_PASSWORD to your PostgreSQL password
echo.
echo 3. Google OAuth credentials are already added!
echo    - Client ID and Secret are pre-filled
echo    - Update URLs for production after deployment
echo.
echo 4. Run the app:
echo    - Backend: cd backend ^&^& npm run dev
echo    - Frontend: npm start
echo.
pause


