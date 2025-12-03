# 🚀 Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Quran.com API credentials (Client ID and Client Secret)

## Step 1: Initialize Environment Variables

### Windows:

**Command Prompt:**
```cmd
setup-env.bat
```

**PowerShell:**
```powershell
.\setup-env.bat
```

### Mac/Linux:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

This will create a `backend/.env` file. **Edit it** and add your Quran.com API credentials:
- `QURAN_CLIENT_ID` - Your Client ID from Quran.com
- `QURAN_CLIENT_SECRET` - Your Client Secret from Quran.com

Get your credentials from: https://quran.com/api

## Step 2: Install Dependencies

Install all dependencies (frontend + backend):
```bash
npm run install:all
```

Or install separately:
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

## Step 3: Run the Application

### Option A: Run Both Servers (Recommended)

**Terminal 1 - Backend:**
```bash
npm run backend
```
Backend runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm start
```
Frontend runs on: http://localhost:3000

### Option B: Run Separately

**Backend only:**
```bash
cd backend
npm run dev    # Development mode (auto-restart)
# OR
npm start      # Production mode
```

**Frontend only:**
```bash
npm start
```

## 📝 Environment Variables

### Backend (`backend/.env`)
```env
QURAN_CLIENT_ID=your_client_id_here
QURAN_CLIENT_SECRET=your_client_secret_here
PORT=5000
NODE_ENV=development
```

### Frontend (Optional - `.env` in root)
```env
REACT_APP_API_URL=http://localhost:5000/api
```
(Defaults to `http://localhost:5000/api` if not set)

## 🎯 Quick Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Initialize environment variables |
| `npm run install:all` | Install all dependencies |
| `npm start` | Start frontend dev server |
| `npm run backend` | Start backend dev server |
| `npm run build` | Build for production |

## ⚠️ Troubleshooting

### PowerShell: "setup-env.bat is not recognized"
**Error:** `setup-env.bat : The term 'setup-env.bat' is not recognized...`

**Solution:** In PowerShell, you must use `.\setup-env.bat` (with the `.\` prefix):
```powershell
.\setup-env.bat
```

Or use Command Prompt (cmd.exe) instead, where you can use:
```cmd
setup-env.bat
```

### Backend won't start
- Check that `backend/.env` exists and has valid credentials
- Make sure port 5000 is not in use
- Run `cd backend && npm install` to ensure dependencies are installed

### Frontend can't connect to backend
- Make sure backend is running on port 5000
- Check `REACT_APP_API_URL` in frontend `.env` (if you created one)
- Default is `http://localhost:5000/api`

### API authentication errors
- Verify your Quran.com API credentials are correct
- Check that credentials are in `backend/.env` (not `.env.example`)
- Ensure no extra spaces or quotes around the values

## 📚 More Information

See [README.md](README.md) for detailed documentation.

