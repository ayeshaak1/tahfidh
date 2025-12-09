# Production Deployment Test Guide

This guide helps you verify that your production deployment is working correctly. Use both automated tests and manual browser testing.

## Quick Start

### Automated Backend Tests

Run the automated test suite:

```bash
node test-production.js
```

Or with environment variables:

```bash
BACKEND_URL=https://your-backend.onrender.com \
FRONTEND_URL=https://your-app.netlify.app \
node test-production.js
```

The test script will:
- ✅ Test all backend API endpoints
- ✅ Test authentication (signup, signin, token verification)
- ✅ Test progress tracking
- ✅ Test profile management
- ✅ Measure response times
- ✅ Generate a detailed report

## Manual Browser Testing Checklist

Use this checklist to manually verify your frontend is working correctly.

### Prerequisites

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Go to the Network tab
4. Clear browser cache (Ctrl+Shift+Delete)

### 1. Landing Page ✅

**URL:** `https://your-app.netlify.app`

- [ ] Page loads without errors
- [ ] No console errors (check DevTools Console)
- [ ] No network errors (check DevTools Network tab)
- [ ] All images and fonts load correctly
- [ ] Navigation menu works
- [ ] "Sign Up" and "Sign In" buttons are visible and clickable

**Expected:** Clean page load, no errors in console

---

### 2. Sign Up (Email/Password) ✅

**Steps:**
1. Click "Sign Up"
2. Enter a test email (e.g., `test-${Date.now()}@example.com`)
3. Enter a password (at least 8 characters)
4. Enter your name
5. Click "Sign Up"

**Expected:**
- [ ] Form submits successfully
- [ ] Redirects to onboarding page
- [ ] No console errors
- [ ] User is logged in (check if profile icon appears)

**If it fails:**
- Check Network tab for API errors
- Verify backend URL is correct in environment variables
- Check backend logs in Render dashboard

---

### 3. Sign In (Email/Password) ✅

**Steps:**
1. Click "Sign In"
2. Enter the email you just created
3. Enter the password
4. Click "Sign In"

**Expected:**
- [ ] Form submits successfully
- [ ] Redirects to dashboard
- [ ] No console errors
- [ ] User is logged in

**If it fails:**
- Check Network tab - look for `/api/auth/signin` request
- Verify the request returns status 200
- Check if token is stored in localStorage

---

### 4. Google OAuth ✅

**Steps:**
1. Click "Sign in with Google"
2. You should be redirected to Google login
3. Sign in with your Google account
4. Authorize the app
5. You should be redirected back to your app

**Expected:**
- [ ] Redirects to Google login page
- [ ] After login, redirects back to your app
- [ ] User is logged in
- [ ] No console errors

**If it fails:**
- Check Google Cloud Console → Credentials
- Verify redirect URI matches exactly: `https://your-backend.onrender.com/api/auth/google/callback`
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Render
- Check backend logs for OAuth errors

---

### 5. Onboarding ✅

**Steps:**
1. After signup, you should see the onboarding page
2. Select some surahs (e.g., Al-Fatiha, Al-Baqarah)
3. Click "Continue" or "Skip"

**Expected:**
- [ ] Can select/deselect surahs
- [ ] Can skip onboarding
- [ ] After completion, redirects to dashboard
- [ ] No console errors

**If it fails:**
- Check Network tab for `/api/auth/onboarding` request
- Verify the request succeeds (status 200)
- Check backend logs

---

### 6. Dashboard ✅

**URL:** `https://your-app.netlify.app/dashboard`

**Expected:**
- [ ] Page loads correctly
- [ ] Shows user statistics (total verses, memorized, etc.)
- [ ] Progress charts/graphs display (if implemented)
- [ ] Navigation menu works
- [ ] No console errors

**If it fails:**
- Check Network tab for API calls
- Verify `/api/auth/progress` returns data
- Check if user is authenticated (token in localStorage)

---

### 7. Surah List ✅

**URL:** `https://your-app.netlify.app/surahs`

**Expected:**
- [ ] List of all 114 surahs loads
- [ ] Progress indicators show correctly (if you have progress)
- [ ] Can click on a surah to view details
- [ ] No console errors
- [ ] Page loads in < 3 seconds

**If it fails:**
- Check Network tab for `/api/surahs` request
- Verify the request succeeds
- Check backend logs for Quran API errors

---

### 8. Surah Detail ✅

**Steps:**
1. Go to Surah List
2. Click on "Al-Fatiha" (Surah 1)
3. Wait for verses to load

**Expected:**
- [ ] Verses load correctly
- [ ] Arabic text displays with proper fonts
- [ ] Translation displays (if enabled)
- [ ] Can mark verses as memorized
- [ ] Progress updates immediately (no page refresh needed)
- [ ] No console errors

**If it fails:**
- Check Network tab for `/api/surah/1` request
- Verify verses are returned
- Check if fonts load correctly
- Check backend logs

---

### 9. Mark Verses as Memorized ✅

**Steps:**
1. Go to a surah detail page
2. Click on a verse to mark it as memorized
3. Refresh the page
4. Check if the verse is still marked

**Expected:**
- [ ] Verse is marked immediately (UI updates)
- [ ] After refresh, verse is still marked
- [ ] Progress statistics update
- [ ] No console errors

**If it fails:**
- Check Network tab for `/api/auth/progress` PUT request
- Verify the request succeeds (status 200)
- Check if token is being sent in Authorization header
- Check backend logs

---

### 10. Profile Page ✅

**URL:** `https://your-app.netlify.app/profile`

**Expected:**
- [ ] Profile page loads
- [ ] Shows user name and email
- [ ] Can edit name
- [ ] Can change password
- [ ] Can export data (downloads JSON file)
- [ ] Can import data (uploads JSON file)
- [ ] Can clear all data
- [ ] Can logout
- [ ] No console errors

**If it fails:**
- Check Network tab for profile-related requests
- Verify authentication token is valid
- Check backend logs

---

### 11. Data Persistence ✅

**Steps:**
1. Mark some verses as memorized
2. Refresh the page (F5)
3. Logout
4. Login again
5. Check if progress is still there

**Expected:**
- [ ] Progress persists after refresh
- [ ] Progress persists after logout/login
- [ ] All data is saved correctly

**If it fails:**
- Check if progress is being saved to database
- Verify `/api/auth/progress` GET request returns saved data
- Check backend database connection
- Check Render database dashboard

---

### 12. Performance Check ✅

**Tools:** Browser DevTools → Network tab

**Expected:**
- [ ] First page load: < 3 seconds
- [ ] Subsequent loads: < 1 second
- [ ] API calls: < 2 seconds each
- [ ] No failed requests (red in Network tab)

**If slow:**
- Check backend response times in Render logs
- Check if database is responding quickly
- Consider enabling caching
- Check Netlify build settings

---

## Browser Console Checks

Open DevTools Console (F12) and check for:

- [ ] No red errors
- [ ] No CORS errors
- [ ] No 404 errors for resources
- [ ] No authentication errors
- [ ] No API errors

**Common Errors:**

1. **CORS Error:**
   ```
   Access to fetch at '...' from origin '...' has been blocked by CORS policy
   ```
   - **Fix:** Check `FRONTEND_URL` in Render environment variables
   - Verify CORS is configured in backend

2. **401 Unauthorized:**
   ```
   GET .../api/auth/progress 401 (Unauthorized)
   ```
   - **Fix:** Check if token is stored in localStorage
   - Verify token is being sent in Authorization header
   - Check if token expired (tokens expire after 7 days)

3. **500 Internal Server Error:**
   ```
   GET .../api/surahs 500 (Internal Server Error)
   ```
   - **Fix:** Check Render backend logs
   - Verify database connection
   - Check Quran API credentials

4. **Network Error:**
   ```
   Network request failed
   ```
   - **Fix:** Check if backend is running (visit backend URL)
   - Verify `REACT_APP_API_URL` is set in Netlify
   - Check backend URL is correct

---

## API Endpoint Testing

You can also test endpoints directly using curl or Postman:

### Health Check
```bash
curl https://your-backend.onrender.com/api/health
```

### Get Surahs
```bash
curl https://your-backend.onrender.com/api/surahs
```

### Sign Up
```bash
curl -X POST https://your-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### Sign In
```bash
curl -X POST https://your-backend.onrender.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Get Progress (requires token)
```bash
curl https://your-backend.onrender.com/api/auth/progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Backend Not Responding

1. Check Render dashboard → Your service → Status
2. Check Render logs for errors
3. Verify environment variables are set
4. Check if service spun down (free tier spins down after 15 min inactivity)

### Frontend Not Loading

1. Check Netlify dashboard → Deploys
2. Verify build succeeded
3. Check `REACT_APP_API_URL` environment variable
4. Clear browser cache

### Database Errors

1. Check Render database dashboard
2. Verify database is running (green status)
3. Check `DB_*` environment variables in Render
4. Verify database connection in backend logs

### OAuth Not Working

1. Check Google Cloud Console → Credentials
2. Verify redirect URI matches exactly
3. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render
4. Check backend logs for OAuth errors

---

## Test Results Template

After running tests, fill this out:

```
Date: ___________
Backend URL: ___________
Frontend URL: ___________

Automated Tests:
- Passed: ___ / ___
- Failed: ___ / ___
- Warnings: ___ / ___

Manual Tests:
- Landing Page: [ ] Pass [ ] Fail
- Sign Up: [ ] Pass [ ] Fail
- Sign In: [ ] Pass [ ] Fail
- Google OAuth: [ ] Pass [ ] Fail
- Onboarding: [ ] Pass [ ] Fail
- Dashboard: [ ] Pass [ ] Fail
- Surah List: [ ] Pass [ ] Fail
- Surah Detail: [ ] Pass [ ] Fail
- Mark Verses: [ ] Pass [ ] Fail
- Profile: [ ] Pass [ ] Fail
- Data Persistence: [ ] Pass [ ] Fail
- Performance: [ ] Pass [ ] Fail

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: [ ] Ready for Production [ ] Needs Fixes
```

---

## Next Steps

After testing:

1. ✅ Fix any critical issues
2. ✅ Document any known limitations
3. ✅ Set up monitoring (optional)
4. ✅ Share the app with beta testers
5. ✅ Gather feedback
6. ✅ Iterate and improve

---

**Need Help?**

- Check `PRODUCTION_DEPLOYMENT.md` for deployment details
- Check Render logs for backend issues
- Check Netlify logs for frontend issues
- Review browser console for client-side errors

