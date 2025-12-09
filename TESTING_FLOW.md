# Auth/Guest Cache Separation Testing Flow

## 🧪 Complete Testing Flow

### **Prerequisites:**
1. Open browser DevTools → Console tab (to see logs)
2. Open DevTools → Application → Local Storage (to inspect storage keys)
3. Have a test account ready (email + password)

---

## **Test 1: Fresh Start - Guest Mode**

### Steps:
1. **Clear all browser data** (or use incognito)
2. Go to landing page
3. Click "Continue as Guest"
4. Go to Dashboard

### ✅ Expected Results:
- **Console:** `🔄 Switched to guest mode - cleared all auth data`
- **Console:** `🔄 Loading progress...`
- **Console:** `💾 Loading guest data...`
- **Console:** `🧹 Cleared auth data`
- **Console:** `ℹ️ No guest data`
- **Dashboard:** Shows "Guest Mode: Progress saved locally only" banner
- **LottieLoader:** Should be visible during loading to prevent accidental refreshes
- **LocalStorage:** 
  - `guestProgress` = `{}` (empty object)
  - `guestUserName` = `""` (empty string) - Profile page will display "Guest User" as default when empty
  - NO `authToken`, `userData`, `quranProgress`

### ❌ If you see:
- Auth data in localStorage → FAIL
- "Create Account" button missing → FAIL
- Progress from previous session → FAIL

---

## **Test 2: Guest Mode - Add Data**

### Steps:
1. In guest mode, go to Profile
2. Edit display name to "Test Guest"
3. Go to Surahs page
4. Mark Surah 1 (Al-Fatihah) as completed
5. Go back to Dashboard

### ✅ Expected Results:
- **Profile:** Shows "Test Guest" as name
- **Dashboard:** Shows 1 surah completed
- **LocalStorage:**
  - `guestProgress` = `{"1": {...}}` (has surah 1 data)
  - `guestUserName` = `"Test Guest"`
  - Still NO `authToken`, `userData`, `quranProgress`

### ❌ If you see:
- Name not saving → FAIL
- Progress not saving → FAIL
- Auth data appearing → FAIL

---

## **Test 3: Guest Mode - Refresh**

### Steps:
1. While in guest mode with data (from Test 2)
2. Refresh the page (F5)
3. Check Dashboard and Profile

### ✅ Expected Results:
- **Console:** `🔄 Switched to guest mode - cleared all auth data`
- **Console:** `🔄 Loading progress...`
- **Console:** `💾 Loading guest data...`
- **Console:** `🧹 Cleared auth data`
- **Console:** `✅ Loaded guest: 1 surahs`
- **Dashboard:** Still shows 1 surah completed
- **Profile:** Still shows "Test Guest"
- **LottieLoader:** Should be visible during loading to prevent accidental refreshes
- **LocalStorage:** Same as Test 2

### ❌ If you see:
- Progress disappeared → FAIL
- Name reset to empty → FAIL
- Auth data loaded → FAIL

---

## **Test 4: Logout from Guest → Login**

### Steps:
1. In guest mode, go to Profile
2. Click "Logout" (if visible) OR just navigate to landing page
3. Click "Sign In"
4. Enter your test account credentials
5. Click "Sign In" button

### ✅ Expected Results:
- **Console:** `🔄 AUTH MODE`
- **Console:** `🔄 Loading progress...`
- **Console:** `📡 Fetching progress from backend database (authenticated user)...`
- **Console:** `✅ Progress loaded from database and cached (authenticated): X surahs` (or `⚠️ No DB progress, starting fresh (authenticated user)`)
- **Dashboard:** NO "Guest Mode" banner
- **Dashboard:** Should appear after loading completes (LottieLoader should disappear)
- **Profile:** Shows your authenticated user's name (from backend)
- **LottieLoader:** Should be visible during loading, then disappear when dashboard loads
- **LocalStorage:**
  - `authToken` = `"..."` (JWT token)
  - `userData` = `{name: "...", email: "..."}`
  - `quranProgress` = `{...}` (from database, or `{}` if no progress)
  - `guestProgress` = STILL `{"1": {...}}` (NOT cleared)
  - `guestUserName` = STILL `"Test Guest"` (NOT cleared)

### ⚠️ Note about 429 Rate Limit Errors:
- If you see `429 (Too Many Requests)` errors, this is a backend rate limiting issue
- The app will automatically retry once after clearing auth state
- If errors persist, restart your backend server
- The app should still load correctly after successful authentication

### ❌ If you see:
- "Guest Mode" banner still showing → FAIL
- Guest data in authenticated view → FAIL
- Auth data not loading → FAIL
- Guest data cleared → FAIL (should be preserved)
- LottieLoader stuck showing (dashboard never appears) → FAIL (check console for errors)

---

## **Test 5: Authenticated Mode - Add Data**

### Steps:
1. While logged in, go to Surahs page
2. Mark Surah 2 (Al-Baqarah) as completed
3. Go to Dashboard

### ✅ Expected Results:
- **Dashboard:** Shows 1 surah completed (Surah 2 from DB)
- **LocalStorage:**
  - `quranProgress` = `{"2": {...}}` (updated)
  - `guestProgress` = STILL `{"1": {...}}` (unchanged)
  - `guestUserName` = STILL `"Test Guest"` (unchanged)

### ❌ If you see:
- Guest surah (1) appearing in authenticated view → FAIL
- Progress not saving to database → FAIL
- Guest data modified → FAIL

---

## **Test 6: Authenticated Mode - Refresh**

### Steps:
1. While logged in with data (from Test 5)
2. Refresh the page (F5)
3. Check Dashboard and Profile

### ✅ Expected Results:
- **Console:** `🔄 AUTH MODE`
- **Console:** `🔄 Loading progress...`
- **Console:** `📡 Fetching progress from backend database (authenticated user)...`
- **Console:** `✅ Progress loaded from database and cached (authenticated): 1 surahs`
- **Dashboard:** Shows 1 surah completed (Surah 2)
- **Profile:** Shows authenticated user's name
- **LottieLoader:** Should be visible during loading to prevent accidental refreshes
- **LocalStorage:** Same as Test 5

### ❌ If you see:
- Guest data loaded → FAIL
- Progress lost → FAIL
- "Guest Mode" banner → FAIL

---

## **Test 7: Logout from Authenticated → Guest**

### Steps:
1. While logged in, go to Profile
2. Click "Logout" button
3. You should be redirected to landing page
4. Click "Continue as Guest"
5. Go to Dashboard

### ✅ Expected Results:
- **Console:** `🚪 User initiated logout` (from Profile)
- **Console:** `🚪 Logging out - clearing all authenticated data` (from AuthContext)
- **Console:** `🔄 Switched to guest mode - cleared all auth data`
- **Console:** `🔄 Loading progress...`
- **Console:** `💾 Loading guest data...`
- **Console:** `🧹 Cleared auth data`
- **Console:** `✅ Loaded guest: 1 surahs`
- **Dashboard:** Shows "Guest Mode" banner
- **Dashboard:** Shows 1 surah completed (Surah 1 from guest data)
- **Profile:** Shows "Test Guest" as name
- **LottieLoader:** Should be visible during loading to prevent accidental refreshes
- **LocalStorage:**
  - `guestProgress` = `{"1": {...}}` (guest data preserved)
  - `guestUserName` = `"Test Guest"` (guest name preserved)
  - NO `authToken`, `userData`, `quranProgress` (all cleared)

### ❌ If you see:
- Auth surah (2) in guest view → FAIL
- Auth name in guest profile → FAIL
- Auth data still in localStorage → FAIL
- Guest data lost → FAIL

---

## **Test 8: Guest Mode - Clear Local Data**

### Steps:
1. In guest mode, go to Profile
2. Click "Clear Local Data"
3. Confirm the action
4. Check Dashboard

### ✅ Expected Results:
- **Dashboard:** Shows 0 surahs completed
- **Profile:** Shows "Guest User" (default name)
- **LocalStorage:**
  - `guestProgress` = `{}` (empty)
  - `guestUserName` = `""` (empty)
  - Still NO auth data

### ❌ If you see:
- Auth data cleared → FAIL (shouldn't touch auth data)
- Progress still showing → FAIL

---

## **Test 9: Authenticated Mode - Clear Data**

### Steps:
1. Log in again
2. Go to Profile
3. Click "Clear Data"
4. Confirm the action
5. Check Dashboard

### ✅ Expected Results:
- **Console:** `Progress cleared from database`
- **Dashboard:** Shows 0 surahs completed
- **LocalStorage:**
  - `quranProgress` = `{}` (empty)
  - `guestProgress` = STILL `{}` (unchanged, if cleared in Test 8)
  - Auth token and userData still present

### ❌ If you see:
- Guest data cleared → FAIL
- Auth token cleared → FAIL

---

## **Test 10: LottieLoader Visibility During Loading**

### Steps:
1. Clear all browser data (or use incognito)
2. Go to landing page
3. Click "Continue as Guest" or "Sign In"
4. Watch for LottieLoader during loading
5. Try to refresh while loading (should see loader, preventing accidental refresh)

### ✅ Expected Results:
- **LottieLoader:** Visible immediately when loading starts
- **LottieLoader:** Shows during auth loading (`authLoading`)
- **LottieLoader:** Shows during progress loading (`progressLoading`)
- **LottieLoader:** Shows until `progressLoaded` is true
- **LottieLoader:** Prevents accidental page refreshes during critical loading operations
- **Console:** Loading messages appear while loader is visible

### ❌ If you see:
- No loader during loading → FAIL (user can accidentally refresh and lose data)
- Loader disappears too quickly → FAIL (data might not be fully loaded)
- Page content visible while loading → FAIL (should show loader instead)

---

## **Test 11: Multiple Mode Switches**

### Steps:
1. Start in guest mode, add some progress
2. Log in → check data
3. Log out → check guest data preserved
4. Log in again → check auth data preserved
5. Repeat 2-3 times

### ✅ Expected Results:
- Each mode maintains its own data
- No data mixing between modes
- Console logs show clear mode switches
- LottieLoader visible during each mode switch

### ❌ If you see:
- Data mixing between modes → FAIL
- Data lost on mode switch → FAIL
- No loader during mode switches → FAIL

---

## **🔍 Debugging Checklist**

If tests fail, check:

1. **Console Logs:**
   - Look for mode switch messages (`🔄 AUTH MODE` or `🔄 Switched to guest mode - cleared all auth data`)
   - Check loading messages (`📡 Fetching progress from backend database...` or `💾 Loading guest data...`)
   - Look for warnings about data mixing (should NOT appear in normal flow)
   - Verify `isAuthenticated` and `isGuest` values

2. **LottieLoader:**
   - Should be visible during ALL loading operations (prevents accidental refreshes)
   - Should show when `progressLoading`, `authLoading`, `loadingRef.current`, or `!progressLoaded`
   - If loader is NOT visible during loading, this is a bug

3. **LocalStorage Keys:**
   - `guestProgress` - Guest user progress (ONLY for guest mode)
   - `guestUserName` - Guest user name (ONLY for guest mode)
   - `quranProgress` - Authenticated user progress (cache, ONLY for authenticated users)
   - `authToken` - JWT token (auth only, should be cleared on logout)
   - `userData` - Authenticated user profile (auth only, should be cleared on logout)

4. **Component Props:**
   - `isGuest` prop should match localStorage state
   - `isAuthenticated` from AuthContext should match token presence

5. **Network Tab:**
   - Check API calls to `/api/auth/progress` (should only happen when authenticated)
   - Verify no guest data is sent to backend
   - If API call fails, authenticated users should start fresh (NOT use guest data)

6. **Data Separation:**
   - Authenticated users should NEVER read from `guestProgress`
   - Guest users should NEVER read from `quranProgress`
   - Logout should clear ALL auth data (`authToken`, `userData`, `quranProgress`)
   - Guest data should be preserved after logout

---

## **✅ Success Criteria**

All tests pass if:
- ✅ Guest and auth data are completely separate
- ✅ Guest data persists after logout
- ✅ Auth data loads from database, not localStorage (NEVER from guestProgress)
- ✅ No data mixing between modes
- ✅ Refresh works correctly in both modes
- ✅ Clear data only affects the current mode
- ✅ LottieLoader is visible during ALL loading operations (prevents accidental refreshes)
- ✅ Logout completely clears auth data and switches to guest mode
- ✅ Authenticated users NEVER use guestProgress as fallback, even on backend errors

