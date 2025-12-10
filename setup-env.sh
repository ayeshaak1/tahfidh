#!/bin/bash

echo "========================================"
echo "  Tahfidh - Environment Setup Script"
echo "========================================"
echo ""

# Check if .env file already exists
if [ -f "backend/.env" ]; then
    echo "[WARNING] backend/.env already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "Creating backend/.env file..."
echo ""

# Create .env file with template
cat > backend/.env << 'EOF'
# Quran.com API Credentials
# Get these from: https://quran.com/api
QURAN_CLIENT_ID=YOUR_CLIENT_ID_HERE
QURAN_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tahfidh
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false

# JWT Secret Key
# Generate a secret key by running: node backend/generate-jwt-secret.js
# Then copy the JWT_SECRET value and paste it here
JWT_SECRET=your-jwt-secret-key-here

# Google OAuth Credentials
# Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# OAuth URLs (update for production after deployment)
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Session Secret (can use same as JWT_SECRET)
SESSION_SECRET=your-session-secret-here
EOF

echo "[SUCCESS] backend/.env file created!"
echo ""
echo "========================================"
echo "  Next Steps:"
echo "========================================"
echo ""
echo "1. Generate JWT Secret:"
echo "   cd backend"
echo "   node generate-jwt-secret.js"
echo "   Copy the output and paste for JWT_SECRET and SESSION_SECRET"
echo ""
echo "2. Update PostgreSQL password in backend/.env"
echo "   - Set DB_PASSWORD to your PostgreSQL password"
echo ""
echo "3. Google OAuth credentials are already added!"
echo "   - Client ID and Secret are pre-filled"
echo "   - Update URLs for production after deployment"
echo ""
echo "4. Run the app:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: npm start"
echo ""
