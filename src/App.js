import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SurahList from './components/SurahList';
import SurahDetail from './components/SurahDetail';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import versePreloader from './services/versePreloader';
import './App.css';
import './components.css';

function App() {
  const [isGuest, setIsGuest] = useState(true);
  const [userProgress, setUserProgress] = useState({});
  const [currentPath, setCurrentPath] = useState('/');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('quranProgress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }

    // Initialize verse preloader
    console.log('🚀 Initializing verse preloader...');
    versePreloader.preloadRandomVerses(10);
  }, []);

  // Save progress to localStorage whenever userProgress changes
  useEffect(() => {
    if (Object.keys(userProgress).length > 0) {
      localStorage.setItem('quranProgress', JSON.stringify(userProgress));
    }
  }, [userProgress]);

  const handleGuestMode = () => {
    setIsGuest(true);
    // Initialize empty progress for guest
    setUserProgress({});
  };

  const handleSignUp = () => {
    setIsGuest(false);
    // In a real app, this would handle user authentication
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          {/* Show Navigation for all routes except landing page */}
          {currentPath !== '/' && <Navigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage 
                  onGuestMode={handleGuestMode}
                  onSignUp={handleSignUp}
                  setCurrentPath={setCurrentPath}
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  isGuest={isGuest}
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
                  isGuest={isGuest}
                  userProgress={userProgress}
                  setCurrentPath={setCurrentPath}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              } 
            />
          </Routes>
          {/* Footer - Show on all pages except landing page */}
          {currentPath !== '/' && <Footer sidebarOpen={sidebarOpen} />}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
