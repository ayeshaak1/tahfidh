import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import SurahList from './components/SurahList';
import SurahDetail from './components/SurahDetail';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LottieLoader from './components/LottieLoader';
import versePreloader from './services/versePreloader';
import progressApi from './services/progressApi';
import { STORAGE_KEYS, DEFAULT_VALUES, StorageHelpers, Validators } from './constants/storageConstants';
import './App.css';
import './components.css';

function AppContent() {
  const [isGuest, setIsGuest] = useState(true);
  const [userProgress, setUserProgress] = useState(DEFAULT_VALUES.USER_PROGRESS);
  const [currentPath, setCurrentPath] = useState('/');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [forceLoadTrigger, setForceLoadTrigger] = useState(0); // Force load effect to re-run when mode transition completes
  const { isAuthenticated, hasCompletedOnboarding, loading: authLoading } = useAuth();
  const loadingRef = useRef(false); // Prevent concurrent loads
  const modeRef = useRef(null); // Track current mode to prevent cross-contamination
  const modeTransitionRef = useRef(false); // Track if we're in a mode transition

  // Handle authentication state changes: switch between guest and authenticated mode
  // CRITICAL: Guest and Authenticated are COMPLETELY SEPARATE - never mix their data
  useEffect(() => {
    // Wait for auth to finish loading before switching modes
    if (authLoading) {
      return;
    }

    const currentMode = isAuthenticated ? 'authenticated' : 'guest';
    
    // Only switch if mode actually changed
    if (modeRef.current === currentMode) {
      return;
    }

    // Mark that we're in a mode transition to prevent save effect from running
    modeTransitionRef.current = true;

    if (isAuthenticated) {
      // User is logged in, switch to authenticated mode
      modeRef.current = 'authenticated';
      setIsGuest(false);
      setProgressLoaded(false);
      loadingRef.current = false;
      // CRITICAL: Initialize QURAN_PROGRESS immediately with empty progress
      // This ensures it exists in localStorage right away, preventing infinite loading
      // The backend fetch will update it with actual data
      StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
      // Reset userProgress state - will be loaded from database
      setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
      console.log('🔄 AUTH MODE - initialized quranProgress in localStorage');
      
      // CRITICAL: Clear transition flag and force load effect to re-run
      // Use requestAnimationFrame to ensure it happens after React state updates
      requestAnimationFrame(() => {
        modeTransitionRef.current = false;
        // Force load effect to re-run by updating state
        setForceLoadTrigger(prev => prev + 1);
        console.log('✅ Mode transition complete - forcing load effect to run');
      });
    } else {
      // User is logged out, switch to guest mode
      // CRITICAL: Save authenticated progress to backend BEFORE clearing (if it exists)
      const authProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
      if (authProgress && Object.keys(authProgress).length > 0) {
        // We're logging out - save authenticated progress to backend one last time
        // But DON'T save it to guestProgress - it belongs to the authenticated user
        const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          // Try to save to backend one last time (fire and forget)
          progressApi.saveProgress(authProgress).catch(() => {
            // Ignore errors - we're logging out anyway
          });
        }
      }
      
      modeRef.current = 'guest';
      setIsGuest(true);
      setProgressLoaded(false);
      loadingRef.current = false;
      // AGGRESSIVELY clear ALL authenticated data when switching to guest
      // This ensures no auth data can leak into guest mode
      // CRITICAL: Clear auth data FIRST before loading guest data to prevent contamination
      StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
      StorageHelpers.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      StorageHelpers.removeItem(STORAGE_KEYS.USER_DATA);
      StorageHelpers.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      // Reset userProgress state - will be loaded from GUEST_PROGRESS
      setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
      console.log('🔄 Switched to guest mode - cleared all auth data');
      
      // CRITICAL: Clear transition flag and force load effect to re-run
      // Use requestAnimationFrame to ensure it happens after React state updates
      requestAnimationFrame(() => {
        modeTransitionRef.current = false;
        // Force load effect to re-run by updating state
        setForceLoadTrigger(prev => prev + 1);
        console.log('✅ Mode transition complete (guest) - forcing load effect to run');
      });
    }
  }, [isAuthenticated, authLoading]);

  // Handle OAuth, migrations, and scroll restoration (runs once on mount)
  useEffect(() => {
    // Disable browser scroll restoration to prevent unwanted scrolling
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // MIGRATION: Move old USER_NAME to GUEST_USER_NAME for existing guest users
    const oldUserName = localStorage.getItem('userName');
    const newGuestUserName = localStorage.getItem('guestUserName');
    if (oldUserName && !newGuestUserName) {
      localStorage.setItem('guestUserName', oldUserName);
      localStorage.removeItem('userName');
    }

    // Handle Google OAuth callback with token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      // Store token and verify user
      StorageHelpers.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      // Clear the token from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Reload to trigger auth check
      window.location.reload();
    } else if (error === 'oauth_failed') {
      console.error('Google OAuth authentication failed');
      // Clear error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Initialize verse preloader
    versePreloader.preloadRandomVerses(10);
  }, []);

  // Load progress when auth state is determined
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // CRITICAL: If we have an auth token but isAuthenticated is still false, wait for auth to resolve
    // This prevents loading guest data when we're actually authenticated
    const hasAuthToken = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN, null);
    if (hasAuthToken && !isAuthenticated) {
      // Auth is still being verified, wait for it to complete
      return;
    }
    
    // CRITICAL: If we're authenticated but mode hasn't switched yet, wait
    // This prevents race conditions during mode switches
    // BUT: If modeRef is null (initial state), allow it to proceed
    const expectedMode = isAuthenticated ? 'authenticated' : 'guest';
    if (modeRef.current !== null && modeRef.current !== expectedMode) {
      console.log('⏳ Waiting for mode switch to complete. Current mode:', modeRef.current, 'Expected:', expectedMode);
      return;
    }
    
    // NOTE: We don't check modeTransitionRef here - the load effect should run during transitions
    // The transition flag is only used to prevent the save effect from running

    // Prevent concurrent loads
    if (loadingRef.current) {
      return;
    }

    // Don't reload if we've already loaded
    if (progressLoaded) {
      return;
    }

    // Mark as loading - MUST be set BEFORE any async operations
    loadingRef.current = true;
    setProgressLoading(true);

    // Load progress: from backend if authenticated, otherwise from localStorage (guest mode)
    const loadProgress = async () => {
      console.log('🔄 Loading progress...');
      
      // CRITICAL: Reset state FIRST before loading to prevent any contamination
      setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
      
      // CRITICAL: Double-check mode before reading any cache
      // If mode changed during load, abort and let the mode switch effect handle it
      const currentMode = isAuthenticated ? 'authenticated' : 'guest';
      if (modeRef.current !== null && modeRef.current !== currentMode) {
        console.warn('⚠️ Mode changed during load, aborting');
        setProgressLoading(false);
        loadingRef.current = false;
        return;
      }
      
      try {
        // CRITICAL: Re-check mode after async delay (mode might have changed during load)
        const finalMode = isAuthenticated ? 'authenticated' : 'guest';
        if (modeRef.current !== null && modeRef.current !== finalMode) {
          console.warn('⚠️ Mode changed during async load, aborting');
          setProgressLoading(false);
          loadingRef.current = false;
          return;
        }
        
        if (isAuthenticated) {
          // For authenticated users: ONLY fetch from database, NEVER touch guest data
          console.log('📡 Fetching progress from backend database (authenticated user)...');
          
          // CRITICAL: Don't clear QURAN_PROGRESS if it's already empty (just initialized)
          // This ensures it exists in localStorage immediately, preventing infinite loading
          // We'll overwrite it with backend data anyway
          const existingProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
          if (existingProgress && Object.keys(existingProgress).length > 0) {
            // Only clear if it has data (might be stale) - if empty, keep it to prevent loading issues
            console.log('⚠️ Clearing existing QURAN_PROGRESS cache to fetch fresh data from backend');
            StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
          } else {
            console.log('✅ QURAN_PROGRESS already initialized (empty), will be updated with backend data');
          }
          
          // CRITICAL: Ensure we're NOT reading from guest cache during load
          // Note: Guest data may exist in localStorage (preserved for when user logs out)
          // This is EXPECTED and CORRECT - we just ensure we don't use it for authenticated users
          
          // Double-check: ensure guest cache is NOT being read
          // Only read from backend, never from localStorage
          const backendProgress = await progressApi.fetchProgress();
          
          // Final mode check after async operation
          const postAsyncMode = isAuthenticated ? 'authenticated' : 'guest';
          if (modeRef.current !== null && modeRef.current !== postAsyncMode) {
            console.warn('⚠️ Mode changed after async fetch, aborting');
            setProgressLoading(false);
            loadingRef.current = false;
            setProgressLoaded(true); // CRITICAL: Set progressLoaded even on early return
            return;
          }
          
          // CRITICAL: Don't check/clear quranProgress here - we want to keep it if it was just initialized
          // We'll overwrite it with backend data anyway, so no need to clear it
          
          // Check if backend returned valid progress
          if (backendProgress !== null && backendProgress !== undefined && Validators.isValidUserProgress(backendProgress)) {
            // Set progress from backend ONLY (source of truth for authenticated users)
            // CRITICAL: NEVER use guestProgress as fallback - only use backend data
            
            // CRITICAL: Set QURAN_PROGRESS in localStorage FIRST, before setting state
            // This ensures it exists immediately and prevents infinite loading
            StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, backendProgress);
            
            // Verify it was set
            const verifyProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
            if (!verifyProgress || Object.keys(verifyProgress).length === 0) {
              console.error('❌ CRITICAL: Failed to set QURAN_PROGRESS in localStorage!');
            } else {
              console.log('✅ QURAN_PROGRESS set in localStorage:', Object.keys(verifyProgress).length, 'surahs');
            }
            
            // Now set the state - this will trigger the save effect, but quranProgress is already set
            setUserProgress(backendProgress);
            // CRITICAL: Ensure guest cache is NOT touched or read
            console.log('✅ Progress loaded from database and cached (authenticated):', Object.keys(backendProgress).length, 'surahs');
            
            // CRITICAL: Clear loading flags and set progressLoaded immediately
            // This ensures the loader disappears as soon as data is loaded
            loadingRef.current = false;
            setProgressLoading(false);
            setProgressLoaded(true);
            console.log('✅ All loading flags cleared - progressLoaded set to true, loader should disappear now');
          } else {
            // Backend returned invalid/empty data - start completely fresh
            // CRITICAL: NEVER fall back to guestProgress - authenticated users must only use backend data
            
            // CRITICAL: Set QURAN_PROGRESS in localStorage FIRST, even for empty progress
            StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
            
            // Verify it was set
            const verifyProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
            console.log('✅ QURAN_PROGRESS set in localStorage (empty):', verifyProgress ? 'exists' : 'missing');
            
            setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
            console.log('⚠️ No DB progress, starting fresh (authenticated user)');
            
            // CRITICAL: Clear loading flags and set progressLoaded immediately even for empty progress
            loadingRef.current = false;
            setProgressLoading(false);
            setProgressLoaded(true);
            console.log('✅ All loading flags cleared (empty progress) - progressLoaded set to true, loader should disappear now');
          }
        } else {
          // Guest mode: ONLY use GUEST_PROGRESS, NEVER touch authenticated cache
          console.log('💾 Loading guest data...');
          
          // CRITICAL: Aggressively clear ALL auth data before loading guest data
          // This prevents any auth data from leaking into guest mode on refresh
          StorageHelpers.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          StorageHelpers.removeItem(STORAGE_KEYS.USER_DATA);
          StorageHelpers.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
          StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
          console.log('🧹 Cleared auth data');
          
          // CRITICAL: Verify we're NOT reading from authenticated cache
          // Double-check that QURAN_PROGRESS is not being read
          const authCheck = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
          if (authCheck && Object.keys(authCheck).length > 0) {
            console.warn('⚠️ Auth data found in QURAN_PROGRESS during guest load - it should have been cleared');
            // Force clear it again
            StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
          }
          
          // CRITICAL: Ensure we're not reading from authenticated cache
          // Only read from GUEST_PROGRESS, never from QURAN_PROGRESS
          const guestProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.GUEST_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
          
          // Final mode check after reading cache
          const postCacheMode = isAuthenticated ? 'authenticated' : 'guest';
          if (modeRef.current !== null && modeRef.current !== postCacheMode) {
            console.warn('⚠️ Mode changed after reading cache, aborting');
            setProgressLoading(false);
            loadingRef.current = false;
            setProgressLoaded(true); // CRITICAL: Set progressLoaded even on early return
            return;
          }
          
          if (guestProgress && Validators.isValidUserProgress(guestProgress)) {
            setUserProgress(guestProgress);
            console.log('✅ Loaded guest:', Object.keys(guestProgress).length, 'surahs');
          } else if (guestProgress) {
            // If progress exists but is invalid, reset to empty
            console.warn('⚠️ Invalid progress data detected, resetting to empty progress');
            setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
          } else {
            // No saved progress, start with empty
            setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
            console.log('ℹ️ No guest data');
          }
        }
      } catch (error) {
        console.error('❌ Error loading progress:', error);
        // CRITICAL: For authenticated users: if backend fails, start fresh (NEVER use guest data as fallback)
        // CRITICAL: NEVER read from GUEST_PROGRESS for authenticated users, even on error
        if (isAuthenticated) {
          // Final mode check - ensure we're still authenticated
          const errorMode = isAuthenticated ? 'authenticated' : 'guest';
          if (modeRef.current !== null && modeRef.current !== errorMode) {
            console.warn('⚠️ Mode changed during error handling, aborting');
            setProgressLoading(false);
            loadingRef.current = false;
            return;
          }
          // Clear any potential contamination
          StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
          // Start fresh - NEVER use guestProgress
          setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
          StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
          console.log('⚠️ Backend fetch failed, starting fresh (authenticated user) - guest data NOT used');
        } else {
          // For guest users: start fresh on error
          setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
        }
      } finally {
        // CRITICAL: Always set progressLoaded to true, even on error, to prevent infinite loading
        // Set these flags to ensure loading completes
        loadingRef.current = false;
        setProgressLoading(false);
        // CRITICAL: Set progressLoaded to true immediately - this makes the loader disappear
        // Don't use setTimeout as it can cause the loader to stay visible
        setProgressLoaded(true);
        console.log('✅ Loading complete - progressLoaded set to true, loader should disappear');
      }
    };

    loadProgress();
  }, [isAuthenticated, authLoading, forceLoadTrigger]);


  // Save progress to backend (if authenticated) and localStorage whenever userProgress changes
  useEffect(() => {
    // CRITICAL: Don't save if we're currently loading progress (prevents race conditions on refresh)
    if (progressLoading || loadingRef.current) {
      return;
    }
    
    // Don't save if we're still loading progress (to avoid overwriting with empty/default)
    if (!progressLoaded) {
      return;
    }
    
    // Don't save if auth is still loading (to avoid saving during mode switches)
    if (authLoading) {
      return;
    }
    
    // CRITICAL: Don't save during mode transitions - this prevents authenticated progress from being saved to guestProgress
    if (modeTransitionRef.current) {
      console.log('⚠️ Mode transition in progress, skipping save to prevent data contamination');
      return;
    }
    
    // CRITICAL: Only save if we're in the correct mode (prevent cross-contamination)
    const currentMode = isAuthenticated ? 'authenticated' : 'guest';
    if (modeRef.current !== currentMode) {
      console.warn('⚠️ Mode mismatch detected, skipping save. Current mode:', currentMode, 'Tracked mode:', modeRef.current);
      return;
    }

    // Allow saving empty progress (needed for clear data functionality)
    // Empty progress is valid and should be saved to clear existing data

    // CRITICAL: Save to appropriate localStorage key based on user type - COMPLETELY SEPARATE
    // DOUBLE-CHECK: Verify mode matches before saving to prevent any cross-contamination
    if (isAuthenticated && modeRef.current === 'authenticated') {
      // Authenticated users: save to QURAN_PROGRESS (cache) and backend (source of truth)
      // CRITICAL: NEVER touch GUEST_PROGRESS - ensure complete separation
      // Explicitly verify we're NOT saving to guestProgress
      const beforeGuest = StorageHelpers.getJSONItem(STORAGE_KEYS.GUEST_PROGRESS);
      // Save ONLY to QURAN_PROGRESS for authenticated users
      StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, userProgress);
      // Verify guestProgress was NOT modified
      const afterGuest = StorageHelpers.getJSONItem(STORAGE_KEYS.GUEST_PROGRESS);
      if (JSON.stringify(beforeGuest) !== JSON.stringify(afterGuest)) {
        console.error('❌ CRITICAL ERROR: Guest progress was modified during authenticated save!');
        // Restore guest progress
        if (beforeGuest) {
          StorageHelpers.setItem(STORAGE_KEYS.GUEST_PROGRESS, beforeGuest);
        }
      }
      // NEVER save to GUEST_PROGRESS when authenticated
      progressApi.saveProgress(userProgress).catch(error => {
        console.error('Failed to save progress to backend:', error);
        // Progress is still saved in localStorage, so user won't lose data
      });
    } else if (!isAuthenticated && modeRef.current === 'guest') {
      // Guest users: save to GUEST_PROGRESS only (separate from authenticated users)
      // CRITICAL: NEVER touch QURAN_PROGRESS - ensure complete separation
      // Explicitly verify we're NOT saving to quranProgress
      const beforeAuth = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
      // Clear any auth data that might exist
      if (beforeAuth && Object.keys(beforeAuth).length > 0) {
        console.warn('⚠️ Auth data found in QURAN_PROGRESS during guest save - clearing it');
        StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
      }
      // Save ONLY to GUEST_PROGRESS for guest users
      StorageHelpers.setItem(STORAGE_KEYS.GUEST_PROGRESS, userProgress);
      // Verify quranProgress was NOT modified (should be empty/cleared)
      const afterAuth = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS);
      if (afterAuth && Object.keys(afterAuth).length > 0) {
        console.error('❌ CRITICAL ERROR: Auth progress was modified during guest save!');
        // Clear it
        StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
      }
      // NEVER save to QURAN_PROGRESS when in guest mode
    } else {
      // Mode mismatch - don't save to prevent contamination
      console.warn('⚠️ Mode mismatch during save - skipping to prevent data contamination');
    }
  }, [userProgress, isAuthenticated, progressLoaded, authLoading]);

  const handleGuestMode = () => {
    // If authenticated, do NOT allow switching to guest data; keep modes isolated
    if (isAuthenticated) {
      console.warn('Guest mode ignored because user is authenticated');
      return;
    }

    modeRef.current = 'guest';
    setIsGuest(true);
    // Reset progress loaded flag when switching to guest mode
    setProgressLoaded(false);
    // Set loading state to show LottieLoader
    setProgressLoading(true);
    loadingRef.current = true;
    
    // Load progress from guest-specific localStorage key
    // Use setTimeout to ensure loading state is visible
    setTimeout(() => {
      const guestProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.GUEST_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
      if (guestProgress && Validators.isValidUserProgress(guestProgress)) {
        setUserProgress(guestProgress);
      } else {
        // Only set to empty if there's no valid saved progress
        setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
      }
      setProgressLoaded(true);
      setProgressLoading(false);
      loadingRef.current = false;
    }, 100); // Small delay to ensure loader is visible
  };

  // Show loading screen while progress is being loaded or auth is loading
  // This prevents accidental refreshes during critical data loading operations
  // CRITICAL: Show loader during ALL loading states to prevent accidental refreshes
  // BUT: Allow landing page, signin, signup to show even if progress isn't loaded (they don't need it)
  const isPublicRoute = ['/', '/signin', '/signup'].includes(currentPath);
  const shouldShowLoader = (progressLoading || authLoading || loadingRef.current || !progressLoaded) && !isPublicRoute;
  
  if (shouldShowLoader) {
    return (
      <div className="App">
        <LottieLoader size="large" showVerse={true} />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {/* Show Navigation for all routes except landing, signin, signup, onboarding */}
        {!['/', '/signin', '/signup', '/onboarding'].includes(currentPath) && (
          <Navigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        <Routes>
          <Route 
            path="/" 
            element={
              <LandingPage 
                onGuestMode={handleGuestMode}
                setCurrentPath={setCurrentPath}
              />
            } 
          />
          <Route 
            path="/signin" 
            element={<Auth setCurrentPath={setCurrentPath} onGuestMode={handleGuestMode} />} 
          />
          <Route 
            path="/signup" 
            element={<Auth setCurrentPath={setCurrentPath} onGuestMode={handleGuestMode} />} 
          />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Onboarding setCurrentPath={setCurrentPath} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                isGuest={isGuest || (!isAuthenticated && !authLoading)}
                userProgress={userProgress}
                setUserProgress={setUserProgress}
                setCurrentPath={setCurrentPath}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            } 
          />
          <Route 
            path="/surahs" 
            element={
              <SurahList 
                userProgress={userProgress}
                setUserProgress={setUserProgress}
                setCurrentPath={setCurrentPath}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            } 
          />
          <Route 
            path="/surah/:id" 
            element={
              <SurahDetail 
                userProgress={userProgress}
                setUserProgress={setUserProgress}
                setCurrentPath={setCurrentPath}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <Profile 
                isGuest={isGuest || (!isAuthenticated && !authLoading)}
                userProgress={userProgress}
                setUserProgress={setUserProgress}
                setCurrentPath={setCurrentPath}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            } 
          />
        </Routes>
        {/* Footer - Show on all pages except landing, signin, signup, onboarding */}
        {!['/', '/signin', '/signup', '/onboarding'].includes(currentPath) && (
          <Footer sidebarOpen={sidebarOpen} />
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
