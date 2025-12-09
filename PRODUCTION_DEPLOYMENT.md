# Complete Production Deployment Guide - Step by Step

This is a comprehensive guide to deploy your Tahfidh Quran Memorization Tracker to production using **free** hosting services. Follow each step carefully.

## Table of Contents

1. [Prerequisites & Account Setup](#prerequisites--account-setup)
2. [Generate Required Secrets](#generate-required-secrets)
3. [Get Production API Credentials](#get-production-api-credentials)
4. [Deploy Backend to Render](#deploy-backend-to-render)
5. [Deploy Frontend to Netlify](#deploy-frontend-to-netlify)
6. [Configure OAuth](#configure-oauth)
7. [Final Verification](#final-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites & Account Setup

### 1. GitHub Repository

**If your code is not on GitHub yet:**

1. Go to [GitHub](https://github.com)
2. Sign in or create an account
3. Click the "+" icon in the top right → "New repository"
4. Name it: `tahfidh-quran-tracker` (or any name you prefer)
5. Make it **Public** (required for free tiers)
6. Click "Create repository"
7. Push your local code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/tahfidh-quran-tracker.git
   git branch -M main
   git push -u origin main
   ```

**If your code is already on GitHub:**
- Make sure it's pushed and up to date
- Note your repository URL (you'll need it)

### 2. Render Account Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "Get Started for Free" or "Sign Up"
3. Choose "Sign up with GitHub" (recommended - easier integration)
4. Authorize Render to access your GitHub account
5. You're now logged into Render

### 3. Netlify Account Setup

You mentioned you already have a Netlify account, so:
- Just make sure you're logged in at [Netlify Dashboard](https://app.netlify.com/)

### 4. Google Cloud Console (for OAuth)

**If you don't have Google OAuth set up yet:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click "New Project"
5. Name it: `Tahfidh App` (or any name)
6. Click "Create"
7. Wait for project creation, then select the project

**Enable Google+ API:**
1. In the left menu, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

**Create OAuth 2.0 Credentials:**
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: `Tahfidh Quran Tracker`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue" through the steps
4. Back to creating OAuth client:
   - Application type: **Web application**
   - Name: `Tahfidh Production`
   - **Authorized JavaScript origins**: (leave empty for now, we'll add later)
   - **Authorized redirect URIs**: (leave empty for now, we'll add later)
   - Click "Create"
5. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these later
   - Save them somewhere safe (password manager, notes, etc.)

### 5. Quran.com API Credentials

**Get Production API Credentials:**

1. Go to [Quran.com API Portal](https://quran.api-docs.io/) or contact their support
2. Request production API credentials
3. You'll receive:
   - **Client ID** (production)
   - **Client Secret** (production)
4. **IMPORTANT**: Save these credentials - you'll need them later

**Note**: If you're using pre-production credentials for testing, you'll need to get production ones. The backend is configured to use production API when `NODE_ENV=production`.

---

## Generate Required Secrets

### Generate JWT Secret

Open your terminal/command prompt and run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

**Copy this entire string** - this is your `JWT_SECRET`. Save it somewhere safe.

**Generate Session Secret (optional):**
- You can use the same value as JWT_SECRET, or generate a new one:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Get Production API Credentials

### Quran.com API

1. Contact Quran.com API support or check their developer portal
2. Request production credentials
3. You'll receive:
   - `QURAN_CLIENT_ID` (production)
   - `QURAN_CLIENT_SECRET` (production)

**Important**: These are different from development/pre-production credentials.

### Google OAuth

You should have these from the setup above:
- `GOOGLE_CLIENT_ID` (from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)

---

## Deploy Backend to Render

### Step 1: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** button (top right)
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `tahfidh-db`
   - **Database**: `tahfidh`
   - **User**: `tahfidh_user`
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **PostgreSQL Version**: Latest (14 or 15)
   - **Plan**: **Free** (or Starter if you want better performance)
4. Click **"Create Database"**
5. Wait for database creation (takes 1-2 minutes)
6. **IMPORTANT**: Once created, you'll see connection details:
   - **Internal Database URL**: `postgresql://tahfidh_user:XXXXX@dpg-xxxxx-a/tahfidh`
   - **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `tahfidh`
   - **User**: `tahfidh_user`
   - **Password**: `XXXXX` (click "Show" to reveal)
   
   **Copy all these values** - you'll need them in the next step!

### Step 2: Create Web Service (Backend)

1. In Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub account (if not already connected):
   - Click "Connect account" or "Configure account"
   - Authorize Render to access your repositories
4. Select your repository: `tahfidh-quran-tracker` (or your repo name)
5. Configure the service:

   **Basic Settings:**
   - **Name**: `tahfidh-backend`
   - **Region**: Same as database (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: Leave empty (root is fine)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free** (or Starter if you want better performance)

   **Advanced Settings (click to expand):**
   - **Auto-Deploy**: `Yes` (deploys automatically on git push)
   - **Health Check Path**: Leave empty

6. **Environment Variables** - Click "Add Environment Variable" for each:

   **Required Variables:**
   ```
   NODE_ENV = production
   PORT = 10000
   FRONTEND_URL = https://your-app-name.netlify.app
   ```
   *(We'll update FRONTEND_URL after deploying frontend)*

   **Security:**
   ```
   JWT_SECRET = <paste-your-generated-jwt-secret>
   SESSION_SECRET = <paste-your-jwt-secret-or-generate-new-one>
   ```

   **Google OAuth:**
   ```
   GOOGLE_CLIENT_ID = <paste-from-google-cloud-console>
   GOOGLE_CLIENT_SECRET = <paste-from-google-cloud-console>
   ```

   **Quran API:**
   ```
   QURAN_CLIENT_ID = <paste-production-quran-client-id>
   QURAN_CLIENT_SECRET = <paste-production-quran-client-secret>
   ```

   **Database (from Step 1):**
   ```
   DB_HOST = <paste-host-from-database>
   DB_PORT = 5432
   DB_NAME = tahfidh
   DB_USER = tahfidh_user
   DB_PASSWORD = <paste-password-from-database>
   DB_SSL = true
   ```

7. Click **"Create Web Service"**
8. Wait for deployment (takes 3-5 minutes)
   - You'll see build logs in real-time
   - Watch for any errors
9. Once deployed, you'll see:
   - **Service URL**: `https://tahfidh-backend.onrender.com`
   - **Status**: Live (green)
   
   **Copy this URL** - you'll need it for the frontend!

### Step 3: Verify Backend is Working

1. Open your browser
2. Visit: `https://your-backend-name.onrender.com/api/surahs`
3. You should see JSON data (list of surahs)
4. If you see an error, check the Render logs:
   - In Render dashboard → Your service → "Logs" tab
   - Look for error messages

**Common Issues:**
- **"JWT_SECRET is not set"**: Make sure you added the JWT_SECRET environment variable
- **Database connection error**: Verify all DB_* environment variables are correct
- **Port error**: Make sure PORT=10000 is set

---

## Deploy Frontend to Netlify

### Step 1: Connect Repository

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"** (or GitLab/Bitbucket if you use those)
4. Authorize Netlify to access your GitHub account (if first time)
5. Select your repository: `tahfidh-quran-tracker` (or your repo name)

### Step 2: Configure Build Settings

Netlify should auto-detect React, but verify these settings:

**Build settings:**
- **Base directory**: (leave empty - root is fine)
- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node version**: `18` (or latest LTS)

**If auto-detection didn't work, click "Show advanced" and set manually.**

### Step 3: Add Environment Variables

Before deploying, click **"Show advanced"** → **"New variable"**:

```
REACT_APP_API_URL = https://your-backend-name.onrender.com/api
```

**Important**: Replace `your-backend-name` with your actual Render backend URL (from the backend deployment step above).

**Example:**
```
REACT_APP_API_URL = https://tahfidh-backend.onrender.com/api
```

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (takes 2-4 minutes)
   - You'll see build logs in real-time
   - Watch for any errors
3. Once deployed, you'll see:
   - **Site URL**: `https://random-name-12345.netlify.app`
   - **Status**: Published

**Note**: Netlify generates a random name. You can change it:
- Go to "Site settings" → "Change site name"
- Enter: `tahfidh` (or any name you want)
- Your new URL: `https://tahfidh.netlify.app`

**Copy your Netlify URL** - you'll need it for the next steps!

### Step 5: Update Backend FRONTEND_URL

1. Go back to Render dashboard
2. Click on your backend service (`tahfidh-backend`)
3. Go to "Environment" tab
4. Find `FRONTEND_URL` variable
5. Click the edit icon (pencil)
6. Update value to your Netlify URL:
   ```
   https://your-app-name.netlify.app
   ```
7. Click "Save Changes"
8. Render will automatically redeploy (takes 1-2 minutes)

---

## Configure OAuth

### Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** → **"Credentials"**
4. Click on your OAuth 2.0 Client ID (the one you created earlier)
5. Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**:
   ```
   https://your-app-name.netlify.app
   https://your-backend-name.onrender.com
   ```
   *(Replace with your actual URLs)*

6. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**:
   ```
   https://your-backend-name.onrender.com/api/auth/google/callback
   ```
   *(Replace with your actual backend URL)*

7. Click **"Save"**

### Test OAuth

1. Visit your Netlify site
2. Click "Sign in with Google"
3. You should be redirected to Google login
4. After login, you should be redirected back to your app

**If it doesn't work:**
- Check that redirect URI matches exactly (including `/api/auth/google/callback`)
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in Render
- Check Render logs for errors

---

## Final Verification

### Automated Testing

**Quick Test (Recommended):**
```bash
npm run test:production
```

Or run directly:
```bash
node test-production.js
```

This will test all backend endpoints, authentication, and core functionality automatically.

**Browser-Based Testing:**
1. Open `test-production.html` in your browser
2. Enter your backend and frontend URLs
3. Click "Run All Tests"
4. Review the results

**For detailed testing instructions, see `PRODUCTION_TESTS.md`**

### Manual Test Checklist

Go through each of these on your live site:

1. **Landing Page**
   - [ ] Site loads correctly
   - [ ] No console errors (check browser DevTools)

2. **Sign Up**
   - [ ] Can create account with email/password
   - [ ] Redirects to onboarding after signup

3. **Sign In**
   - [ ] Can sign in with email/password
   - [ ] Redirects to dashboard

4. **Google OAuth**
   - [ ] "Sign in with Google" button works
   - [ ] Redirects to Google login
   - [ ] After login, redirects back to app
   - [ ] User is logged in

5. **Onboarding**
   - [ ] Can select surahs
   - [ ] Can skip onboarding
   - [ ] Can import data
   - [ ] Redirects to dashboard after completion

6. **Dashboard**
   - [ ] Shows user progress
   - [ ] Statistics display correctly
   - [ ] Navigation works

7. **Surah List**
   - [ ] Surahs load correctly
   - [ ] Progress indicators work
   - [ ] Can navigate to surah detail

8. **Surah Detail**
   - [ ] Verses load correctly
   - [ ] Can mark verses as memorized
   - [ ] State updates immediately (no refresh needed)
   - [ ] Progress saves correctly

9. **Profile**
   - [ ] Can view profile
   - [ ] Can edit name
   - [ ] Can change password
   - [ ] Can export data
   - [ ] Can import data
   - [ ] Can clear data
   - [ ] Can logout

10. **Data Persistence**
    - [ ] Mark verses as memorized
    - [ ] Refresh page
    - [ ] Progress is still there
    - [ ] Logout and login again
    - [ ] Progress persists

### Performance Check

1. **Page Load Speed**
   - First load should be < 3 seconds
   - Subsequent loads should be < 1 second

2. **API Response Time**
   - Check browser Network tab
   - API calls should be < 2 seconds

3. **Database**
   - Check Render database dashboard
   - Verify tables are created
   - Check connection status

---

## Troubleshooting

### Backend Won't Start

**Error: "JWT_SECRET is not set"**
- Solution: Add `JWT_SECRET` environment variable in Render
- Generate one using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

**Error: "Database connection failed"**
- Solution: Verify all `DB_*` environment variables are correct
- Check that database is running (green status in Render)
- Verify `DB_SSL=true` is set

**Error: "Port already in use"**
- Solution: Make sure `PORT=10000` is set (Render uses port 10000)

**Error: "Cannot find module"**
- Solution: Check build logs - might be missing dependency
- Verify `package.json` is in `backend/` directory
- Check that build command is: `cd backend && npm install`

### Frontend Won't Build

**Error: "REACT_APP_API_URL is not defined"**
- Solution: Add environment variable in Netlify dashboard
- Make sure it starts with `REACT_APP_`

**Error: "Build failed"**
- Solution: Check build logs in Netlify
- Common issues:
  - Missing dependencies (check `package.json`)
  - Syntax errors (check console)
  - Memory issues (upgrade Netlify plan)

**Error: "Cannot connect to API"**
- Solution: Verify `REACT_APP_API_URL` is correct
- Check that backend is running (visit backend URL in browser)
- Verify CORS is configured in backend

### OAuth Not Working

**Error: "Redirect URI mismatch"**
- Solution: Check Google Cloud Console
- Verify redirect URI matches exactly: `https://your-backend.onrender.com/api/auth/google/callback`
- Make sure no trailing slashes

**Error: "Invalid client"**
- Solution: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render
- Check that they're production credentials (not dev)

### Database Issues

**Error: "Table doesn't exist"**
- Solution: Database tables should auto-create on first connection
- Check Render logs for initialization errors
- Manually trigger by restarting backend service

**Error: "Connection timeout"**
- Solution: Verify database is running (green status)
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
- Verify `DB_SSL=true` is set

### Performance Issues

**Slow page loads**
- Solution: Check Netlify build settings
- Enable caching in `netlify.toml`
- Consider upgrading to paid tier

**Backend spins down**
- Solution: Free tier on Render spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading to Starter plan ($7/month) for always-on

---

## Important Notes

### Free Tier Limitations

**Render:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds to wake up
- 750 hours/month free (enough for always-on single service)
- Database: 90 days retention, 1GB storage

**Netlify:**
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- No spin-down (always on)

### Security Reminders

- ✅ Never commit `.env` files (already in `.gitignore`)
- ✅ All secrets are in environment variables
- ✅ JWT_SECRET must be strong and random
- ✅ Database uses SSL in production
- ✅ CORS is configured correctly
- ✅ Rate limiting is enabled

### Monitoring

**Render:**
- Check logs: Service → "Logs" tab
- Monitor metrics: Service → "Metrics" tab
- Set up alerts: Service → "Alerts" tab

**Netlify:**
- Check deploy logs: Site → "Deploys" → Click deploy
- Monitor analytics: Site → "Analytics" (paid feature)
- Check functions: Site → "Functions" (if using)

### Updating Your App

**To update your app:**

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Render will auto-deploy backend (if auto-deploy is enabled)
4. Netlify will auto-deploy frontend (if auto-deploy is enabled)
5. Wait for deployments to complete (check dashboards)

**Manual deployment:**
- Render: Service → "Manual Deploy" → "Deploy latest commit"
- Netlify: Site → "Deploys" → "Trigger deploy" → "Deploy site"

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Quran API**: Check their documentation or contact support

---

## Summary Checklist

Before going live, make sure:

- [ ] Backend deployed to Render and running
- [ ] Frontend deployed to Netlify and running
- [ ] Database created and connected
- [ ] All environment variables set correctly
- [ ] OAuth redirect URIs configured
- [ ] Tested all functionality
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Performance is acceptable

**You're ready for production! 🚀**
