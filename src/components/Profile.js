import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { Download, Upload, Trash2, User, Sun, Moon, Menu, X, Star, BookOpenCheck, Target, Flame, Trophy, Lock, AlertTriangle, Edit2, Check, HelpCircle } from 'lucide-react';

const Profile = ({ isGuest, userProgress, setUserProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem('userName');
    return saved || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const { theme, toggleTheme, isDark } = useTheme();
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

  useEffect(() => {
    const saved = localStorage.getItem('userName');
    if (saved) {
      setUserName(saved);
    }
  }, []);

  const handleEditName = () => {
    setEditedName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmedName = editedName.trim();
    if (trimmedName) {
      setUserName(trimmedName);
      localStorage.setItem('userName', trimmedName);
    } else {
      setUserName('');
      localStorage.removeItem('userName');
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Calculate overall statistics
  const calculateStats = () => {
    const totalSurahs = 114;
    const totalVerses = 6236;
    
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
      
      // Simplified juz mapping (in production, use exact juz boundaries)
      Object.entries(userProgress).forEach(([surahId, surah]) => {
        if (surah.verses) {
          const surahJuz = Math.ceil(parseInt(surahId) / 4);
          if (surahJuz === juz) {
            juzVerses += Object.keys(surah.verses).length;
            juzMemorized += Object.values(surah.verses).filter(verse => verse.memorized).length;
          }
        }
      });
      
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
    const dataStr = JSON.stringify(userProgress, null, 2);
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
          // Validate basic structure
          if (typeof importedData === 'object' && importedData !== null) {
            setUserProgress(importedData);
            localStorage.setItem('quranProgress', JSON.stringify(importedData));
            alert('Progress imported successfully!');
          } else {
            throw new Error('Invalid data structure');
          }
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearLocalData = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClear = () => {
    setUserProgress({});
    localStorage.removeItem('quranProgress');
    setShowConfirmDialog(false);
    setShowSuccessDialog(true);
  };

  const handleCancelClear = () => {
    setShowConfirmDialog(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
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
                <span className="chart-label">{stats.completedSurahs}/{stats.totalSurahs} surahs</span>
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
                    className={`toggle-btn ${quranFont === 'uthmani' ? 'active' : ''}`}
                    onClick={() => setQuranFont('uthmani')}
                  >
                    Uthmani
                  </button>
                  <button
                    className={`toggle-btn ${quranFont === 'indopak' ? 'active' : ''}`}
                    onClick={() => setQuranFont('indopak')}
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
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={arabicFontSize}
                  onChange={(e) => setArabicFontSize(parseFloat(e.target.value))}
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
                  min="0.7"
                  max="2.0"
                  step="0.1"
                  value={translationFontSize}
                  onChange={(e) => setTranslationFontSize(parseFloat(e.target.value))}
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
                  min="0.7"
                  max="2.0"
                  step="0.1"
                  value={transliterationFontSize}
                  onChange={(e) => setTransliterationFontSize(parseFloat(e.target.value))}
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
    </div>
  );
};

export default Profile;
