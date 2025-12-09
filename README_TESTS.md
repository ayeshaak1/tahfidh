# Production Testing Guide

This directory contains comprehensive test suites to verify your production deployment is working correctly.

## Quick Start

### Option 1: Automated Node.js Tests (Recommended)

Run the automated test suite from the command line:

```bash
npm run test:production
```

Or directly:

```bash
node test-production.js
```

**With environment variables:**

```bash
BACKEND_URL=https://your-backend.onrender.com \
FRONTEND_URL=https://your-app.netlify.app \
node test-production.js
```

### Option 2: Browser-Based Tests

1. Open `test-production.html` in your browser
2. Enter your backend and frontend URLs
3. Click "Run All Tests"
4. Review the results in the browser

### Option 3: Manual Testing

Follow the detailed checklist in `PRODUCTION_TESTS.md` for comprehensive manual testing.

## What Gets Tested

### Backend Tests
- ✅ Health check endpoint
- ✅ CORS configuration
- ✅ Surahs API endpoint
- ✅ Surah detail endpoint
- ✅ Google OAuth endpoint
- ✅ User signup
- ✅ User signin
- ✅ Token verification
- ✅ Profile management
- ✅ Progress tracking
- ✅ Onboarding flow
- ✅ Response times

### Frontend Tests
- ✅ Frontend accessibility
- ✅ Page load times
- ✅ API connectivity

## Test Files

- **`test-production.js`** - Automated Node.js test suite
- **`test-production.html`** - Browser-based test interface
- **`PRODUCTION_TESTS.md`** - Detailed manual testing guide

## Understanding Test Results

### Pass (✓)
The test passed successfully. Everything is working as expected.

### Fail (✗)
The test failed. Check the error message and:
1. Verify your URLs are correct
2. Check backend logs in Render dashboard
3. Verify environment variables are set correctly
4. Check the troubleshooting section in `PRODUCTION_DEPLOYMENT.md`

### Warning (⚠)
The test passed but there's a potential issue (e.g., slow response time). Review the warning message.

## Success Criteria

Your deployment is ready if:
- ✅ All critical tests pass (health, auth, API endpoints)
- ✅ Success rate is ≥ 80%
- ✅ Average response time < 5 seconds
- ✅ No authentication errors
- ✅ No database connection errors

## Troubleshooting

### "Cannot connect to backend"
- Verify backend URL is correct
- Check if backend is running in Render dashboard
- Free tier services spin down after 15 min - first request may take 30s

### "401 Unauthorized"
- Check if test user was created successfully
- Verify JWT_SECRET is set in Render
- Check token is being sent in Authorization header

### "500 Internal Server Error"
- Check Render backend logs
- Verify database connection
- Check Quran API credentials
- Verify all environment variables are set

### "CORS Error"
- Verify FRONTEND_URL is set correctly in Render
- Check CORS configuration in backend
- Ensure frontend URL matches exactly

## Next Steps

After running tests:

1. ✅ Fix any critical failures
2. ✅ Review warnings and optimize if needed
3. ✅ Run manual browser tests (see `PRODUCTION_TESTS.md`)
4. ✅ Test with real user accounts
5. ✅ Monitor performance over time

## Support

If tests fail and you can't resolve the issue:
1. Check `PRODUCTION_DEPLOYMENT.md` troubleshooting section
2. Review Render backend logs
3. Review Netlify deploy logs
4. Check browser console for frontend errors

