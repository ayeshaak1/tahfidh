# Quick Deployment Guide

## 🚀 Fast Track to Production

### Step 1: Prepare Secrets

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 2: Deploy Backend (Render)

1. Go to https://dashboard.render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Name**: `tahfidh-backend`
   - **Build**: `cd backend && npm install`
   - **Start**: `cd backend && npm start`
   - **Plan**: Free
5. Add environment variables (see `.env.example`)
6. Deploy!

### Step 3: Create Database (Render)

1. New → PostgreSQL
2. Name: `tahfidh-db`
3. Copy connection details
4. Update backend env vars with DB credentials

### Step 4: Deploy Frontend (Netlify)

1. Go to https://app.netlify.com
2. Add new site → Import from Git
3. Connect GitHub repo
4. Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
6. Deploy!

### Step 5: Update OAuth

1. Google Cloud Console → OAuth Client
2. Add redirect URI: `https://your-backend.onrender.com/api/auth/google/callback`
3. Add origin: `https://your-app.netlify.app`
4. Update backend `FRONTEND_URL` env var

### Step 6: Test

Visit your Netlify URL and test:
- ✅ Sign up
- ✅ Sign in
- ✅ Google OAuth
- ✅ Memorize verses
- ✅ Data persistence

## 📝 Notes

- Render free tier spins down after inactivity (~30s wake time)
- All console.log statements are removed in production builds
- Secrets are in environment variables (never in code)
- Database auto-initializes on first connection

## 🆘 Troubleshooting

**Backend won't start?**
- Check all env vars are set
- Verify JWT_SECRET is set
- Check Render logs

**Frontend can't connect?**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Verify backend is running

**Database errors?**
- Verify DB credentials
- Check `DB_SSL=true` is set
- Ensure database is created

