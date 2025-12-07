import React, { useState, useEffect } from 'react';
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
import versePreloader from './services/versePreloader';
import { STORAGE_KEYS, DEFAULT_VALUES, StorageHelpers, Validators } from './constants/storageConstants';
import './App.css';
import './components.css';

function AppContent() {
  const [isGuest, setIsGuest] = useState(true);
  const [userProgress, setUserProgress] = useState(DEFAULT_VALUES.USER_PROGRESS);
  const [currentPath, setCurrentPath] = useState('/');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    // Disable browser scroll restoration to prevent unwanted scrolling
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
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

    // Load saved progress from localStorage
    const savedProgress = StorageHelpers.getJSONItem(STORAGE_KEYS.QURAN_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
    if (savedProgress && Validators.isValidUserProgress(savedProgress)) {
      setUserProgress(savedProgress);
    } else if (savedProgress) {
      // If progress exists but is invalid, reset to empty
      console.warn('Invalid progress data detected, resetting to empty progress');
      setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
    }

    // Initialize verse preloader
    console.log('Initializing verse preloader...');
    versePreloader.preloadRandomVerses(10);
  }, []);


  // Save progress to localStorage whenever userProgress changes
  useEffect(() => {
    if (Object.keys(userProgress).length > 0) {
      StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, userProgress);
    }
  }, [userProgress]);

  const handleGuestMode = () => {
    setIsGuest(true);
    // Initialize empty progress for guest
    setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
  };

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
                isGuest={!isAuthenticated}
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
                isGuest={!isAuthenticated}
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
