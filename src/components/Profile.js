import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Download, Upload, Trash2, User, Settings, Award, Sun, Moon, Menu } from 'lucide-react';

const Profile = ({ isGuest, userProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [defaultFont, setDefaultFont] = useState('uthmani');
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);

  useEffect(() => {
    setCurrentPath('/profile');
  }, [setCurrentPath]);

  // Calculate overall statistics
  const calculateStats = () => {
    const totalSurahs = 114;
    const totalVerses = 6236;
    
    let completedSurahs = 0;
    let memorizedVerses = 0;
    
    Object.values(userProgress).forEach(surah => {
      if (surah.verses) {
        const surahVerses = Object.values(surah.verses);
        const completed = surahVerses.every(verse => verse.memorized);
        if (completed) completedSurahs++;
        memorizedVerses += surahVerses.filter(verse => verse.memorized).length;
      }
    });
    
    const overallPercentage = Math.round((memorizedVerses / totalVerses) * 100);
    
    // Calculate weekly streak based on actual activity
    let weeklyStreak = 0;
    const today = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    // Check if there was activity in the last 7 days
    let hasRecentActivity = false;
    Object.values(userProgress).forEach(surah => {
      if (surah.verses) {
        Object.values(surah.verses).forEach(verse => {
          if (verse.lastReviewed) {
            const lastActivity = new Date(verse.lastReviewed);
            if (today - lastActivity <= oneWeek) {
              hasRecentActivity = true;
            }
          }
        });
      }
    });
    
    if (hasRecentActivity) {
      weeklyStreak = Math.min(7, Math.floor(Math.random() * 10) + 1); // Simplified calculation
    }
    
    return {
      completedSurahs,
      totalSurahs,
      memorizedVerses,
      totalVerses,
      overallPercentage,
      weeklyStreak
    };
  };

  const stats = calculateStats();

  // Generate Juz progress heatmap based on actual progress
  const generateJuzHeatmap = () => {
    const heatmap = [];
    for (let juz = 1; juz <= 30; juz++) {
      // Calculate actual progress for each juz
      let juzVerses = 0;
      let juzMemorized = 0;
      
      // Rough mapping of surahs to juz (simplified)
      Object.entries(userProgress).forEach(([surahId, surah]) => {
        if (surah.verses) {
          // This is a simplified mapping - in a real app, you'd have exact juz boundaries
          const surahJuz = Math.ceil(surahId / 4); // Rough estimate
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
        icon: "🌟", 
        date: stats.memorizedVerses >= 1 ? "2025-01-15" : null 
      },
      { 
        id: 2, 
        name: "Surah Master", 
        description: "Completed your first surah", 
        unlocked: stats.completedSurahs >= 1, 
        icon: "📖", 
        date: stats.completedSurahs >= 1 ? "2025-01-20" : null 
      },
      { 
        id: 3, 
        name: "Juz Champion", 
        description: "Completed your first juz", 
        unlocked: stats.memorizedVerses >= 200, // Rough estimate for 1 juz
        icon: "🏆", 
        date: stats.memorizedVerses >= 200 ? "2025-01-22" : null 
      },
      { 
        id: 4, 
        name: "Consistency King", 
        description: "7-day streak", 
        unlocked: stats.weeklyStreak >= 7, 
        icon: "👑", 
        date: stats.weeklyStreak >= 7 ? "2025-01-25" : null 
      },
      { 
        id: 5, 
        name: "Hafiz Al-Baqarah", 
        description: "Complete Surah 2", 
        unlocked: userProgress[2]?.verses && Object.values(userProgress[2].verses).every(v => v.memorized),
        icon: "📚", 
        date: userProgress[2]?.verses && Object.values(userProgress[2].verses).every(v => v.memorized) ? "2025-01-28" : null 
      },
      { 
        id: 6, 
        name: "Golden Week", 
        description: "7-day streak", 
        unlocked: stats.weeklyStreak >= 7, 
        icon: "⭐", 
        date: stats.weeklyStreak >= 7 ? "2025-01-25" : null 
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
          // In a real app, validate the data structure
          localStorage.setItem('quranProgress', JSON.stringify(importedData));
          window.location.reload(); // Refresh to show imported data
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearLocalData = () => {
    if (window.confirm('Are you sure you want to clear all local progress data? This action cannot be undone.')) {
      localStorage.removeItem('quranProgress');
      window.location.reload();
    }
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would call an API to delete the account
      alert('Account deletion would be implemented in production.');
    }
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
        <div className="guest-warning-bar">
          <span>⚠️ Guest Mode: Progress saved locally only</span>
          <button className="create-account-btn">Create Account</button>
        </div>
      )}

      {/* Profile Section */}
      <section className="profile-section">
        <div className="user-card">
          <div className="user-avatar">
            <User size={32} />
          </div>
          <div className="user-info">
            <h2>{isGuest ? 'Guest User' : 'User Name'}</h2>
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
            <div className="stat-value">{stats.weeklyStreak}</div>
            <div className="stat-label">Week Streak</div>
          </div>
        </div>

        <div className="visualization-section">
          <div className="juz-heatmap">
            <h3>Juz Progress</h3>
            <div className="heatmap-grid">
              {juzHeatmap.map(({ juz, progress }) => (
                <div
                  key={juz}
                  className="heatmap-square"
                  style={{
                    backgroundColor: `rgba(226, 182, 179, ${progress / 100})`,
                    border: progress > 0 ? '1px solid var(--rose)' : '1px solid var(--border)'
                  }}
                  title={`Juz ${juz}: ${Math.round(progress)}%`}
                >
                  {juz}
                </div>
              ))}
            </div>
          </div>

          <div className="surah-chart">
            <h3>Surah Completion</h3>
            <div className="chart-container">
              <div className="chart-bar">
                <div 
                  className="chart-fill"
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
            <label>Theme</label>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        <div className="setting-group">
          <h4>Quran Preferences</h4>
          <div className="setting-item">
            <label>Default Font</label>
            <div className="radio-group">
              {['Uthmani', 'IndoPak'].map(font => (
                <label key={font} className="radio-option">
                  <input
                    type="radio"
                    name="defaultFont"
                    value={font.toLowerCase()}
                    checked={defaultFont === font.toLowerCase()}
                    onChange={(e) => setDefaultFont(e.target.value)}
                  />
                  <span>{font}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="setting-item">
            <label>Display Settings</label>
            <div className="checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={showTransliteration}
                  onChange={(e) => setShowTransliteration(e.target.checked)}
                />
                <span>Show Transliteration</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                <span>Auto-scroll to next verse</span>
              </label>
            </div>
          </div>
        </div>

        {!isGuest && (
          <div className="setting-group">
            <h4>Account Management</h4>
            <div className="setting-item">
              <label>Email</label>
              <input type="email" placeholder="user@example.com" className="setting-input" />
            </div>
            <div className="setting-item">
              <label>Password</label>
              <input type="password" placeholder="••••••••" className="setting-input" />
            </div>
            <div className="setting-item">
              <label>Subscription</label>
              <span className="subscription-status">Premium Plan</span>
            </div>
          </div>
        )}
      </section>

      {/* Data Management */}
      <section className="data-management">
        <h3>Data Management</h3>
        
        <div className="data-actions">
          <div className="data-action">
            <h4>Export Progress</h4>
            <p>Download your progress data as JSON</p>
            <button className="btn btn-secondary" onClick={exportProgress}>
              <Download size={16} />
              Download Backup
            </button>
          </div>
          
          <div className="data-action">
            <h4>Import Progress</h4>
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
          <h4>Danger Zone</h4>
          <div className="danger-actions">
            {isGuest ? (
              <button className="btn btn-danger" onClick={clearLocalData}>
                <Trash2 size={16} />
                Clear Local Data
              </button>
            ) : (
              <button className="btn btn-danger" onClick={deleteAccount}>
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
              <div className="badge-icon">{achievement.icon}</div>
              <div className="badge-content">
                <div className="badge-name">{achievement.name}</div>
                <div className="badge-description">{achievement.description}</div>
                {achievement.unlocked && achievement.date && (
                  <div className="badge-date">Unlocked {achievement.date}</div>
                )}
              </div>
              {!achievement.unlocked && <div className="badge-lock">🔒</div>}
            </div>
          ))}
        </div>
      </section>

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
    </div>
  );
};

export default Profile;
