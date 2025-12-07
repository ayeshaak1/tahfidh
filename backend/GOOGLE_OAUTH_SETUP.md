# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Tahfidh application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Enter project name: "Tahfidh" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen** (IMPORTANT for production)
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External** (allows all Google users)
   - App name: "Tahfidh" (or your app name)
   - User support email: Your email
   - App logo: (Optional) Upload a logo
   - App domain: (Optional) Your domain
   - Developer contact: Your email
   - Click "Save and Continue"
   
   **Scopes (CRITICAL - Only use basic scopes):**
   - Click "Add or Remove Scopes"
   - **ONLY** select these scopes (these don't require verification):
     - `.../auth/userinfo.email` (See your primary Google Account email address)
     - `.../auth/userinfo.profile` (See your personal info, including any personal info you've made publicly available)
   - **DO NOT** add any sensitive scopes (they require verification)
   - Click "Update" then "Save and Continue"
   
   **Test Users (for Testing Mode):**
   - Add test users (your email, etc.) if app is in "Testing" mode
   - Click "Save and Continue"
   
   **Publishing (for Production):**
   - After configuring, click "BACK TO DASHBOARD"
   - At the top, you'll see "Publish App" button
   - Click "Publish App" to make it available to all users
   - **Note:** Unverified apps can still be published and work for all users, but Google will show a warning screen
   - Users can click "Advanced" → "Go to Tahfidh (unsafe)" to proceed
   - This is acceptable for production use with basic scopes

5. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: "Tahfidh Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `http://localhost:5000` (for backend)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
   - Click "Create"

6. **Copy Credentials**
   - You'll see a popup with:
     - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abc123...`)
   - Copy both values

## Step 2: Publish Your App (Make it Available to All Users)

**Important:** To allow all Google users to sign in (not just test users):

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"

2. **Publish the App**
   - At the top of the page, click **"PUBLISH APP"** button
   - Confirm by clicking "CONFIRM"
   - Status will change from "Testing" to "In production"

3. **Understanding the Warning**
   - Google will show a warning: "This app isn't verified"
   - This is **NORMAL** and **ACCEPTABLE** for production apps using only basic scopes
   - Users will see: "Google hasn't verified this app"
   - Users can click "Advanced" → "Go to [Your App Name] (unsafe)" to proceed
   - This is standard for apps that haven't gone through Google's verification process
   - **Your app will work perfectly** - users just need to click through the warning

4. **Optional: Request Verification (Not Required)**
   - If you want to remove the warning, you can request verification
   - This requires additional steps and may take time
   - **Not necessary** for basic email/profile scopes - your app works fine without it

## Step 3: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# OAuth Callback URL
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:3000

# Session Secret (can use same as JWT_SECRET or generate new one)
SESSION_SECRET=your-session-secret-here
```

**For Production:**
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

## Step 3: Update Database Schema

The database schema has been updated to support Google OAuth:
- `google_id` column stores Google user ID
- `auth_provider` column indicates authentication method ('email' or 'google')
- `password` is now optional (nullable) for Google OAuth users

The tables will be automatically updated when you start the server.

## Step 4: Test Google OAuth

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   npm start
   ```

3. **Test the flow:**
   - Go to sign in/sign up page
   - Click "Continue with Google"
   - You'll be redirected to Google login
   - After authentication, you'll be redirected back to the app
   - If onboarding is incomplete, you'll be redirected to onboarding
   - Otherwise, you'll be redirected to dashboard

## How It Works

1. **User clicks "Continue with Google"**
   - Frontend redirects to `/api/auth/google`
   - Backend initiates Google OAuth flow

2. **Google Authentication**
   - User authenticates with Google
   - Google redirects to `/api/auth/google/callback` with authorization code

3. **Backend Processing**
   - Backend exchanges code for user profile
   - Checks if user exists (by Google ID or email)
   - Creates new user or links Google account to existing user
   - Generates JWT token

4. **Frontend Redirect**
   - Backend redirects to frontend with JWT token in URL
   - Frontend stores token and verifies authentication
   - User is redirected to dashboard or onboarding

## Troubleshooting

### "redirect_uri_mismatch" Error
**Problem:** The redirect URI doesn't match what's configured in Google Console.

**Solution:**
1. Check `GOOGLE_CALLBACK_URL` in `.env` matches exactly
2. Verify in Google Console → Credentials → OAuth 2.0 Client IDs
3. Make sure the redirect URI is in "Authorized redirect URIs"

### "invalid_client" Error
**Problem:** Client ID or Client Secret is incorrect.

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Make sure there are no extra spaces or quotes
3. Regenerate credentials in Google Console if needed

### OAuth Works But User Not Created
**Problem:** Database connection issue or table not created.

**Solution:**
1. Check database connection in server logs
2. Verify tables are created: `SELECT * FROM users;`
3. Check server logs for errors

### CORS Errors
**Problem:** Frontend can't communicate with backend.

**Solution:**
1. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Check CORS configuration in `backend/index.js`
3. Make sure credentials are enabled in CORS

## Security Notes

1. **Never commit credentials to version control**
   - Keep `.env` file in `.gitignore`
   - Use environment variables in production

2. **Use HTTPS in production**
   - Google requires HTTPS for production OAuth
   - Update `GOOGLE_CALLBACK_URL` to use `https://`

3. **Session Security**
   - Use a strong `SESSION_SECRET`
   - In production, set `secure: true` in session config (requires HTTPS)

4. **Token Security**
   - JWT tokens are sent via URL parameter (for OAuth callback)
   - Frontend immediately stores token and removes from URL
   - Consider using httpOnly cookies for production

## Production Deployment

When deploying to production:

1. **Update Google Console:**
   - Add production URLs to "Authorized JavaScript origins"
   - Add production callback URL to "Authorized redirect URIs"
   - **Publish your app** (if not already published) to allow all users

2. **Update Environment Variables:**
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Enable HTTPS:**
   - Google OAuth requires HTTPS in production
   - Use a reverse proxy (nginx) or hosting service with SSL

4. **OAuth Consent Screen:**
   - Make sure app is **Published** (not in Testing mode)
   - Add production domain to authorized domains (optional but recommended)
   - **Note:** The "unverified app" warning is normal and acceptable for production

## Understanding Google's "Unverified App" Warning

**What it means:**
- Google shows a warning when apps aren't verified by Google
- This is **completely normal** for apps using only basic scopes
- Your app **works perfectly** - users just need to click through the warning

**What users see:**
1. "Google hasn't verified this app"
2. Warning about the app requesting access to email/profile
3. Option to click "Advanced" → "Go to [App Name] (unsafe)"

**Is this acceptable for production?**
- **YES!** Many production apps operate this way
- Basic scopes (email, profile) don't require verification
- Users can safely proceed - the warning is just Google being cautious
- Your app functionality is not affected

**To remove the warning (optional):**
- Submit your app for Google verification
- Requires additional documentation and review process
- Takes time (days to weeks)
- **Not necessary** for basic functionality

