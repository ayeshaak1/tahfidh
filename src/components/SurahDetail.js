import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { ChevronLeft, ChevronRight, Settings, BookOpen, Menu, AlertCircle, ChevronDown, BookOpenCheck, ChevronUp, X, HelpCircle } from 'lucide-react';
import quranApi from '../services/quranApi';
import LottieLoader from './LottieLoader';
import { 
  CONSTRAINTS,
  VALID_VALUES,
  Validators
} from '../constants/storageConstants';

const SurahDetail = ({ userProgress, setUserProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const {
    quranFont,
    setQuranFont,
    showTranslation,
    setShowTranslation,
    showTransliteration,
    setShowTransliteration,
    autoScroll,
    arabicFontSize,
    setArabicFontSize,
    translationFontSize,
    setTranslationFontSize,
    transliterationFontSize,
    setTransliterationFontSize,
    resetFontSizes,
  } = useSettings();
  
  // Use quranFont from context as selectedFont
  const selectedFont = quranFont;
  const setSelectedFont = setQuranFont;
  
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState(new Set());
  const [currentVerse, setCurrentVerse] = useState(1);
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const processingVersesRef = useRef(new Set()); // Track verses currently being processed
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Ref for the font dropdown to handle click outside
  const fontDropdownRef = useRef(null);
  // Ref for the settings popup to handle click outside
  const settingsPopupRef = useRef(null);
  // Ref to track if we've already handled initial scroll for this surah
  const hasHandledInitialScroll = useRef(null);
  // Ref to track navigation instances - increment each time we navigate to a surah
  const navigationInstance = useRef(0);
  // Ref to track the last location key we processed
  const lastLocationKey = useRef(null);

  useEffect(() => {
    setCurrentPath(`/surah/${id}`);
    
    // Use location.key to detect navigation - it changes on every navigation
    // If location.key is different, we've navigated to this page (even if same surah)
    if (lastLocationKey.current !== location.key) {
      navigationInstance.current += 1;
      hasHandledInitialScroll.current = null;
      lastLocationKey.current = location.key;
    }
    
    // Immediately scroll to top when surah changes to prevent browser scroll restoration
    // Do it multiple times to ensure it sticks
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 10);
    fetchSurah();
  }, [id, location.key, setCurrentPath, fetchSurah]);

  useEffect(() => {
    let originalWidth = null;
    let originalLeft = null;
    let initialTop = null;
    
    const handleScroll = () => {
      const stickyHeader = document.querySelector('.surah-progress-header');
      if (!stickyHeader) return;
      
      // Store original dimensions on first load (when not fixed)
      if (originalWidth === null && stickyHeader.style.position !== 'fixed' && stickyHeader.style.position !== '') {
        originalWidth = stickyHeader.offsetWidth;
        const rect = stickyHeader.getBoundingClientRect();
        originalLeft = rect.left;
        initialTop = rect.top + window.pageYOffset; // Store absolute top position
      }
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Check if we've scrolled past the initial position of the progress bar
      // This accounts for all spacing (header + any margins/padding)
      const shouldBeFixed = initialTop !== null && scrollTop >= initialTop;
      setIsScrolled(shouldBeFixed);
      
      if (shouldBeFixed) {
        stickyHeader.style.position = 'fixed';
        stickyHeader.style.top = '0';
        stickyHeader.style.zIndex = '200';
        // Use stored original width and left position to maintain same size
        if (originalWidth !== null && originalLeft !== null) {
          stickyHeader.style.width = `${originalWidth}px`;
          stickyHeader.style.left = `${originalLeft}px`;
        }
        stickyHeader.style.right = 'auto';
      } else {
        stickyHeader.style.position = 'relative';
        stickyHeader.style.top = 'auto';
        stickyHeader.style.left = 'auto';
        stickyHeader.style.right = 'auto';
        stickyHeader.style.width = '100%';
        // Reset stored values when going back to relative (so they can be recalculated on resize)
        originalWidth = null;
        originalLeft = null;
        initialTop = null;
      }
    };

    const timeoutId = setTimeout(handleScroll, 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [sidebarOpen]);

  // Helper function to scroll to a specific verse with retries
  const scrollToVerse = (verseNumber, retries = 5, delay = 100) => {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        verseElement.classList.add('highlighted');
        setTimeout(() => {
          verseElement.classList.remove('highlighted');
        }, 2000);
      });
      return true;
    }
    
    // Retry if element not found and retries remaining
    if (retries > 0) {
      setTimeout(() => {
        scrollToVerse(verseNumber, retries - 1, delay);
      }, delay);
    }
    
    return false;
  };

  // Scroll restoration logic when surah loads or searchParams change
  // Separate effect for verse parameter to handle navigation from Dashboard
  useEffect(() => {
    if (!surah || loading) return;
    
    // Check if we have a verse parameter - if so, always scroll to it
    const verseParam = searchParams.get('verse');
    if (verseParam) {
      const verseNumber = parseInt(verseParam);
      if (!isNaN(verseNumber) && verseNumber > 0) {
        // First, ensure we're at top to prevent browser scroll restoration
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Wait for DOM to be fully rendered - check if verse elements exist
        const checkAndScroll = (attempts = 0) => {
          const verseElement = document.getElementById(`verse-${verseNumber}`);
          // Also check if any verse element exists to ensure DOM is ready
          const anyVerseElement = document.querySelector('[id^="verse-"]');
          
          if (verseElement) {
            // Verse found, scroll to it
            requestAnimationFrame(() => {
              verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              verseElement.classList.add('highlighted');
              setTimeout(() => {
                verseElement.classList.remove('highlighted');
              }, 2000);
            });
          } else if (anyVerseElement && attempts < 10) {
            // Verses are rendering but target verse not found yet, retry
            setTimeout(() => checkAndScroll(attempts + 1), 100);
          } else {
            // Verses not rendered yet or max attempts reached, scroll to top
            if (attempts >= 10) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              // Wait a bit more for initial render
              setTimeout(() => checkAndScroll(attempts + 1), 100);
            }
          }
        };
        
        const timeoutId = setTimeout(() => checkAndScroll(), 300);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [surah, loading, id, searchParams]); // Only depend on searchParams for verse parameter

  // Separate effect for initial scroll (most recent verse) - only on navigation, not when userProgress changes
  useEffect(() => {
    if (!surah || loading) return;
    
    // Only handle scroll on initial load, not when userProgress changes while already on page
    // Use navigation instance to track each navigation
    const currentInstance = navigationInstance.current;
    if (hasHandledInitialScroll.current === currentInstance) {
      return; // Already handled initial scroll for this navigation instance
    }
    
    // If there's a verse parameter, don't use this logic (the other effect handles it)
    const verseParam = searchParams.get('verse');
    if (verseParam) {
      return; // Verse parameter takes priority, handled by other effect
    }
    
    // Mark that we've handled initial scroll for this navigation instance
    hasHandledInitialScroll.current = currentInstance;

    // First, ensure we're at top to prevent browser scroll restoration
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Find the most recently memorized verse (by timestamp)
    const surahProgress = userProgress[id];
    let mostRecentVerse = null;
    let mostRecentTimestamp = null;
    
    if (surahProgress && surahProgress.verses) {
      // Find the verse with the most recent lastReviewed timestamp
      Object.keys(surahProgress.verses).forEach(verseNum => {
        const verse = surahProgress.verses[verseNum];
        if (verse.memorized && verse.lastReviewed) {
          const verseTimestamp = new Date(verse.lastReviewed).getTime();
          if (!mostRecentTimestamp || verseTimestamp > mostRecentTimestamp) {
            mostRecentTimestamp = verseTimestamp;
            mostRecentVerse = parseInt(verseNum);
          }
        }
      });
    }
    
    // Wait for DOM to be fully rendered before scrolling
    const checkAndScroll = (attempts = 0) => {
      if (mostRecentVerse) {
        const verseElement = document.getElementById(`verse-${mostRecentVerse}`);
        const anyVerseElement = document.querySelector('[id^="verse-"]');
        
        if (verseElement) {
          // Verse found, scroll to it
          requestAnimationFrame(() => {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseElement.classList.add('highlighted');
            setTimeout(() => {
              verseElement.classList.remove('highlighted');
            }, 2000);
          });
        } else if (anyVerseElement && attempts < 10) {
          // Verses are rendering but target verse not found yet, retry
          setTimeout(() => checkAndScroll(attempts + 1), 100);
        } else if (attempts >= 10) {
          // Max attempts reached, scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Wait a bit more for initial render
          setTimeout(() => checkAndScroll(attempts + 1), 100);
        }
      } else {
        // No memorized verses - ensure we're at top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    
    const timeoutId = setTimeout(() => checkAndScroll(), 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, loading, id, location.key]); // Only depend on location.key to detect navigation, not userProgress

  // Settings are now managed by SettingsContext, no need for local useEffect hooks

  // Handle click outside to close font dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
        setShowFontDropdown(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowFontDropdown(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Handle click outside to close settings popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && settingsPopupRef.current && !settingsPopupRef.current.contains(event.target)) {
        // Check if click is not on the settings button or its container
        const settingsButton = event.target.closest('.settings-toggle-btn-top, .settings-toggle-container');
        if (!settingsButton) {
          setShowSettings(false);
        }
      }
    };

    if (showSettings) {
      // Use a small delay to avoid immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSettings]);

  const fetchSurah = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quranApi.getSurah(id, selectedFont);
      setSurah(data);
      setCurrentVerse(1);
    } catch (err) {
      setError('Failed to load surah. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id, selectedFont]);

  const handleFontChange = async (font) => {
    setSelectedFont(font);
    setShowFontDropdown(false); // Close dropdown when font is changed
    
    try {
      setLoading(true);
      const data = await quranApi.getSurah(id, font);
      setSurah(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  if (!surah && loading) {
    return (
      <div className={`surah-detail ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="app-header">
          <div className="header-left">
            <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">Surah Detail</h1>
          </div>
        </header>
        
        <LottieLoader 
          size="large" 
          showVerse={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`surah-detail ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="app-header">
          <div className="header-left">
            <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">Surah Detail</h1>
          </div>
        </header>
        
        <div className="error-state">
          <div className="lottie-loader-container">
            {/* Bismillah */}
          
            {/* Error Icon */}
            <div className="error-icon-container">
              <AlertCircle size={64} className="error-icon" />
            </div>

            {/* Error Message */}
            <h3 className="loading-title">Failed to Load Surah</h3>
            <div className="loading-message">
              <p>{error}</p>
            </div>

            {/* Error Actions */}
            <div className="error-actions">
              <button className="retry-btn" onClick={fetchSurah}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!surah) return null;

  const totalVerses = surah.verses_count;

  // Calculate progress for current surah
  const calculateSurahProgress = () => {
    const surahProgress = userProgress[id];
    if (!surahProgress || !surahProgress.verses) {
      return { memorizedVerses: 0, percentage: 0 };
    }

    const verses = Object.values(surahProgress.verses);
    const memorizedVerses = verses.filter(verse => verse.memorized).length;
    const percentage = Math.round((memorizedVerses / totalVerses) * 100);

    return { memorizedVerses, percentage };
  };

  const progress = calculateSurahProgress();

  // Handle verse memorization toggle
  const toggleVerseMemorization = (verseId) => {
    // Prevent rapid clicks on the same verse
    if (processingVersesRef.current.has(verseId)) {
      return;
    }
    
    // Ensure verseId is a number for proper comparison
    const verseIdNum = typeof verseId === 'string' ? parseInt(verseId, 10) : verseId;
    
    // Mark this verse as being processed
    processingVersesRef.current.add(verseId);
    
    // Read current state before update to determine if we should auto-scroll
    const wasMemorized = userProgress[id]?.verses?.[verseId]?.memorized || false;
    
    setUserProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[id]) {
        newProgress[id] = { name: surah.name_simple, verses: {} };
      }
      if (!newProgress[id].verses[verseId]) {
        newProgress[id].verses[verseId] = { memorized: false, lastReviewed: null };
      }
      
      // Read the current memorized state from the previous state to avoid race conditions
      const currentMemorized = newProgress[id].verses[verseId]?.memorized || false;
      
      // Deep clone the verse object to ensure proper state update
      newProgress[id] = {
        ...newProgress[id],
        verses: {
          ...newProgress[id].verses,
          [verseId]: {
            ...newProgress[id].verses[verseId],
            memorized: !currentMemorized,
            lastReviewed: new Date().toISOString(),
          }
        }
      };
      
      // Don't save directly - App.js will handle saving to correct location (GUEST_PROGRESS or QURAN_PROGRESS + database)
      
      return newProgress;
    });
    
    // Auto-scroll to next verse if enabled and verse was just marked as memorized
    if (autoScroll && !wasMemorized && verseIdNum < totalVerses) {
      // Use requestAnimationFrame to ensure state update is processed
      requestAnimationFrame(() => {
        setTimeout(() => {
          const nextVerseId = verseIdNum + 1;
          scrollToVerse(nextVerseId);
        }, 100);
      });
    }
    
    // Remove from processing set after a short delay to allow state to update
    setTimeout(() => {
      processingVersesRef.current.delete(verseId);
    }, 100);
  };

  // Bulk actions
  const handleBulkSelect = (verseId) => {
    const newSelected = new Set(selectedVerses);
    if (newSelected.has(verseId)) {
      newSelected.delete(verseId);
    } else {
      newSelected.add(verseId);
    }
    setSelectedVerses(newSelected);
  };

  const handleMarkSelected = () => {
    setUserProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[id]) {
        newProgress[id] = { name: surah.name_simple, verses: {} };
      }
      
      // Check if all selected verses are currently memorized
      const selectedVersesArray = Array.from(selectedVerses);
      const allSelectedMemorized = selectedVersesArray.every(verseId => 
        newProgress[id].verses[verseId]?.memorized === true
      );
      
      // Toggle: if all selected are memorized, mark all as incomplete; otherwise mark all as complete
      const newMemorizedState = !allSelectedMemorized;
      
      selectedVersesArray.forEach(verseId => {
        if (!newProgress[id].verses[verseId]) {
          newProgress[id].verses[verseId] = { memorized: false, lastReviewed: null };
        }
        newProgress[id].verses[verseId].memorized = newMemorizedState;
        newProgress[id].verses[verseId].lastReviewed = new Date().toISOString();
      });
      
      // Don't save directly - App.js will handle saving to correct location (GUEST_PROGRESS or QURAN_PROGRESS + database)
      setSelectedVerses(new Set());
      setShowBulkActions(false);
      setBulkMode(false);
      return newProgress;
    });
  };

  const handleMarkAll = () => {
    setUserProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[id]) {
        newProgress[id] = { name: surah.name_simple, verses: {} };
      }
      
      // Check if all verses are currently memorized
      const allMemorized = Array.from({ length: totalVerses }, (_, i) => i + 1).every(verseNum => {
        return newProgress[id].verses[verseNum]?.memorized === true;
      });
      
      // Toggle: if all are memorized, mark all as incomplete; otherwise mark all as complete
      const newMemorizedState = !allMemorized;
      
      for (let i = 1; i <= totalVerses; i++) {
        if (!newProgress[id].verses[i]) {
          newProgress[id].verses[i] = { memorized: false, lastReviewed: null };
        }
        newProgress[id].verses[i].memorized = newMemorizedState;
        newProgress[id].verses[i].lastReviewed = new Date().toISOString();
      }
      
      // Don't save directly - App.js will handle saving to correct location (GUEST_PROGRESS or QURAN_PROGRESS + database)
      setShowBulkActions(false);
      setBulkMode(false);
      return newProgress;
    });
  };

  // Navigation
  const goToVerse = (verseNumber) => {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a subtle highlight effect
      verseElement.classList.add('highlighted');
      setTimeout(() => {
        verseElement.classList.remove('highlighted');
      }, 2000);
    }
  };

  const goToPreviousSurah = () => {
    const prevId = parseInt(id) - 1;
    if (prevId >= 1) {
      setLoading(true);
      navigate(`/surah/${prevId}`);
    }
  };

  const goToNextSurah = () => {
    const nextId = parseInt(id) + 1;
    if (nextId <= CONSTRAINTS.QURAN.TOTAL_SURAHS) {
      setLoading(true);
      navigate(`/surah/${nextId}`);
    }
  };

  return (
    <div className={`surah-detail ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">Surah Detail</h1>
        </div>
      </header>

      {/* Sticky Progress Bar */}
      <div className={`surah-progress-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="surah-progress-bar">
          <div className="progress-container">
            <div 
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <div className="progress-info-display">
            <span className="progress-text">{progress.memorizedVerses}/{totalVerses}</span>
            <span className="progress-percentage-display">{progress.percentage}%</span>
          </div>
        </div>
          </div>

      {/* Surah Title Section (Non-sticky) */}
      <div className="surah-title-section">
        <div className="surah-title">
          <h1 className="surah-arabic-title">{surah.name_arabic}</h1>
          <h2 className="surah-english-title">{surah.name_simple}</h2>
              </div>
        <div className="surah-meta">
          <span className="meta-item">Juz {surah.juz?.juz_number || surah.revelation_order || 'N/A'}</span>
          <span className="meta-item">{surah.revelation_place === 'makka' ? 'Meccan' : 'Medinan'}</span>
          <span className="meta-item">{surah.verses_count} verses</span>
        </div>
      </div>

      {/* Contextual Controls */}
      <div className="contextual-controls">
        {/* Settings Toggle Button - Top Right */}
        <div className="settings-toggle-container">
          <button 
            className="settings-toggle-btn-top"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} />
          </button>
        </div>
        {/* Settings Section - Removed inline display */}

        <div className="navigation-row">
        <div className="verse-jump">
          <input
            type="number"
            min="1"
            max={totalVerses}
            value={currentVerse}
            onChange={(e) => setCurrentVerse(parseInt(e.target.value) || 1)}
            className="verse-input"
          />
          <button className="go-btn" onClick={() => goToVerse(currentVerse)}>
            Go
          </button>
        </div>

        <div className="navigation-controls">
          <button 
              className="nav-btn nav-btn-prev"
            onClick={goToPreviousSurah}
            disabled={parseInt(id) <= 1}
          >
              <ChevronLeft size={16} />
              {parseInt(id) > 1 ? `Surah ${parseInt(id) - 1}` : 'Previous'}
          </button>
          <button 
              className="nav-btn nav-btn-next"
            onClick={goToNextSurah}
            disabled={parseInt(id) >= CONSTRAINTS.QURAN.TOTAL_SURAHS}
          >
              {parseInt(id) < CONSTRAINTS.QURAN.TOTAL_SURAHS ? `Surah ${parseInt(id) + 1}` : 'Next'}
              <ChevronRight size={16} />
          </button>
          </div>
        </div>
      </div>

      {/* Settings Popup */}
      {showSettings && (
        <>
          <div className="settings-popup-overlay" onClick={() => setShowSettings(false)}></div>
          <div className="settings-popup" ref={settingsPopupRef}>
            <div className="settings-popup-header">
              <h3>Settings</h3>
              <button 
                className="settings-close-btn"
                onClick={() => setShowSettings(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <div className="settings-top-row">
                <div className="font-selector">
                  <label className="setting-label">Font</label>
                  <div className="custom-dropdown" ref={fontDropdownRef}>
                    <button
                      className="dropdown-trigger"
                      onClick={() => setShowFontDropdown(!showFontDropdown)}
                    >
                      <span>{selectedFont === VALID_VALUES.FONT_TYPES.UTHMANI ? 'Uthmani' : 'IndoPak'}</span>
                      <ChevronDown 
                        size={16} 
                        className={`dropdown-arrow ${showFontDropdown ? 'rotated' : ''}`} 
                      />
                    </button>
                    {showFontDropdown && (
                      <div className="dropdown-menu">
                        <div 
                          className={`dropdown-item ${selectedFont === VALID_VALUES.FONT_TYPES.UTHMANI ? 'active' : ''}`}
                          onClick={() => { handleFontChange(VALID_VALUES.FONT_TYPES.UTHMANI); setShowFontDropdown(false); }}
                        >
                          Uthmani
                        </div>
                        <div 
                          className={`dropdown-item ${selectedFont === VALID_VALUES.FONT_TYPES.INDOPAK ? 'active' : ''}`}
                          onClick={() => { handleFontChange(VALID_VALUES.FONT_TYPES.INDOPAK); setShowFontDropdown(false); }}
                        >
                          IndoPak
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="display-toggles">
                  <label className="setting-label">Display Options</label>
                  <div className="toggle-buttons">
                    <button 
                      className={`toggle-btn ${showTranslation ? 'active' : ''}`}
                      onClick={() => setShowTranslation(!showTranslation)}
                    >
                      Translation
                    </button>
                    <button 
                      className={`toggle-btn ${showTransliteration ? 'active' : ''}`}
                      onClick={() => setShowTransliteration(!showTransliteration)}
                    >
                      Transliteration
                    </button>
                  </div>
                </div>

                <div className="bulk-actions">
                  <label className="setting-label">Bulk Operations</label>
                  <button 
                    className={`bulk-mode-btn ${bulkMode ? 'active' : ''}`}
                    onClick={() => {
                      const newBulkMode = !bulkMode;
                      setBulkMode(newBulkMode);
                      if (newBulkMode) {
                        // Turning bulk mode ON
                        setShowSettings(false);
                        setShowBulkActions(true);
                      } else {
                        // Turning bulk mode OFF
                        setShowBulkActions(false);
                      }
                    }}
                  >
                    Bulk Mode
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <div className="font-sizes-header-row">
                  <h4>Font Sizes</h4>
                  <button
                    className="reset-font-sizes-btn"
                    onClick={resetFontSizes}
                  >
                    Reset
                  </button>
                </div>
                <div className="setting-item">
                  <div className="font-size-control">
                    <div className="font-size-header">
                      <div className="label-with-help">
                        <label>Arabic Text</label>
                        <div className="help-tooltip">
                          <HelpCircle size={16} />
                          <span className="tooltip-text">Arabic text font size</span>
                        </div>
                      </div>
                      <span className="font-size-value">{arabicFontSize.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={CONSTRAINTS.FONT_SIZES.ARABIC.MIN}
                      max={CONSTRAINTS.FONT_SIZES.ARABIC.MAX}
                      step={CONSTRAINTS.FONT_SIZES.ARABIC.STEP}
                      value={arabicFontSize}
                      onChange={(e) => {
                        const newSize = parseFloat(e.target.value);
                        setArabicFontSize(Validators.validateFontSize(newSize, 'arabic'));
                      }}
                      className="font-size-range"
                    />
                  </div>

                  <div className="font-size-control">
                    <div className="font-size-header">
                      <div className="label-with-help">
                        <label>Translation</label>
                        <div className="help-tooltip">
                          <HelpCircle size={16} />
                          <span className="tooltip-text">Translation text font size</span>
                        </div>
                      </div>
                      <span className="font-size-value">{translationFontSize.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={CONSTRAINTS.FONT_SIZES.TRANSLATION.MIN}
                      max={CONSTRAINTS.FONT_SIZES.TRANSLATION.MAX}
                      step={CONSTRAINTS.FONT_SIZES.TRANSLATION.STEP}
                      value={translationFontSize}
                      onChange={(e) => {
                        const newSize = parseFloat(e.target.value);
                        setTranslationFontSize(Validators.validateFontSize(newSize, 'translation'));
                      }}
                      className="font-size-range"
                    />
                  </div>

                  <div className="font-size-control">
                    <div className="font-size-header">
                      <div className="label-with-help">
                        <label>Transliteration</label>
                        <div className="help-tooltip">
                          <HelpCircle size={16} />
                          <span className="tooltip-text">Transliteration text font size</span>
                        </div>
                      </div>
                      <span className="font-size-value">{transliterationFontSize.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={CONSTRAINTS.FONT_SIZES.TRANSLITERATION.MIN}
                      max={CONSTRAINTS.FONT_SIZES.TRANSLITERATION.MAX}
                      step={CONSTRAINTS.FONT_SIZES.TRANSLITERATION.STEP}
                      value={transliterationFontSize}
                      onChange={(e) => {
                        const newSize = parseFloat(e.target.value);
                        setTransliterationFontSize(Validators.validateFontSize(newSize, 'transliteration'));
                      }}
                      className="font-size-range"
                    />
                  </div>
                </div>
              </div>

              <div className="font-size-preview">
                <label className="setting-label">Preview</label>
                <div className="preview-container">
                  <div 
                    className={`preview-arabic-text ${selectedFont === VALID_VALUES.FONT_TYPES.UTHMANI ? VALID_VALUES.FONT_TYPES.UTHMANI : VALID_VALUES.FONT_TYPES.INDOPAK}`}
                    style={{ fontSize: `${arabicFontSize}rem` }}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </div>
                  <div 
                    className="preview-transliteration"
                    style={{ fontSize: `${transliterationFontSize}rem` }}
                  >
                    Bismillāhir-Raḥmānir-Raḥīm
                  </div>
                  <div 
                    className="preview-translation"
                    style={{ fontSize: `${translationFontSize}rem` }}
                  >
                    In the name of Allah, the Entirely Merciful, the Especially Merciful.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bulk Actions Popup */}
      {showBulkActions && (
        <div className="bulk-actions-popup">
          <div className="bulk-actions-popup-content">
            <button 
              className="bulk-action-btn"
              onClick={handleMarkSelected}
            >
              {(() => {
                const selectedVersesArray = Array.from(selectedVerses);
                if (selectedVersesArray.length === 0) return 'Mark Selected (0)';
                
                const allSelectedMemorized = selectedVersesArray.every(verseId => 
                  userProgress[id]?.verses?.[verseId]?.memorized === true
                );
                return allSelectedMemorized ? 'Mark Selected Incomplete' : 'Mark Selected Complete';
              })()}
            </button>
            <button 
              className="bulk-action-btn"
              onClick={handleMarkAll}
            >
              {(() => {
                const allMemorized = Array.from({ length: totalVerses }, (_, i) => i + 1).every(verseNum => 
                  userProgress[id]?.verses?.[verseNum]?.memorized === true
                );
                return allMemorized ? 'Mark All Incomplete' : 'Mark All Complete';
              })()}
            </button>
            <button 
              className="bulk-actions-close-btn"
              onClick={() => {
                setShowBulkActions(false);
                setBulkMode(false);
              }}
              title="Close bulk actions"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Verses Display */}
      <div className="verses-container">
        {/* Bismillah - only show if surah has it */}
        {surah.bismillah_pre && (
          <div className="bismillah-display">
            <div className="bismillah-text">
              ﷽
            </div>
          </div>
        )}

        {surah.verses && surah.verses.map(verse => {
          const verseNumber = verse.verse_key.split(':')[1];
          const isMemorized = userProgress[id]?.verses?.[verseNumber]?.memorized || false;
          const isSelected = selectedVerses.has(verseNumber);
          
          // Find translation and transliteration for this verse
          const verseTranslation = surah.translation?.find(t => t.verse_key === verse.verse_key);
          const verseTransliteration = surah.transliteration?.find(t => t.verse_key === verse.verse_key);

          return (
            <div 
              key={verse.verse_key}
              id={`verse-${verseNumber}`}
              className={`verse-card ${isMemorized ? 'memorized' : ''} ${isSelected ? 'selected' : ''}`}
            >
              <div className="verse-header">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                    onChange={() => handleBulkSelect(verseNumber)}
                      className="verse-checkbox"
                    />
                  )}
                <div className="verse-number">{verseNumber}</div>
                <div className="verse-actions">
                  <button 
                    className={`memorize-btn ${isMemorized ? 'memorized' : ''}`}
                    onClick={() => toggleVerseMemorization(verseNumber)}
                    title={isMemorized ? 'Verse memorized - Click to mark as incomplete' : 'Verse not memorized - Click to mark as complete'}
                  >
                    {isMemorized ? <BookOpenCheck size={20} /> : <BookOpen size={20} />}
                  </button>
                </div>
              </div>

              <div 
                className="verse-content"
                style={{ 
                  gap: `${Math.max(arabicFontSize, translationFontSize, transliterationFontSize) * 0.4}rem`
                }}
              >
                <div 
                  className={`arabic-text ${selectedFont}`}
                  style={{ 
                    fontSize: `${arabicFontSize}rem`,
                    marginBottom: `${arabicFontSize * 0.4}rem`
                  }}
                >
                  {selectedFont === VALID_VALUES.FONT_TYPES.UTHMANI ? verse.text_uthmani : verse.text_indopak}
                </div>
                
                {showTransliteration && (
                  <div 
                    className="transliteration"
                    style={{ 
                      fontSize: `${transliterationFontSize}rem`,
                      marginTop: `${transliterationFontSize * 0.5}rem`,
                      marginBottom: `${transliterationFontSize * 0.5}rem`
                    }}
                  >
                    {verseTransliteration ? (
                      verseTransliteration.text
                    ) : (
                      <span style={{ opacity: 0.6, fontStyle: 'italic' }}>
                        Transliteration not available
                      </span>
                    )}
                  </div>
                )}
                
                {showTranslation && (
                  <div 
                    className="translation"
                    style={{ 
                      fontSize: `${translationFontSize}rem`,
                      marginTop: `${translationFontSize * 0.5}rem`,
                      marginBottom: `${translationFontSize * 0.5}rem`
                    }}
                  >
                    {verseTranslation ? (
                      verseTranslation.text
                    ) : (
                      <span style={{ opacity: 0.6, fontStyle: 'italic' }}>
                        Translation not available
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll to top button */}
        <button 
        className="scroll-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ display: isScrolled ? 'block' : 'none' }}
      >
        <ChevronUp size={20} />
        </button>
    </div>
  );
};

export default SurahDetail;