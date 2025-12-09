# Verify Production Setup

Since you have production keys, let's make sure everything is configured correctly.

## Step 1: Verify Render Environment Variables

Go to Render dashboard → Your backend service → **Environment** tab

**Required variables:**
- ✅ `NODE_ENV` = `production` (exactly, no quotes, no spaces)
- ✅ `QURAN_CLIENT_ID` = Your production client ID (no quotes, no spaces)
- ✅ `QURAN_CLIENT_SECRET` = Your production client secret (no quotes, no spaces)

**Important:**
- ❌ **DO NOT** set `QURAN_USE_PREPROD` (or set it to `false` if it exists)
- ❌ **DO NOT** add quotes around values
- ❌ **DO NOT** add spaces before/after values

## Step 2: Verify Production Endpoints

After deploying, check the logs. You should see:

```
✅ Using PRODUCTION API endpoints (correct)
API Base URL: https://apis.quran.foundation/content/api/v4
Auth URL: https://oauth2.quran.foundation/oauth2/token
```

**If you see:**
```
API Base URL: https://apis-prelive.quran.foundation/content/api/v4
```
**Then something is wrong** - it's using pre-production endpoints.

## Step 3: Test Authentication

After deployment, the logs should show successful authentication. If you see:
```
Error: invalid_client
```

Then your credentials don't match the endpoints being used.

## Common Issues

### Issue: Still using pre-production URLs

**Check:**
1. Is `NODE_ENV=production` set? (exactly, lowercase "production")
2. Is `QURAN_USE_PREPROD` set? (should NOT be set, or should be `false`)
3. Did you redeploy after setting variables?

**Fix:**
- Make sure `NODE_ENV=production` (no quotes)
- Remove `QURAN_USE_PREPROD` if it exists
- Redeploy the service

### Issue: Credentials still failing

**Check:**
1. Are your credentials definitely for PRODUCTION?
2. Do they work with: `https://oauth2.quran.foundation/oauth2/token`?
3. Are there any typos in the environment variables?

**Test your credentials:**
```bash
# Test production credentials
curl -X POST https://oauth2.quran.foundation/oauth2/token \
  -H "Authorization: Basic $(echo -n 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=content"
```

If this fails, your credentials are wrong or not for production.

## Expected Logs After Fix

You should see:
```
=== PRODUCTION MODE ===
NODE_ENV: production
QURAN_USE_PREPROD: not set (using production)
Selected config: PRODUCTION
API Base URL: https://apis.quran.foundation/content/api/v4
Auth URL: https://oauth2.quran.foundation/oauth2/token
✅ Using PRODUCTION API endpoints (correct)
```

Then test: `https://your-backend.onrender.com/api/surahs` should return JSON data.

