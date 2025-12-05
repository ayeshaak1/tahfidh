import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronLeft, ChevronRight, Settings, BookOpen, Menu, AlertCircle, ChevronDown, BookOpenCheck, ChevronUp, X } from 'lucide-react';
import quranApi from '../services/quranApi';
import LottieLoader from './LottieLoader';

const SurahDetail = ({ userProgress, setUserProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Load saved preferences from localStorage or use defaults
  const [selectedFont, setSelectedFont] = useState(() => {
    const saved = localStorage.getItem('quranFontPreference');
    return saved || 'uthmani';
  });
  
  const [showTranslation, setShowTranslation] = useState(() => {
    const saved = localStorage.getItem('showTranslationPreference');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [showTransliteration, setShowTransliteration] = useState(() => {
    const saved = localStorage.getItem('showTransliterationPreference');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Font size preferences
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    const saved = localStorage.getItem('arabicFontSize');
    return saved ? parseFloat(saved) : 2.5; // Default 2.5rem
  });
  
  const [translationFontSize, setTranslationFontSize] = useState(() => {
    const saved = localStorage.getItem('translationFontSize');
    return saved ? parseFloat(saved) : 1.0; // Default 1rem
  });
  
  const [transliterationFontSize, setTransliterationFontSize] = useState(() => {
    const saved = localStorage.getItem('transliterationFontSize');
    return saved ? parseFloat(saved) : 1.0; // Default 1rem
  });
  
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState(new Set());
  const [currentVerse, setCurrentVerse] = useState(1);
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Ref for the font dropdown to handle click outside
  const fontDropdownRef = useRef(null);
  // Ref for the settings popup to handle click outside
  const settingsPopupRef = useRef(null);

  useEffect(() => {
    setCurrentPath(`/surah/${id}`);
    fetchSurah();
  }, [id, setCurrentPath]);

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

  // Scroll to top or last memorized verse when surah loads or changes
  useEffect(() => {
    if (!surah || loading) return;

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      // Get the last memorized verse for this specific surah
      const surahProgress = userProgress[id];
      let lastVerse = null;
      
      if (surahProgress && surahProgress.verses) {
        // Find the highest verse number that is memorized
        Object.keys(surahProgress.verses).forEach(verseNum => {
          const verse = surahProgress.verses[verseNum];
          if (verse.memorized) {
            const verseNumber = parseInt(verseNum);
            if (!lastVerse || verseNumber > lastVerse) {
              lastVerse = verseNumber;
            }
          }
        });
      }
      
      if (lastVerse) {
        // Scroll to the last memorized verse
        const verseElement = document.getElementById(`verse-${lastVerse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          verseElement.classList.add('highlighted');
          setTimeout(() => {
            verseElement.classList.remove('highlighted');
          }, 2000);
        } else {
          // If verse element not found yet, scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // No memorized verses, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [surah, loading, id, userProgress]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quranFontPreference', selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem('showTranslationPreference', JSON.stringify(showTranslation));
  }, [showTranslation]);

  useEffect(() => {
    localStorage.setItem('showTransliterationPreference', JSON.stringify(showTransliteration));
  }, [showTransliteration]);

  // Save font sizes to localStorage
  useEffect(() => {
    localStorage.setItem('arabicFontSize', arabicFontSize.toString());
  }, [arabicFontSize]);

  useEffect(() => {
    localStorage.setItem('translationFontSize', translationFontSize.toString());
  }, [translationFontSize]);

  useEffect(() => {
    localStorage.setItem('transliterationFontSize', transliterationFontSize.toString());
  }, [transliterationFontSize]);

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

  const fetchSurah = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quranApi.getSurah(id, selectedFont);
      console.log('Surah data received:', data);
      console.log('Translation data:', data.translation);
      console.log('Transliteration data:', data.transliteration);
      setSurah(data);
      setCurrentVerse(1);
    } catch (err) {
      console.error('Failed to fetch surah:', err);
      setError('Failed to load surah. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFontChange = async (font) => {
    setSelectedFont(font);
    setShowFontDropdown(false); // Close dropdown when font is changed
    
    try {
      setLoading(true);
      const data = await quranApi.getSurah(id, font);
      setSurah(data);
    } catch (err) {
      console.error('Failed to fetch surah with new font:', err);
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
    setUserProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[id]) {
        newProgress[id] = { name: surah.name_simple, verses: {} };
      }
      if (!newProgress[id].verses[verseId]) {
        newProgress[id].verses[verseId] = { memorized: false, lastReviewed: null };
      }
      
      newProgress[id].verses[verseId].memorized = !newProgress[id].verses[verseId].memorized;
      newProgress[id].verses[verseId].lastReviewed = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem('quranProgress', JSON.stringify(newProgress));
      
      return newProgress;
    });
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
      
      localStorage.setItem('quranProgress', JSON.stringify(newProgress));
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
      
      localStorage.setItem('quranProgress', JSON.stringify(newProgress));
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
    if (nextId <= 114) {
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
            disabled={parseInt(id) >= 114}
          >
              {parseInt(id) < 114 ? `Surah ${parseInt(id) + 1}` : 'Next'}
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
                      <span>{selectedFont === 'uthmani' ? 'Uthmani' : 'IndoPak'}</span>
                      <ChevronDown 
                        size={16} 
                        className={`dropdown-arrow ${showFontDropdown ? 'rotated' : ''}`} 
                      />
                    </button>
                    {showFontDropdown && (
                      <div className="dropdown-menu">
                        <div 
                          className={`dropdown-item ${selectedFont === 'uthmani' ? 'active' : ''}`}
                          onClick={() => { handleFontChange('uthmani'); setShowFontDropdown(false); }}
                        >
                          Uthmani
                        </div>
                        <div 
                          className={`dropdown-item ${selectedFont === 'indopak' ? 'active' : ''}`}
                          onClick={() => { handleFontChange('indopak'); setShowFontDropdown(false); }}
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

              <div className="font-size-controls">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="setting-label" style={{ marginBottom: 0 }}>Font Sizes</label>
                  <button
                    className="reset-font-sizes-btn"
                    onClick={() => {
                      setArabicFontSize(2.5);
                      setTranslationFontSize(1.0);
                      setTransliterationFontSize(1.0);
                    }}
                  >
                    Reset
                  </button>
                </div>
                
                <div className="font-size-slider-group">
                  <label className="slider-label">
                    Arabic Text
                    <span className="slider-value">{arabicFontSize.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={arabicFontSize}
                    onChange={(e) => setArabicFontSize(parseFloat(e.target.value))}
                    className="font-size-slider"
                  />
                </div>

                <div className="font-size-slider-group">
                  <label className="slider-label">
                    Translation
                    <span className="slider-value">{translationFontSize.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="2.0"
                    step="0.1"
                    value={translationFontSize}
                    onChange={(e) => setTranslationFontSize(parseFloat(e.target.value))}
                    className="font-size-slider"
                  />
                </div>

                <div className="font-size-slider-group">
                  <label className="slider-label">
                    Transliteration
                    <span className="slider-value">{transliterationFontSize.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="2.0"
                    step="0.1"
                    value={transliterationFontSize}
                    onChange={(e) => setTransliterationFontSize(parseFloat(e.target.value))}
                    className="font-size-slider"
                  />
                </div>
              </div>

              <div className="font-size-preview">
                <label className="setting-label">Preview</label>
                <div className="preview-container">
                  <div 
                    className={`preview-arabic-text ${selectedFont}`}
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
                  {selectedFont === 'uthmani' ? verse.text_uthmani : verse.text_indopak}
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