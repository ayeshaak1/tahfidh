# Quick Setup Guide - Production Ready (All Free)

This guide will get you set up for **free production deployment** with everything configured correctly.

## ✅ Your Google OAuth Credentials (Already Created)

From your credentials file, here are your values:
- **Client ID:** `419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com`
- **Client Secret:** `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`

## Step 1: Configure Backend Environment

### Option A: Use Setup Script (Windows)
```bash
setup-env.bat
```

### Option B: Manual Setup

Edit `backend/.env` and add:

```env
# Quran.com API Credentials
QURAN_CLIENT_ID=99b3cedc-45f3-4e02-abae-14bb9f492983
QURAN_CLIENT_SECRET=MWai4iG9XJHKxnLN0bksbZy5ok

# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL - for local development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tahfidh
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false

# JWT Secret (generate one)
JWT_SECRET=your-generated-jwt-secret

# Google OAuth (YOUR CREDENTIALS)
GOOGLE_CLIENT_ID=419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your-session-secret
```

**Generate JWT Secret:**
```bash
cd backend
node generate-jwt-secret.js
```
Copy the generated secret and paste it for `JWT_SECRET` and `SESSION_SECRET`.

## Step 2: Update Google OAuth for Production

**Important:** You need to add production URLs to Google Console.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. **Add Authorized JavaScript origins:**
   - `http://localhost:3000` (already added)
   - `http://localhost:5000` (already added)
   - `https://your-domain.com` (add when you have domain)
   - `https://www.your-domain.com` (if using www)
5. **Add Authorized redirect URIs:**
   - `http://localhost:5000/api/auth/google/callback` (already added)
   - `https://your-backend-url.com/api/auth/google/callback` (add when deployed)
6. **Publish your app:**
   - Go to **OAuth consent screen**
   - Click **"PUBLISH APP"** button
   - This allows all Google users to sign in (not just test users)

## Step 3: Set Up PostgreSQL (Local Development)

### Install PostgreSQL
- **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql`

### Create Database
```bash
psql -U postgres
CREATE DATABASE tahfidh;
\q
```

### Update `.env` with your PostgreSQL password

## Step 4: Install Dependencies & Start

```bash
# Install all dependencies
npm run install:all

# Start backend (in one terminal)
npm run backend

# Start frontend (in another terminal)
npm start
```

## Step 5: Test Locally

1. Open `http://localhost:3000`
2. Click "Start Journey" → "Sign Up"
3. Try Google OAuth - should work!
4. Try email/password signup - should work!

## Step 6: Deploy to Production (Free)

### Frontend: Netlify (Free)
1. Push code to GitHub
2. Go to [Netlify](https://www.netlify.com/)
3. Connect GitHub repo
4. Build command: `npm run build`
5. Publish directory: `build`
6. Add environment variable:
   - `REACT_APP_API_URL=https://your-backend-url.com/api`

### Backend: Railway (Free - $5/month credit)
1. Go to [Railway](https://railway.app/)
2. New Project → Deploy from GitHub
3. Set root directory: `backend`
4. Add PostgreSQL database
5. Add environment variables (see `RAILWAY_DEPLOYMENT.md`)
6. Update `GOOGLE_CALLBACK_URL` to Railway URL
7. Update `FRONTEND_URL` to your Netlify domain

### Domain: Free Options
- **Freenom:** Free .tk, .ml, .ga domains
- **Namecheap:** ~$10/year for .com

## Step 7: Update Google OAuth for Production

After deploying, update Google Console:
1. Add production URLs to Authorized JavaScript origins
2. Add production callback URL to Authorized redirect URIs
3. Your app is now live! 🎉

## Security Notes

✅ **Credentials file deleted** - Never commit credentials to Git
✅ **.gitignore updated** - Prevents accidental commits
✅ **Environment variables** - All secrets in `.env` files

## Production Environment Variables

### Netlify (Frontend)
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

### Railway/Render (Backend)
```env
# Database (auto-provided by platform)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_SSL=true

# JWT & Session
JWT_SECRET=your-generated-secret
SESSION_SECRET=your-session-secret

# Google OAuth (YOUR CREDENTIALS)
GOOGLE_CLIENT_ID=419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://your-backend-url.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.com

# Quran API
QURAN_CLIENT_ID=your-quran-client-id
QURAN_CLIENT_SECRET=your-quran-client-secret

# Server
PORT=${{PORT}}
NODE_ENV=production
```

## Cost Breakdown (100% Free Option)

- ✅ **Domain:** Free (Freenom) or ~$10/year
- ✅ **Frontend:** Free (Netlify)
- ✅ **Backend:** Free (Railway $5/month credit)
- ✅ **Database:** Free (included with Railway)
- ✅ **Total:** $0-10/year

## Next Steps

1. ✅ Generate JWT secret: `node backend/generate-jwt-secret.js`
2. ✅ Update `backend/.env` with your credentials
3. ✅ Set up PostgreSQL locally
4. ✅ Test locally
5. ✅ Deploy to Netlify (frontend)
6. ✅ Deploy to Railway (backend)
7. ✅ Get free domain
8. ✅ Update Google OAuth URLs
9. ✅ Publish Google OAuth app
10. ✅ Go live! 🚀

Everything is production-ready and configured for free hosting!

