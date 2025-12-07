import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { Download, Upload, Trash2, User, Sun, Moon, Menu, X, Star, BookOpenCheck, Target, Flame, Trophy, Lock, AlertTriangle, Edit2, Check, HelpCircle, CheckCircle } from 'lucide-react';
import quranApi from '../services/quranApi';
import { 
  STORAGE_KEYS, 
  DEFAULT_VALUES, 
  CONSTRAINTS,
  VALID_VALUES,
  StorageHelpers, 
  Validators,
  ExportHelpers 
} from '../constants/storageConstants';

const Profile = ({ isGuest, userProgress, setUserProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showImportSuccessDialog, setShowImportSuccessDialog] = useState(false);
  const [importError, setImportError] = useState(null);
  const [userName, setUserName] = useState(() => {
    return StorageHelpers.getItem(STORAGE_KEYS.USER_NAME, DEFAULT_VALUES.USER_NAME);
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [surahsData, setSurahsData] = useState(null);
  const [juzMapping, setJuzMapping] = useState(null); // Map surah ID to juz number
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const {
    quranFont,
    setQuranFont,
    showTranslation,
    setShowTranslation,
    showTransliteration,
    setShowTransliteration,
    autoScroll,
    setAutoScroll,
    arabicFontSize,
    setArabicFontSize,
    translationFontSize,
    setTranslationFontSize,
    transliterationFontSize,
    setTransliterationFontSize,
    resetFontSizes,
  } = useSettings();

  useEffect(() => {
    setCurrentPath('/profile');
  }, [setCurrentPath]);

  // Fetch surahs data and juz mapping for accurate juz calculation
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch surahs for verse counts
        const surahsResponse = await quranApi.getSurahs();
        if (surahsResponse && surahsResponse.chapters) {
          setSurahsData(surahsResponse.chapters);
        }
        
        // Fetch juz data to create accurate surah-to-juz mapping
        // Note: In test mode, API may only return limited surah data (e.g., surahs 1-2)
        // In production with full API access, all surahs will be mapped correctly
        try {
          const juzsResponse = await quranApi.getJuzs();
          console.log('Juzs response:', juzsResponse);
          if (juzsResponse && juzsResponse.juzs) {
            const mapping = {};
            juzsResponse.juzs.forEach(juz => {
              const juzNumber = parseInt(juz.juz_number) || juz.juz_number;
              if (juz.verse_mapping && typeof juz.verse_mapping === 'object') {
                // verse_mapping is like { "1": "1-7", "2": "1-141" }
                // Each key is a surah ID, value is the verse range
                Object.keys(juz.verse_mapping).forEach(surahId => {
                  const surahIdNum = parseInt(surahId);
                  if (!isNaN(surahIdNum)) {
                    // If surah appears in multiple juz, use the first one found
                    // (some surahs span multiple juz)
                    if (!mapping[surahIdNum]) {
                      mapping[surahIdNum] = juzNumber;
                    }
                  }
                });
              }
            });
            console.log('Juz mapping created:', mapping);
            // Only use mapping if it has sufficient data (more than just test surahs)
            // In production, this will have all 114 surahs mapped
            if (Object.keys(mapping).length > 2) {
              setJuzMapping(mapping);
            } else {
              console.warn('Juz mapping incomplete (likely test mode), using fallback');
            }
          } else {
            console.warn('No juzs data in response:', juzsResponse);
          }
        } catch (juzErr) {
          console.error('Failed to fetch juz data:', juzErr);
          // Fall back to simplified mapping if API fails
        }
      } catch (err) {
        console.error('Failed to fetch surahs for juz calculation:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const saved = StorageHelpers.getItem(STORAGE_KEYS.USER_NAME, DEFAULT_VALUES.USER_NAME);
    if (saved) {
      setUserName(saved);
    }
  }, []);

  // Save userName to localStorage whenever it changes
  useEffect(() => {
    if (userName) {
      StorageHelpers.setItem(STORAGE_KEYS.USER_NAME, userName);
    } else {
      StorageHelpers.removeItem(STORAGE_KEYS.USER_NAME);
    }
  }, [userName]);

  const handleEditName = () => {
    setEditedName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmedName = editedName.trim();
    if (trimmedName) {
      setUserName(trimmedName);
    } else {
      setUserName(DEFAULT_VALUES.USER_NAME);
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Calculate overall statistics
  const calculateStats = () => {
    const totalSurahs = CONSTRAINTS.QURAN.TOTAL_SURAHS;
    const totalVerses = CONSTRAINTS.QURAN.TOTAL_VERSES;
    
    let completedSurahs = 0;
    let memorizedVerses = 0;
    
    Object.values(userProgress).forEach(surah => {
      if (surah.verses) {
        const surahVerses = Object.values(surah.verses);
        const memorizedCount = surahVerses.filter(verse => verse.memorized).length;
        memorizedVerses += memorizedCount;
        
        // Check if surah is completed (all verses memorized)
        // Need to check against actual surah verse count, not just tracked verses
        // For now, we'll use a simplified check
        if (surahVerses.length > 0 && surahVerses.every(verse => verse.memorized)) {
          completedSurahs++;
        }
      }
    });
    
    const overallPercentage = Math.round((memorizedVerses / totalVerses) * 100);
    
    // Calculate streak based on consecutive days with activity
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activityDates = new Set();
    Object.values(userProgress).forEach(surah => {
      if (surah.verses) {
        Object.values(surah.verses).forEach(verse => {
          if (verse.lastReviewed) {
            const reviewDate = new Date(verse.lastReviewed);
            reviewDate.setHours(0, 0, 0, 0);
            activityDates.add(reviewDate.toISOString().split('T')[0]);
          }
        });
      }
    });
    
    // Calculate consecutive days from today backwards
    let checkDate = new Date(today);
    while (activityDates.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return {
      completedSurahs,
      totalSurahs,
      memorizedVerses,
      totalVerses,
      overallPercentage,
      streak
    };
  };

  const stats = calculateStats();

  // Generate Juz progress heatmap
  const generateJuzHeatmap = () => {
    const heatmap = [];
    for (let juz = 1; juz <= 30; juz++) {
      let juzVerses = 0;
      let juzMemorized = 0;
      
      // Use juz mapping from API if available (most accurate)
      if (juzMapping && Object.keys(juzMapping).length > 0 && surahsData) {
        surahsData.forEach(surah => {
          const surahJuz = juzMapping[surah.id];
          // Compare as numbers to handle string/number mismatch
          if (surahJuz !== undefined && parseInt(surahJuz) === juz) {
            const surahProgress = userProgress[surah.id];
            const totalVerses = surah.verses_count || 0;
            juzVerses += totalVerses;
            
            if (surahProgress && surahProgress.verses) {
              juzMemorized += Object.values(surahProgress.verses).filter(verse => verse.memorized).length;
            }
          }
        });
      } else if (surahsData) {
        // Fallback: use simplified mapping if juz data not available or incomplete
        // This is approximate - each juz has roughly 4 surahs
        // Note: In test mode with limited API access, juz mapping may be incomplete
        // In production with full API access, the juz mapping from API will be used
        surahsData.forEach(surah => {
          const surahJuz = Math.ceil(parseInt(surah.id) / 4);
          if (surahJuz === juz) {
            const surahProgress = userProgress[surah.id];
            const totalVerses = surah.verses_count || 0;
            juzVerses += totalVerses;
            
            if (surahProgress && surahProgress.verses) {
              juzMemorized += Object.values(surahProgress.verses).filter(verse => verse.memorized).length;
            }
          }
        });
      } else {
        // Final fallback: use tracked verses only (least accurate)
        Object.entries(userProgress).forEach(([surahId, surah]) => {
          if (surah.verses) {
            const surahIdNum = parseInt(surahId);
            const surahJuz = juzMapping && juzMapping[surahIdNum] ? juzMapping[surahIdNum] : Math.ceil(surahIdNum / 4);
            if (surahJuz === juz) {
              juzVerses += Object.keys(surah.verses).length;
              juzMemorized += Object.values(surah.verses).filter(verse => verse.memorized).length;
            }
          }
        });
      }
      
      const progress = juzVerses > 0 ? Math.round((juzMemorized / juzVerses) * 100) : 0;
      heatmap.push({ juz, progress });
    }
    return heatmap;
  };

  const juzHeatmap = generateJuzHeatmap();

  // Generate achievements based on actual progress
  const generateAchievements = () => {
    const achievements = [
      { 
        id: 1, 
        name: "First Steps", 
        description: "Memorized your first verse", 
        unlocked: stats.memorizedVerses >= 1, 
        icon: <Star size={24} />,
        color: "var(--rose)"
      },
      { 
        id: 2, 
        name: "Surah Master", 
        description: "Completed your first surah", 
        unlocked: stats.completedSurahs >= 1, 
        icon: <BookOpenCheck size={24} />,
        color: "var(--lavender)"
      },
      { 
        id: 3, 
        name: "Century Club", 
        description: "Memorized 100 verses", 
        unlocked: stats.memorizedVerses >= 100, 
        icon: <Target size={24} />,
        color: "var(--rose)"
      },
      { 
        id: 4, 
        name: "Consistency", 
        description: "7-day streak", 
        unlocked: stats.streak >= 7, 
        icon: <Flame size={24} />,
        color: "var(--lavender)"
      },
      { 
        id: 5, 
        name: "Halfway There", 
        description: "50% completion", 
        unlocked: stats.overallPercentage >= 50, 
        icon: <Trophy size={24} />,
        color: "var(--rose)"
      },
      { 
        id: 6, 
        name: "Hafiz", 
        description: "100% completion", 
        unlocked: stats.overallPercentage === 100, 
        icon: <Trophy size={24} />,
        color: "var(--lavender)"
      }
    ];
    return achievements;
  };

  const achievements = generateAchievements();

  // Data management functions
  const exportProgress = () => {
    // Create export data with all user data
    const exportData = ExportHelpers.createExportData(
      userProgress,
      userName,
      theme,
      {
        quranFont,
        showTranslation,
        showTransliteration,
        autoScroll,
        arabicFontSize,
        translationFontSize,
        transliterationFontSize,
      }
    );
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quran-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate import data
          const validation = ExportHelpers.validateImportData(importedData);
          if (!validation.valid) {
            setImportError(validation.error || 'Invalid file format');
            setShowImportSuccessDialog(false);
            return;
          }
          
          // Clear any previous errors
          setImportError(null);
          
          // Import progress data (includes all verse data with lastReviewed timestamps)
          // This is the most important data - contains all memorization progress
          if (importedData.progress && Validators.isValidUserProgress(importedData.progress)) {
            setUserProgress(importedData.progress);
            StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, importedData.progress);
          } else {
            // If progress is missing or invalid, that's a critical error
            setImportError('Invalid or missing progress data');
            setShowImportSuccessDialog(false);
            return;
          }
          
          // Import user name if present (optional)
          if (importedData.userName !== undefined) {
            if (typeof importedData.userName === 'string') {
              setUserName(importedData.userName);
              // StorageHelpers.setItem is called automatically in useEffect when userName changes
            } else if (importedData.userName !== null) {
              // Invalid type, but not critical - just skip it
              console.warn('Invalid userName type in import, skipping');
            }
          }
          
          // Import theme if present (optional, but validate if provided)
          if (importedData.theme !== undefined) {
            if (Validators.isValidTheme(importedData.theme)) {
              setTheme(importedData.theme);
              // ThemeContext automatically saves to localStorage via useEffect
            } else {
              console.warn('Invalid theme in import, using default');
            }
          }
          
          // Import all settings if present (optional, but validate if provided)
          if (importedData.quranFont !== undefined) {
            if (Validators.isValidFontType(importedData.quranFont)) {
              setQuranFont(importedData.quranFont);
            } else {
              console.warn('Invalid quranFont in import, using default');
            }
          }
          
          if (importedData.showTranslation !== undefined) {
            if (typeof importedData.showTranslation === 'boolean') {
              setShowTranslation(importedData.showTranslation);
            } else {
              console.warn('Invalid showTranslation type in import, skipping');
            }
          }
          
          if (importedData.showTransliteration !== undefined) {
            if (typeof importedData.showTransliteration === 'boolean') {
              setShowTransliteration(importedData.showTransliteration);
            } else {
              console.warn('Invalid showTransliteration type in import, skipping');
            }
          }
          
          if (importedData.autoScroll !== undefined) {
            if (typeof importedData.autoScroll === 'boolean') {
              setAutoScroll(importedData.autoScroll);
            } else {
              console.warn('Invalid autoScroll type in import, skipping');
            }
          }
          
          if (importedData.arabicFontSize !== undefined) {
            if (typeof importedData.arabicFontSize === 'number') {
              const validatedSize = Validators.validateFontSize(importedData.arabicFontSize, 'arabic');
              setArabicFontSize(validatedSize);
            } else {
              console.warn('Invalid arabicFontSize type in import, skipping');
            }
          }
          
          if (importedData.translationFontSize !== undefined) {
            if (typeof importedData.translationFontSize === 'number') {
              const validatedSize = Validators.validateFontSize(importedData.translationFontSize, 'translation');
              setTranslationFontSize(validatedSize);
            } else {
              console.warn('Invalid translationFontSize type in import, skipping');
            }
          }
          
          if (importedData.transliterationFontSize !== undefined) {
            if (typeof importedData.transliterationFontSize === 'number') {
              const validatedSize = Validators.validateFontSize(importedData.transliterationFontSize, 'transliteration');
              setTransliterationFontSize(validatedSize);
            } else {
              console.warn('Invalid transliterationFontSize type in import, skipping');
            }
          }
          
          // All data imported successfully
          setShowImportSuccessDialog(true);
          setImportError(null);
        } catch (error) {
          // Handle JSON parse errors or other unexpected errors
          setImportError(error.message || 'Failed to parse import file. Please ensure it is a valid JSON file.');
          setShowImportSuccessDialog(false);
        }
      };
      
      reader.onerror = () => {
        setImportError('Failed to read file. Please try again.');
        setShowImportSuccessDialog(false);
      };
      
      reader.readAsText(file);
    }
    // Reset file input so same file can be imported again
    event.target.value = '';
  };

  const clearLocalData = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClear = () => {
    setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
    StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
    setShowConfirmDialog(false);
    setShowSuccessDialog(true);
  };

  const handleCancelClear = () => {
    setShowConfirmDialog(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
  };

  const handleCloseImportSuccess = () => {
    setShowImportSuccessDialog(false);
    setImportError(null);
  };


  return (
    <div className={`profile-page ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">Profile & Settings</h1>
        </div>
      </header>

      {/* Guest Warning Bar */}
      {isGuest && (
        <div className="guest-warning">
          <span>Guest Mode: Progress saved locally only</span>
        </div>
      )}

      <div className="profile-content">
        {/* Profile Section */}
        <section className="profile-section">
          <div className="user-card">
            <div className="user-avatar">
              <User size={32} />
            </div>
            <div className="user-info">
              {isEditingName ? (
                <div className="user-name-edit-container">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      } else if (e.key === 'Escape') {
                        handleCancelEditName();
                      }
                    }}
                    autoFocus
                    className="user-name-input"
                    placeholder={isGuest ? 'Guest User' : 'User Name'}
                  />
                  <button
                    onClick={handleSaveName}
                    className="user-name-action-btn user-name-save-btn"
                    title="Save name"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    className="user-name-action-btn user-name-cancel-btn"
                    title="Cancel editing"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="user-name-container">
                  <h2>{userName || (isGuest ? 'Guest User' : 'User Name')}</h2>
                  <button
                    onClick={handleEditName}
                    className="user-name-edit-btn"
                    title="Edit name"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>
              )}
              <p>{isGuest ? 'Local progress tracking' : 'Premium Member'}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.memorizedVerses}</div>
              <div className="stat-label">Total Verses</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.overallPercentage}%</div>
              <div className="stat-label">Completion</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.streak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completedSurahs}</div>
              <div className="stat-label">Surahs Completed</div>
            </div>
          </div>

          <div className="visualization-section">
            <div className="juz-heatmap-card">
              <h3>Juz Progress</h3>
              <div className="heatmap-grid">
                {juzHeatmap.map(({ juz, progress }) => (
                  <div
                    key={juz}
                    className="heatmap-square"
                    style={{
                      backgroundColor: progress > 0 
                        ? `rgba(226, 182, 179, ${Math.max(0.3, progress / 100)})` 
                        : 'var(--cream)',
                      border: progress > 0 ? '1px solid var(--rose)' : '1px solid var(--border)',
                      color: progress > 50 ? 'white' : 'var(--text)'
                    }}
                    title={`Juz ${juz}: ${progress}%`}
                  >
                    {juz}
                  </div>
                ))}
              </div>
            </div>

            <div className="surah-chart-card">
              <h3>Surah Completion</h3>
              <div className="chart-container">
                <div className="chart-bar">
                  <div 
                    className="chart-fill progress-fill"
                    style={{ width: `${(stats.completedSurahs / stats.totalSurahs) * 100}%` }}
                  ></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span className="chart-label">{stats.completedSurahs}/{stats.totalSurahs} surahs</span>
                  <span className="chart-percentage" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rose)' }}>
                    {Math.round((stats.completedSurahs / stats.totalSurahs) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Panel */}
        <section className="settings-panel">
          <h3>Settings</h3>
          
          <div className="setting-group">
            <h4>Theme & Appearance</h4>
            <div className="setting-item">
              <div className="theme-header-row">
                <div className="label-with-help">
                  <label>Theme</label>
                  <div className="help-tooltip">
                    <HelpCircle size={16} />
                    <span className="tooltip-text">Switch between light and dark mode</span>
                  </div>
                </div>
                <button className="theme-toggle-btn" onClick={toggleTheme}>
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="setting-group">
            <h4>Quran Preferences</h4>
            <div className="theme-appearance-row">
              <div className="setting-item">
                <div className="label-with-help">
                  <label>Default Font</label>
                  <div className="help-tooltip">
                    <HelpCircle size={16} />
                    <span className="tooltip-text">Choose Quran font style</span>
                  </div>
                </div>
                <div className="toggle-buttons">
                  <button
                    className={`toggle-btn ${quranFont === VALID_VALUES.FONT_TYPES.UTHMANI ? 'active' : ''}`}
                    onClick={() => setQuranFont(VALID_VALUES.FONT_TYPES.UTHMANI)}
                  >
                    Uthmani
                  </button>
                  <button
                    className={`toggle-btn ${quranFont === VALID_VALUES.FONT_TYPES.INDOPAK ? 'active' : ''}`}
                    onClick={() => setQuranFont(VALID_VALUES.FONT_TYPES.INDOPAK)}
                  >
                    IndoPak
                  </button>
                </div>
              </div>
              
              <div className="setting-item">
                <div className="label-with-help">
                  <label>Display Options</label>
                  <div className="help-tooltip">
                    <HelpCircle size={16} />
                    <span className="tooltip-text">Show or hide translation and transliteration</span>
                  </div>
                </div>
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

              <div className="setting-item">
                <div className="label-with-help">
                  <label>Auto-scroll</label>
                  <div className="help-tooltip">
                    <HelpCircle size={16} />
                    <span className="tooltip-text">Auto-scroll to next verse after marking a verse as memorized</span>
                  </div>
                </div>
                <div className="toggle-buttons">
                  <button
                    className={`toggle-btn ${autoScroll ? 'active' : ''}`}
                    onClick={() => setAutoScroll(!autoScroll)}
                  >
                    {autoScroll ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
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
        </section>

        {/* Data Management */}
        <section className="data-management">
          <h3>Data Management</h3>
          
          <div className="data-actions">
            <div className="data-action-card">
              <div className="data-action-header">
                <h4>Export Progress</h4>
              </div>
              <p>Download your progress data as JSON</p>
              <button className="btn btn-secondary" onClick={exportProgress}>
                <Download size={16} />
                Download Backup
              </button>
            </div>
            
            <div className="data-action-card">
              <div className="data-action-header">
                <h4>Import Progress</h4>
              </div>
              <p>Restore progress from a backup file</p>
              <label className="file-upload-btn">
                <Upload size={16} />
                Choose File
                <input
                  type="file"
                  accept=".json"
                  onChange={importProgress}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="danger-zone">
            <div className="danger-zone-header">
              <h4>Danger Zone</h4>
            </div>
            <p style={{ marginBottom: '1rem', color: 'var(--text)', opacity: 0.8, fontSize: '0.9rem' }}>
              Before clearing your data, make sure to export your progress as a backup.
            </p>
            <div className="danger-actions">
              {isGuest ? (
                <button className="btn btn-danger" onClick={clearLocalData}>
                  <Trash2 size={16} />
                  Clear Local Data
                </button>
              ) : (
                <button className="btn btn-danger" onClick={() => alert('Account deletion would be implemented in production.')}>
                  <Trash2 size={16} />
                  Delete Account
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="achievements-section">
          <h3>Achievements</h3>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <div key={achievement.id} className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                <div className="badge-icon" style={{ color: achievement.color }}>
                  {achievement.icon}
                </div>
                <div className="badge-content">
                  <div className="badge-name">{achievement.name}</div>
                  <div className="badge-description">{achievement.description}</div>
                </div>
                {!achievement.unlocked && <div className="badge-lock"><Lock size={16} /></div>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="profile-footer">
        <div className="footer-content">
          <div className="mandatory-disclaimer">
            <p><strong>Tahfidh is a progress tracker only. Always verify memorization with a physical Quran.</strong></p>
          </div>
          <div className="app-version">
            <p>App Version 1.0.0</p>
          </div>
        </div>
      </footer>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <>
          <div className="settings-popup-overlay" onClick={handleCancelClear}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} color="var(--error-red)" />
                <h3>Clear Local Data</h3>
              </div>
              <button 
                className="settings-close-btn"
                onClick={handleCancelClear}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                Are you sure you want to clear all local progress data? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancelClear}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleConfirmClear}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <>
          <div className="settings-popup-overlay" onClick={handleCloseSuccess}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <h3>Success</h3>
              <button 
                className="settings-close-btn"
                onClick={handleCloseSuccess}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                All progress data has been cleared.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCloseSuccess}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Success Dialog */}
      {showImportSuccessDialog && (
        <>
          <div className="settings-popup-overlay" onClick={handleCloseImportSuccess}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={24} color="var(--rose)" />
                <h3>Import Successful</h3>
              </div>
              <button 
                className="settings-close-btn"
                onClick={handleCloseImportSuccess}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                All data has been imported successfully! Your progress, settings, and preferences have been restored.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCloseImportSuccess}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Error Dialog */}
      {importError && (
        <>
          <div className="settings-popup-overlay" onClick={() => setImportError(null)}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} color="var(--error-red)" />
                <h3>Import Failed</h3>
              </div>
              <button 
                className="settings-close-btn"
                onClick={() => setImportError(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                {`Invalid file format: ${importError}`}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setImportError(null)}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
