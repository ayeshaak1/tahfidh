# Production Deployment Checklist - All Free

Use this checklist to deploy your app to production using **100% free services**.

## ✅ Pre-Deployment Setup

### 1. Google OAuth Configuration
- [x] OAuth Client ID created: `419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com`
- [x] OAuth Client Secret: `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`
- [ ] **Publish your app** in Google Console (OAuth consent screen → Publish App)
- [ ] Add production URLs to Google Console (after deployment)

### 2. Local Environment Setup
- [ ] Generate JWT secret: `node backend/generate-jwt-secret.js`
- [ ] Update `backend/.env` with:
  - [ ] JWT_SECRET (generated)
  - [ ] SESSION_SECRET (can be same as JWT_SECRET)
  - [ ] PostgreSQL password
  - [ ] Google OAuth credentials (already added ✅)

### 3. Test Locally
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Database connection works
- [ ] Email signup works
- [ ] Google OAuth works locally

## 🚀 Deployment Steps

### Step 1: Get Domain (Free)
- [ ] Choose domain provider:
  - **Free:** Freenom (.tk, .ml, .ga)
  - **Paid:** Namecheap (~$10/year for .com)
- [ ] Register domain
- [ ] Note domain name: `_________________`

### Step 2: Deploy Frontend (Netlify - Free)
- [ ] Push code to GitHub
- [ ] Go to [Netlify](https://www.netlify.com/)
- [ ] Connect GitHub repository
- [ ] Configure build:
  - Build command: `npm run build`
  - Publish directory: `build`
- [ ] Add environment variable:
  - `REACT_APP_API_URL=https://your-backend-url.com/api` (update after backend deploy)
- [ ] Deploy
- [ ] Note Netlify URL: `_________________`
- [ ] Add custom domain in Netlify
- [ ] Configure DNS (Netlify will show instructions)

### Step 3: Deploy Backend (Railway - Free)
- [ ] Go to [Railway](https://railway.app/)
- [ ] Sign up with GitHub
- [ ] New Project → Deploy from GitHub
- [ ] Select repository
- [ ] Set root directory: `backend`
- [ ] Add PostgreSQL database
- [ ] Add environment variables (see below)
- [ ] Deploy
- [ ] Note Railway URL: `_________________`
- [ ] (Optional) Add custom domain

### Step 4: Backend Environment Variables (Railway)

Add these in Railway's Variables tab:

```env
# Database (Railway auto-provides these)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_SSL=true

# JWT & Session (use your generated secrets)
JWT_SECRET=your-generated-jwt-secret
SESSION_SECRET=your-session-secret

# Google OAuth (YOUR CREDENTIALS)
GOOGLE_CLIENT_ID=419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://your-railway-url.up.railway.app/api/auth/google/callback
FRONTEND_URL=https://your-domain.com

# Quran API
QURAN_CLIENT_ID=99b3cedc-45f3-4e02-abae-14bb9f492983
QURAN_CLIENT_SECRET=MWai4iG9XJHKxnLN0bksbZy5ok

# Server
PORT=${{PORT}}
NODE_ENV=production
```

### Step 5: Update Frontend Environment (Netlify)

In Netlify dashboard → Site settings → Environment variables:
- [ ] Update: `REACT_APP_API_URL=https://your-railway-url.up.railway.app/api`
- [ ] Redeploy frontend

### Step 6: Update Google OAuth for Production

In [Google Cloud Console](https://console.cloud.google.com/):
- [ ] Go to APIs & Services → Credentials
- [ ] Edit your OAuth 2.0 Client ID
- [ ] Add to **Authorized JavaScript origins:**
  - [ ] `https://your-domain.com`
  - [ ] `https://www.your-domain.com` (if using www)
- [ ] Add to **Authorized redirect URIs:**
  - [ ] `https://your-railway-url.up.railway.app/api/auth/google/callback`
- [ ] Save

### Step 7: Configure DNS

- [ ] Go to your domain registrar
- [ ] Add DNS records (Netlify will show exact values):
  - Type: A or CNAME
  - Name: @ (or www)
  - Value: Netlify's provided value
- [ ] Wait for DNS propagation (5 min - 48 hours)
- [ ] Verify HTTPS is enabled (automatic on Netlify)

## ✅ Post-Deployment Testing

- [ ] Frontend loads at `https://your-domain.com`
- [ ] Backend health check: `https://your-backend-url.com/api/health`
- [ ] Email signup works
- [ ] Email signin works
- [ ] Google OAuth works
- [ ] Database stores users correctly
- [ ] Onboarding flow works
- [ ] All features work as expected

## 📊 Cost Summary

| Service | Cost | Status |
|---------|------|--------|
| Domain | $0-10/year | Free (Freenom) or Paid |
| Frontend (Netlify) | $0 | ✅ Free |
| Backend (Railway) | $0 | ✅ Free ($5/month credit) |
| Database (PostgreSQL) | $0 | ✅ Free (included) |
| **Total** | **$0-10/year** | ✅ **100% Free Option Available** |

## 🔒 Security Checklist

- [x] Credentials file deleted from repo
- [x] `.gitignore` updated to prevent credential commits
- [ ] All secrets in environment variables (not in code)
- [ ] Different secrets for production vs development
- [ ] HTTPS enabled (automatic on Netlify)
- [ ] Database uses SSL in production (`DB_SSL=true`)

## 📝 Notes

- **Google OAuth:** App must be **published** (not in testing mode) for all users
- **Railway Free Tier:** $5/month credit (usually enough for small apps)
- **Netlify:** Unlimited free deployments
- **DNS Propagation:** Can take up to 48 hours (usually 5-30 minutes)

## 🆘 Troubleshooting

**Backend won't start:**
- Check Railway logs
- Verify all environment variables are set
- Ensure JWT_SECRET is set

**Google OAuth fails:**
- Verify callback URL matches exactly
- Check app is published (not in testing)
- Verify URLs in Google Console

**Database connection fails:**
- Verify Railway PostgreSQL is running
- Check DB_SSL=true for hosted databases
- Verify database credentials

**Frontend can't connect to backend:**
- Check REACT_APP_API_URL is correct
- Verify CORS settings
- Check backend is running

## 🎉 You're Done!

Once all checkboxes are checked, your app is live and ready for users!

