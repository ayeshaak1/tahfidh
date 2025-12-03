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
EOF

echo "[SUCCESS] backend/.env file created!"
echo ""
echo "========================================"
echo "  Next Steps:"
echo "========================================"
echo ""
echo "1. Edit backend/.env and add your Quran.com API credentials:"
echo "   - QURAN_CLIENT_ID"
echo "   - QURAN_CLIENT_SECRET"
echo ""
echo "2. Get your API credentials from:"
echo "   https://quran.com/api"
echo ""
echo "3. Run the app:"
echo "   - Backend: cd backend && npm install && npm run dev"
echo "   - Frontend: npm install && npm start"
echo ""


