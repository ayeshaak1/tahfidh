# Fix: Quran API Authentication Error

## Error Message
```
Error getting access token: {
  error: 'invalid_client',
  error_description: 'Client authentication failed'
}
```

## What This Means

The Quran API credentials (`QURAN_CLIENT_ID` and `QURAN_CLIENT_SECRET`) are either:
1. **Not set** in Render environment variables
2. **Set incorrectly** (typos, extra spaces)
3. **Wrong credentials** (using dev/pre-production instead of production)
4. **Invalid/expired** credentials

## Solution Steps

### Step 1: Check Environment Variables in Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your backend service (`tahfidh-backend`)
3. Go to **"Environment"** tab
4. Look for these variables:
   - `QURAN_CLIENT_ID`
   - `QURAN_CLIENT_SECRET`

**If they're missing:**
- Continue to Step 2

**If they exist:**
- Check for typos or extra spaces
- Make sure values don't have quotes around them
- Continue to Step 3

### Step 2: Get Production Quran API Credentials

**Important**: In production (`NODE_ENV=production`), you MUST use **PRODUCTION** credentials, not development/pre-production ones.

**Option A: If you already have production credentials:**
- Use those credentials
- Skip to Step 3

**Option B: If you only have dev/pre-production credentials:**
- You need to get production credentials from Quran.com
- Contact Quran.com API support or check their developer portal
- Request production API credentials
- They will provide:
  - Production `QURAN_CLIENT_ID`
  - Production `QURAN_CLIENT_SECRET`

**Option C: If you don't have any credentials:**
- Go to [Quran.com API Portal](https://quran.api-docs.io/) or contact their support
- Request API credentials
- Specify you need **PRODUCTION** credentials
- Wait for approval/credentials

### Step 3: Add/Update Environment Variables in Render

1. In Render dashboard → Your backend service → **"Environment"** tab
2. Click **"Add Environment Variable"** (if missing) or click edit icon (if exists)

**Add/Update QURAN_CLIENT_ID:**
- **Key**: `QURAN_CLIENT_ID`
- **Value**: Your production client ID (no quotes, no spaces)
- Click **"Save Changes"**

**Add/Update QURAN_CLIENT_SECRET:**
- **Key**: `QURAN_CLIENT_SECRET`
- **Value**: Your production client secret (no quotes, no spaces)
- Click **"Save Changes"**

**Important Notes:**
- ❌ **DON'T** add quotes: `"your-client-id"` ❌
- ✅ **DO** add raw value: `your-client-id` ✅
- ❌ **DON'T** add spaces before/after
- ✅ **DO** copy-paste exactly as provided

### Step 4: Verify NODE_ENV is Set

Make sure you have:
- **Key**: `NODE_ENV`
- **Value**: `production`

This ensures you're using the production API endpoints.

### Step 5: Redeploy

1. After adding/updating environment variables, Render will automatically redeploy
2. Wait for deployment to complete (1-2 minutes)
3. Check the logs:
   - Go to **"Logs"** tab
   - Look for: `Quran API proxy server running on port 10000`
   - Should NOT see: `Error getting access token`

### Step 6: Test

1. Visit: `https://your-backend-name.onrender.com/api/surahs`
2. You should see JSON data (list of surahs)
3. If you still see errors, check the logs

## Common Mistakes

### ❌ Wrong: Using Dev Credentials in Production
```
QURAN_CLIENT_ID=dev-client-id-123  ❌
```
**Problem**: Dev credentials don't work with production API endpoints

### ✅ Correct: Using Production Credentials
```
QURAN_CLIENT_ID=prod-client-id-456  ✅
```

### ❌ Wrong: Adding Quotes
```
QURAN_CLIENT_ID="your-client-id"  ❌
```
**Problem**: Quotes are included as part of the value

### ✅ Correct: No Quotes
```
QURAN_CLIENT_ID=your-client-id  ✅
```

### ❌ Wrong: Extra Spaces
```
QURAN_CLIENT_ID= your-client-id   ❌
```
**Problem**: Spaces are included as part of the value

### ✅ Correct: No Spaces
```
QURAN_CLIENT_ID=your-client-id  ✅
```

## Still Having Issues?

### Check Render Logs

1. Go to Render dashboard → Your service → **"Logs"** tab
2. Look for error messages
3. Check if you see:
   - `ERROR: Quran API credentials are missing!` → Credentials not set
   - `invalid_client` → Credentials are wrong/invalid
   - `Failed to authenticate` → Credentials don't match API endpoint

### Verify Credentials Work

Test your credentials locally first:

1. Create a test file `test-quran-api.js`:
```javascript
const axios = require('axios');

const clientId = 'YOUR_PRODUCTION_CLIENT_ID';
const clientSecret = 'YOUR_PRODUCTION_CLIENT_SECRET';

const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

axios({
  method: 'post',
  url: 'https://oauth2.quran.foundation/oauth2/token',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data: 'grant_type=client_credentials&scope=content'
})
.then(response => {
  console.log('✅ Success! Token:', response.data.access_token.substring(0, 20) + '...');
})
.catch(error => {
  console.error('❌ Error:', error.response?.data || error.message);
});
```

2. Run: `node test-quran-api.js`
3. If it fails, your credentials are invalid
4. If it succeeds, the issue is in Render configuration

### Contact Support

If credentials are correct but still not working:
- Check Quran.com API status
- Contact Quran.com API support
- Verify your account has production access

## Quick Checklist

- [ ] `QURAN_CLIENT_ID` is set in Render
- [ ] `QURAN_CLIENT_SECRET` is set in Render
- [ ] Using **PRODUCTION** credentials (not dev)
- [ ] No quotes around values
- [ ] No extra spaces
- [ ] `NODE_ENV=production` is set
- [ ] Backend redeployed after adding variables
- [ ] Tested API endpoint: `/api/surahs`

