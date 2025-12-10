# Update Quran API Credentials Guide

## Overview

Your backend uses Quran.com API credentials to fetch surahs, verses, translations, and transliterations. The code automatically switches between **production** and **pre-production** API endpoints based on your environment.

## Current Setup

The backend currently uses the **same environment variables** for both production and pre-production:
- `QURAN_CLIENT_ID`
- `QURAN_CLIENT_SECRET`

However, you have **separate keys** for production and pre-production. Here's how to handle this:

---

## Option 1: Use Production Keys Everywhere (Recommended for Production App)

Since you're running in production, use your **production keys** in both places:

### Step 1: Update Production (Render)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your backend service (`tahfidh-backend`)
3. Go to **"Environment"** tab
4. Update these variables:
   - `QURAN_CLIENT_ID` → Your **production** Client ID
   - `QURAN_CLIENT_SECRET` → Your **production** Client Secret
5. Click **"Save Changes"**
6. Backend will automatically redeploy (1-2 minutes)

### Step 2: Update Local Development

1. Open `backend/.env` file
2. Update these lines:
   ```env
   QURAN_CLIENT_ID=your-production-client-id-here
   QURAN_CLIENT_SECRET=your-production-client-secret-here
   ```
3. Save the file
4. Restart your backend server

**Note:** Your local dev will use pre-production API endpoints, but with production credentials. This usually works fine.

---

## Option 2: Use Separate Keys (More Accurate)

If you want to use **pre-production keys for local dev** and **production keys for production**, we need to update the code to support separate environment variables.

### Step 1: Update Backend Code

The code needs to be modified to support:
- `QURAN_CLIENT_ID_PROD` / `QURAN_CLIENT_SECRET_PROD` (for production)
- `QURAN_CLIENT_ID_PREPROD` / `QURAN_CLIENT_SECRET_PREPROD` (for pre-production)

**Would you like me to update the code to support this?**

### Step 2: Update Production (Render)

Set these environment variables:
- `QURAN_CLIENT_ID_PROD` → Your production Client ID
- `QURAN_CLIENT_SECRET_PROD` → Your production Client Secret
- `QURAN_CLIENT_ID_PREPROD` → Your pre-production Client ID (optional, for testing)
- `QURAN_CLIENT_SECRET_PREPROD` → Your pre-production Client Secret (optional, for testing)

### Step 3: Update Local Development

In `backend/.env`:
```env
QURAN_CLIENT_ID_PREPROD=your-pre-production-client-id-here
QURAN_CLIENT_SECRET_PREPROD=your-pre-production-client-secret-here
```

---

## Is It Necessary to Update?

### ✅ YES, Update If:

1. **The old keys were exposed** (they were in `setup-env.bat`)
2. **The old keys were production keys** - anyone could use them
3. **You want to secure your API access** - rotating keys is a security best practice
4. **The old keys might be rate-limited or revoked** - if Quran.com detected the exposure

### ⚠️ MAYBE, If:

1. **The old keys were only pre-production** - less critical, but still good to rotate
2. **You're not sure if they were production keys** - safer to update anyway

### ❌ NO, If:

1. **The old keys were test/development only** - but you should still update for security

---

## Recommended Approach

**Since you have new keys, I recommend:**

1. **Use Option 2** (separate keys) - ✅ Code is already updated!
2. **Update Render first** with production keys:
   - Set `QURAN_CLIENT_ID_PROD` and `QURAN_CLIENT_SECRET_PROD`
3. **Update local dev** with pre-production keys:
   - Set `QURAN_CLIENT_ID_PREPROD` and `QURAN_CLIENT_SECRET_PREPROD` in `backend/.env`
4. **Test after updating** - make sure surahs, verses, translations load correctly

**Why Option 2?**
- More accurate - uses the right keys for the right environment
- Better security - separate credentials for prod vs dev
- Matches Quran.com API's structure (they give you separate keys)

---

## Testing After Update

### Test in Production:

1. Visit your production site
2. Try loading a surah
3. Check if verses display correctly
4. Verify translations and transliterations work
5. Check Render logs for any API errors

### Test in Local Dev:

1. Start your backend: `cd backend && npm run dev`
2. Check console logs - should see "Using API config: PRE-PRODUCTION"
3. Test loading a surah via your frontend
4. Verify everything works

---

## Troubleshooting

### Error: "Failed to authenticate with Quran API"

**Possible causes:**
1. Wrong credentials (typo in Client ID or Secret)
2. Using pre-production keys with production endpoints (or vice versa)
3. Extra spaces or quotes in environment variables
4. Credentials not saved properly in Render

**Solution:**
1. Double-check credentials in Render dashboard
2. Make sure no extra spaces before/after values
3. Verify you're using the right keys for the right environment
4. Check Render logs for detailed error messages

### Error: "Quran API credentials are missing"

**Solution:**
1. Verify `QURAN_CLIENT_ID` and `QURAN_CLIENT_SECRET` are set in Render
2. Make sure they're saved (click "Save Changes")
3. Wait for backend to redeploy
4. Check logs to confirm variables are loaded

---

## Quick Checklist

- [ ] Decide: Option 1 (same keys) or Option 2 (separate keys)
- [ ] Update `QURAN_CLIENT_ID` in Render (production)
- [ ] Update `QURAN_CLIENT_SECRET` in Render (production)
- [ ] Update `backend/.env` for local development
- [ ] Test production site
- [ ] Test local development
- [ ] Verify translations/transliterations work
- [ ] Check Render logs for errors

---

## Security Note

**After updating, make sure:**
- ✅ Old keys are not in any code files
- ✅ Old keys are not in git history (already fixed)
- ✅ New keys are only in environment variables
- ✅ `.env` files are in `.gitignore` (already done)

---

**Need help?** Let me know if you want me to:
1. Update the code to support separate prod/pre-prod keys (Option 2)
2. Help you test after updating
3. Troubleshoot any issues

