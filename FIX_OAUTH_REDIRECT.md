# Fix OAuth Redirect to Localhost Issue

## Problem
After logging in with Google OAuth, you're being redirected to `http://localhost:5000/api/auth/google/callback` instead of your production URL. This happens because the backend environment variables aren't set correctly in Render.

## Solution

### Step 1: Update Backend Environment Variables in Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your backend service (e.g., `tahfidh-backend`)
3. Go to **"Environment"** tab
4. Add or update these environment variables:

#### Required OAuth Variables:

```
GOOGLE_CALLBACK_URL=https://your-backend-name.onrender.com/api/auth/google/callback
FRONTEND_URL=https://your-app-name.netlify.app
```

**Important:** 
- Replace `your-backend-name` with your actual Render backend service name
- Replace `your-app-name` with your actual Netlify app name
- Make sure there's **NO trailing slash** at the end of URLs

#### Example:
If your backend is at `https://tahfidh-backend.onrender.com` and your frontend is at `https://tahfidh.netlify.app`, then:

```
GOOGLE_CALLBACK_URL=https://tahfidh-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://tahfidh.netlify.app
```

### Step 2: Update Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** → **"Credentials"**
4. Click on your OAuth 2.0 Client ID
5. Under **"Authorized redirect URIs"**, make sure you have:
   ```
   https://your-backend-name.onrender.com/api/auth/google/callback
   ```
   (Replace with your actual backend URL)

6. Click **"Save"**

### Step 3: Redeploy Backend

After updating the environment variables:

1. In Render dashboard, click **"Manual Deploy"** → **"Deploy latest commit"**
   - OR wait for Render to auto-redeploy (usually happens automatically when env vars change)
2. Wait 1-2 minutes for deployment to complete

### Step 4: Test

1. Go to your Netlify site
2. Click "Sign in with Google"
3. After Google authentication, you should be redirected back to your Netlify site (not localhost)

## Verification Checklist

- [ ] `GOOGLE_CALLBACK_URL` is set in Render (backend URL)
- [ ] `FRONTEND_URL` is set in Render (Netlify URL)
- [ ] Google OAuth console has the production callback URL
- [ ] Backend has been redeployed
- [ ] OAuth redirect works correctly

## Common Issues

### Still redirecting to localhost?
- Check that environment variables are saved (no typos)
- Make sure backend was redeployed after changes
- Check Render logs for any errors

### "Redirect URI mismatch" error?
- Verify the callback URL in Google Console matches exactly (including `/api/auth/google/callback`)
- Make sure there are no trailing slashes
- Check that you're using `https://` not `http://`

### Backend URL not working?
- Make sure your Render backend service is running
- Check the service URL in Render dashboard
- Verify the URL format: `https://service-name.onrender.com`

