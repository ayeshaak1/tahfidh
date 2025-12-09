# Fix: Credentials Mismatch Error

## The Problem

Your logs show:
```
API Base URL: https://apis-prelive.quran.foundation/content/api/v4
Environment: production
Error: invalid_client
```

This means:
- Your `NODE_ENV=production` (correct)
- But it's using **PRE-PRODUCTION** API endpoints
- Your credentials are likely for **PRE-PRODUCTION**, not production

## The Solution

You have **two options**:

### Option 1: Use Pre-Production Credentials (Quick Fix)

If you only have pre-production credentials, you can use them even in production:

1. Go to Render dashboard → Your backend service → **Environment** tab
2. Add this environment variable:
   ```
   QURAN_USE_PREPROD = true
   ```
3. Make sure you have:
   ```
   QURAN_CLIENT_ID = <your-pre-production-client-id>
   QURAN_CLIENT_SECRET = <your-pre-production-client-secret>
   ```
4. Save and wait for redeploy

This will use pre-production API endpoints even though `NODE_ENV=production`.

### Option 2: Get Production Credentials (Recommended)

1. Contact Quran.com API support
2. Request **PRODUCTION** API credentials
3. They will provide:
   - Production `QURAN_CLIENT_ID`
   - Production `QURAN_CLIENT_SECRET`
4. In Render dashboard → Environment tab:
   - Update `QURAN_CLIENT_ID` with production value
   - Update `QURAN_CLIENT_SECRET` with production value
   - **Remove** `QURAN_USE_PREPROD` variable (or set to `false`)
5. Save and wait for redeploy

## How to Tell Which Credentials You Have

**Pre-Production credentials work with:**
- Auth URL: `https://prelive-oauth2.quran.foundation/oauth2/token`
- Base URL: `https://apis-prelive.quran.foundation/content/api/v4`

**Production credentials work with:**
- Auth URL: `https://oauth2.quran.foundation/oauth2/token`
- Base URL: `https://apis.quran.foundation/content/api/v4`

Check your Render logs - if you see `apis-prelive` in the URL, you're using pre-production endpoints.

## Quick Test

After updating, check the logs. You should see:
```
Using API config: PRODUCTION (or PRE-PRODUCTION)
API Base URL: https://apis.quran.foundation/content/api/v4 (production)
OR
API Base URL: https://apis-prelive.quran.foundation/content/api/v4 (pre-production)
```

Then test: `https://your-backend.onrender.com/api/surahs`

If it works, you're good! If not, check the detailed error messages in the logs.

