import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { CONSTRAINTS, STORAGE_KEYS, StorageHelpers, ExportHelpers } from '../constants/storageConstants';
import quranApi from '../services/quranApi';
import { 
  Menu, 
  Sun, 
  Moon, 
  BookOpen, 
  PlusCircle, 
  Flame, 
  Calendar, 
  Clock, 
  ChevronRight,
  Star,
  Trophy,
  Crown,
  BookOpenCheck,
  Target,
  Lock,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Download,
  X,
  AlertTriangle
} from 'lucide-react';

const Dashboard = ({ isGuest, userProgress, setUserProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    quranFont,
    showTranslation,
    showTransliteration,
    autoScroll,
    arabicFontSize,
    translationFontSize,
    transliterationFontSize,
  } = useSettings();
  const [activityView, setActivityView] = useState('weekly'); // weekly, monthly, yearly
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    // Initialize to start of current week (Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });
  const [surahNamesCache, setSurahNamesCache] = useState({});
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Export guest progress function - GUEST ONLY
  const exportGuestProgress = () => {
    // Use GUEST_USER_NAME for guest users only
    const userName = StorageHelpers.getItem(STORAGE_KEYS.GUEST_USER_NAME, 'Guest User');
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
    setShowExportDialog(false);
    navigate('/signup');
  };

  const handleCreateAccountClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if user has any progress to export
    const hasProgress = userProgress && typeof userProgress === 'object' && Object.keys(userProgress).length > 0;
    console.log('Create Account clicked - hasProgress:', hasProgress, 'userProgress:', userProgress);
    if (hasProgress) {
      console.log('Showing export dialog');
      setShowExportDialog(true);
    } else {
      console.log('No progress, navigating to signup');
      // No progress, go directly to signup
      navigate('/signup');
    }
  };

  useEffect(() => {
    setCurrentPath('/dashboard');
  }, [setCurrentPath]);

  // Fetch surah names for surahs that are missing names in userProgress
  useEffect(() => {
    const fetchMissingSurahNames = async () => {
      const missingNames = [];
      Object.entries(userProgress).forEach(([surahId, surah]) => {
        if (!surah.name && !surahNamesCache[surahId]) {
          missingNames.push(surahId);
        }
      });

      if (missingNames.length > 0) {
        try {
          const surahsData = await quranApi.getSurahs();
          const newCache = { ...surahNamesCache };
          missingNames.forEach(surahId => {
            const surah = surahsData.chapters?.find(s => s.id.toString() === surahId.toString());
            if (surah) {
              newCache[surahId] = surah.name_simple;
            }
          });
          if (Object.keys(newCache).length > Object.keys(surahNamesCache).length) {
            setSurahNamesCache(newCache);
          }
        } catch (error) {
          console.error('Failed to fetch surah names:', error);
        }
      }
    };

    fetchMissingSurahNames();
  }, [userProgress, surahNamesCache]);

  // Calculate progress statistics
  const calculateProgress = () => {
    const totalSurahs = CONSTRAINTS.QURAN.TOTAL_SURAHS;
    const totalVerses = CONSTRAINTS.QURAN.TOTAL_VERSES;
    
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
    
    const surahPercentage = Math.round((completedSurahs / totalSurahs) * 100);
    const versePercentage = Math.round((memorizedVerses / totalVerses) * 100);
    
    return {
      completedSurahs,
      totalSurahs,
      memorizedVerses,
      totalVerses,
      surahPercentage,
      versePercentage
    };
  };

  const progress = useMemo(() => calculateProgress(), [userProgress]);

  // Calculate real data from userProgress - recalculate when userProgress changes
  const realData = useMemo(() => {
  const calculateRealData = () => {
    let currentStreak = 0;
    let weeklyAverage = 0;
    let lastActivity = "No activity yet";
    let currentSurah = null;
    let currentVerse = 0;

    // Calculate current streak and last activity
    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Find the most recent activity (only from memorized verses)
    let latestActivity = null;
    Object.values(userProgress).forEach(surah => {
      if (surah.verses) {
        Object.values(surah.verses).forEach(verse => {
          // Only consider memorized verses for last activity
          if (verse.memorized && verse.lastReviewed && (!latestActivity || new Date(verse.lastReviewed) > new Date(latestActivity))) {
            latestActivity = verse.lastReviewed;
          }
        });
      }
    });

    if (latestActivity) {
      const lastActivityDate = new Date(latestActivity);
      const todayStartForActivity = new Date(today);
      todayStartForActivity.setHours(0, 0, 0, 0);
      const lastActivityStart = new Date(lastActivityDate);
      lastActivityStart.setHours(0, 0, 0, 0);
      const daysSince = Math.round(Math.abs((todayStartForActivity - lastActivityStart) / oneDay));
      
      if (daysSince === 0) {
        // Show time if it's today
        const timeStr = lastActivityDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastActivity = `Today at ${timeStr}`;
      } else if (daysSince === 1) {
        lastActivity = "Yesterday";
      } else {
        lastActivity = `${lastActivityDate.toLocaleDateString()} ${lastActivityDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      // Calculate current streak based on consecutive days with activity (only memorized verses)
      const activityDates = new Set();
      Object.values(userProgress).forEach(surah => {
        if (surah.verses) {
          Object.values(surah.verses).forEach(verse => {
            // Only count memorized verses for streak
            if (verse.memorized && verse.lastReviewed) {
              const reviewDate = new Date(verse.lastReviewed);
              reviewDate.setHours(0, 0, 0, 0);
              activityDates.add(reviewDate.toISOString().split('T')[0]);
            }
          });
        }
      });
      
      // Calculate consecutive days from today backwards
      const todayStartForStreak = new Date(today);
      todayStartForStreak.setHours(0, 0, 0, 0);
      let checkDate = new Date(todayStartForStreak);
      while (activityDates.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate weekly average based on actual progress
    if (progress.memorizedVerses > 0) {
      weeklyAverage = Math.round(progress.memorizedVerses / 4);
    }

    // Find current surah (most recently worked on - only from memorized verses)
    let mostRecentSurah = null;
    let mostRecentVerse = 0;
    let mostRecentTimestamp = null;
    Object.entries(userProgress).forEach(([surahId, surah]) => {
      if (surah.verses) {
        Object.entries(surah.verses).forEach(([verseId, verse]) => {
          // Only consider memorized verses for current surah
          if (verse.memorized && verse.lastReviewed) {
            const verseTimestamp = new Date(verse.lastReviewed).getTime();
            if (!mostRecentTimestamp || verseTimestamp > mostRecentTimestamp) {
              mostRecentTimestamp = verseTimestamp;
              // Use surah name from userProgress, or fallback to cache, or "Surah {id}"
              const surahName = surah.name || surahNamesCache[surahId] || `Surah ${surahId}`;
              mostRecentSurah = { id: surahId, name: surahName, lastReviewed: verse.lastReviewed };
            mostRecentVerse = parseInt(verseId);
            }
          }
        });
      }
    });

    if (mostRecentSurah) {
      currentSurah = mostRecentSurah;
      currentVerse = mostRecentVerse;
    }

    return {
      currentStreak,
      weeklyAverage,
      lastActivity,
      currentSurah,
      currentVerse
    };
  };
    return calculateRealData();
  }, [userProgress, progress, surahNamesCache]);

  // Generate weekly activity data for selected week
  const generateWeeklyActivity = useCallback(() => {
    const startOfWeek = new Date(selectedWeekStart);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + day);
      
      let intensity = 0;
      // Check if there was actual activity on this day (only from memorized verses)
        const dateKey = currentDate.toLocaleDateString('en-CA'); // Use YYYY-MM-DD format
        if (progress.memorizedVerses > 0) {
          // Look for actual activity in userProgress
          Object.values(userProgress).forEach(surah => {
            if (surah.verses) {
              Object.values(surah.verses).forEach(verse => {
              // Only count memorized verses for activity
              if (verse.memorized && verse.lastReviewed) {
                  const verseDate = new Date(verse.lastReviewed);
                  const verseDateKey = verseDate.toLocaleDateString('en-CA'); // Use YYYY-MM-DD format
                  if (verseDateKey === dateKey) {
                    intensity = Math.min(3, intensity + 1);
                  }
                }
              });
            }
          });
        }
      
      weekData.push({
        date: currentDate,
        intensity,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return weekData;
  }, [userProgress, progress, selectedWeekStart]);

  // Generate monthly activity data for selected month
  const generateMonthlyActivity = useCallback(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const calendar = [];
    let currentWeek = [];
    
    // Add empty days for the first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push({ date: null, intensity: 0, dayNumber: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
      
      let intensity = 0;
      if (progress.memorizedVerses > 0) {
        // Check for actual activity on this day (only from memorized verses)
        const currentDate = new Date(year, month, day);
        const dateKey = currentDate.toLocaleDateString('en-CA'); // Use YYYY-MM-DD format
        
        Object.values(userProgress).forEach(surah => {
          if (surah.verses) {
            Object.values(surah.verses).forEach(verse => {
              // Only count memorized verses for activity
              if (verse.memorized && verse.lastReviewed) {
                const verseDate = new Date(verse.lastReviewed);
                const verseDateKey = verseDate.toLocaleDateString('en-CA'); // Use YYYY-MM-DD format
                if (verseDateKey === dateKey) {
                  intensity = Math.min(3, intensity + 1);
                }
              }
            });
          }
        });
      }
      
      currentWeek.push({
        date: new Date(year, month, day),
        intensity,
        dayNumber: day
      });
    }
    
    // Fill the last week if needed
    while (currentWeek.length < 7) {
      currentWeek.push({ date: null, intensity: 0, dayNumber: null });
    }
    
    if (currentWeek.length > 0) {
      calendar.push(currentWeek);
    }
    
    return calendar;
  }, [userProgress, progress, selectedYear, selectedMonth]);

  // Generate yearly activity data for selected year
  const generateYearlyActivity = useCallback(() => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      let intensity = 0;
      if (progress.memorizedVerses > 0) {
        // Check for actual activity in this month (only from memorized verses)
        const monthStart = new Date(selectedYear, month, 1);
        const monthEnd = new Date(selectedYear, month + 1, 0);
        
        Object.values(userProgress).forEach(surah => {
          if (surah.verses) {
            Object.values(surah.verses).forEach(verse => {
              // Only count memorized verses for activity
              if (verse.memorized && verse.lastReviewed) {
                const verseDate = new Date(verse.lastReviewed);
                if (verseDate >= monthStart && verseDate <= monthEnd) {
                  intensity = Math.min(3, intensity + 1);
                }
              }
            });
          }
        });
      }
      months.push({ month, intensity });
    }
    return months;
  }, [userProgress, progress, selectedYear]);

  // Generate activity data based on actual progress and selected view
  const activityData = useMemo(() => {
    if (activityView === 'weekly') {
      return generateWeeklyActivity();
    } else if (activityView === 'monthly') {
      return generateMonthlyActivity();
    } else { // yearly
      return generateYearlyActivity();
    }
  }, [activityView, generateWeeklyActivity, generateMonthlyActivity, generateYearlyActivity]);

  // Generate achievements based on actual progress
  const generateAchievements = () => {
    const achievements = [
      { 
        id: 1, 
        name: "First Steps", 
        description: "Complete memorizing your first verse", 
        unlocked: progress.memorizedVerses >= 1, 
        icon: <Star size={24} />,
        color: "var(--rose)"
      },
      { 
        id: 2, 
        name: "Surah Master", 
        description: "Complete your first surah from beginning to end", 
        unlocked: progress.completedSurahs >= 1, 
        icon: <BookOpenCheck size={24} />,
        color: "var(--lavender)"
      },
      { 
        id: 3, 
        name: "Juz Champion", 
        description: "Reach the milestone of memorizing one complete juz", 
        unlocked: progress.memorizedVerses >= 200,
        icon: <Trophy size={24} />,
        color: "var(--rose)"
      },
      { 
        id: 4, 
        name: "Consistency Champion", 
        description: "Maintain a 7 day memorization streak", 
        unlocked: realData.currentStreak >= 7, 
        icon: <Crown size={24} />,
        color: "var(--lavender)"
      },
      { 
        id: 5, 
        name: "Hafiz Al-Baqarah", 
        description: "Complete the longest surah in the Quran", 
        unlocked: userProgress[2]?.verses && Object.values(userProgress[2].verses).every(v => v.memorized),
        icon: <Target size={24} />,
        color: "var(--rose)"
      }
    ];
    return achievements;
  };

  const achievements = generateAchievements();

  // Format progress percentage to show <1% for small progress
  const formatProgressPercentage = (percentage) => {
    if (percentage === 0) return "0%";
    if (percentage < 1 && progress.memorizedVerses > 0) return "<1%";
    if (percentage < 1) return "0%";
    return `${percentage}%`;
  };

  // Get activity view title and description
  const getActivityViewInfo = () => {
    switch (activityView) {
      case 'weekly':
        return { title: 'Weekly Activity', description: 'Select week to view activity' };
      case 'monthly':
        return { title: 'Monthly Activity', description: 'Select month to view activity' };
      case 'yearly':
        return { title: 'Yearly Activity', description: 'Select year to view activity' };
      default:
        return { title: 'Activity Overview', description: '' };
    }
  };

  const activityViewInfo = getActivityViewInfo();

  // Navigation functions for month/year selection
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToPreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const goToNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  // Navigation functions for week selection
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(selectedWeekStart.getDate() - 7);
    setSelectedWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(selectedWeekStart.getDate() + 7);
    setSelectedWeekStart(newWeekStart);
  };

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">My Memorization Journey</h1>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Guest Warning */}
      {isGuest && (
        <div className="guest-warning">
          <span>Guest Mode: Progress saved locally only</span>
          <button 
            type="button"
            className="create-account-btn" 
            onClick={handleCreateAccountClick}
          >
            Create Account
          </button>
        </div>
      )}

      {/* Progress Summary Card */}
      <div className="progress-summary">
                  <div className="circular-progress-container">
            <div className="circular-progress">
              <svg width="300" height="300" viewBox="0 0 300 300">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E2B6B3" />
                    <stop offset="100%" stopColor="#9A86A4" />
                  </linearGradient>
                  <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="transparent" stopOpacity="0" />
                    <stop offset="30%" stopColor="rgba(255,255,255,0.4)" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.6)" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="rgba(255,255,255,0.4)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      values="0 150 150;360 150 150"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx="150"
                  cy="150"
                  r="135"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="12"
                />
                {progress.versePercentage > 0 && (
                  <>
                  <circle
                    cx="150"
                    cy="150"
                    r="135"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="16"
                    strokeDasharray={`${2 * Math.PI * 135}`}
                      strokeDashoffset={`${2 * Math.PI * 135 * (1 - Math.max(progress.versePercentage, 0.5) / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 150 150)"
                    className="progress-circle"
                  />
                    <circle
                      cx="150"
                      cy="150"
                      r="135"
                      fill="none"
                      stroke="url(#shimmerGradient)"
                      strokeWidth="18"
                      strokeDasharray={`${2 * Math.PI * 135}`}
                      strokeDashoffset={`${2 * Math.PI * 135 * (1 - Math.max(progress.versePercentage, 0.5) / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 150 150)"
                      className="progress-circle-shimmer"
                    />
                  </>
                )}
              </svg>
              <div className="progress-center">
                <div className="progress-percentage">{formatProgressPercentage(progress.versePercentage)}</div>
                <div className="progress-subtext">Verses Completed</div>
              </div>
            </div>
            
            <div className="progress-stats">
            <div className="stat-item">
              <Flame size={20} className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{realData.currentStreak}</div>
                <div className="stat-label">days</div>
              </div>
            </div>
            <div className="stat-item">
              <Calendar size={20} className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{realData.weeklyAverage}</div>
                <div className="stat-label">verses/week</div>
              </div>
            </div>
            <div className="stat-item">
              <Clock size={20} className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{realData.lastActivity}</div>
                <div className="stat-label">last activity</div>
              </div>
            </div>
            <div className="stat-item">
              <BookOpen size={20} className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{progress.completedSurahs}/{progress.totalSurahs}</div>
                <div className="stat-label">surahs memorized</div>
              </div>
            </div>
            <div className="stat-item">
              <Target size={20} className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{progress.memorizedVerses}/{progress.totalVerses}</div>
                <div className="stat-label">verses memorized</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions">
        {realData.currentSurah ? (
          <div className="action-card primary" onClick={() => navigate(`/surah/${realData.currentSurah.id}?verse=${realData.currentVerse}`)}>
            <div className="action-icon">
              <BookOpen size={24} />
            </div>
            <div className="action-content">
              <div className="action-label">Continue Memorizing</div>
              <div className="action-detail">{realData.currentSurah.name} : Verse {realData.currentVerse}</div>
            </div>
            <ChevronRight size={20} className="action-chevron" />
          </div>
        ) : (
          <div className="action-card primary" onClick={() => navigate('/surahs')}>
            <div className="action-icon">
              <BookOpen size={24} />
            </div>
            <div className="action-content">
              <div className="action-label">Start Your Journey</div>
              <div className="action-detail">Begin with Al-Fatihah</div>
            </div>
            <ChevronRight size={20} className="action-chevron" />
          </div>
        )}
        
        <div className="action-card secondary" onClick={() => navigate('/surahs')}>
          <div className="action-icon">
            <PlusCircle size={24} />
          </div>
          <div className="action-content">
            <div className="action-label">Start New Surah</div>
            <div className="action-detail">Choose from {CONSTRAINTS.QURAN.TOTAL_SURAHS} surahs</div>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="streak-calendar">
        <div className="activity-header">
          <h3>{activityViewInfo.title}</h3>
          <div className="activity-view-toggle">
            <button 
              className={`view-btn ${activityView === 'weekly' ? 'active' : ''}`}
              onClick={() => setActivityView('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`view-btn ${activityView === 'monthly' ? 'active' : ''}`}
              onClick={() => setActivityView('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`view-btn ${activityView === 'yearly' ? 'active' : ''}`}
              onClick={() => setActivityView('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        
        {/* Week/Month/Year Navigation */}
        {activityView === 'weekly' && (
          <div className="week-navigation">
            <button className="nav-btn" onClick={goToPreviousWeek}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span className="current-week">
                {(() => {
                  const weekEnd = new Date(selectedWeekStart);
                  weekEnd.setDate(selectedWeekStart.getDate() + 6);
                  const weekStartStr = selectedWeekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                  const weekEndStr = weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
                  return `${weekStartStr} - ${weekEndStr}`;
                })()}
              </span>
              {(() => {
                // Determine if this is current week, previous week (1 week before), or next week (1 week after)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const currentWeekStart = new Date(today);
                currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
                currentWeekStart.setHours(0, 0, 0, 0);
                
                const previousWeekStart = new Date(currentWeekStart);
                previousWeekStart.setDate(currentWeekStart.getDate() - 7);
                
                const nextWeekStart = new Date(currentWeekStart);
                nextWeekStart.setDate(currentWeekStart.getDate() + 7);
                
                const selectedWeekStartNormalized = new Date(selectedWeekStart);
                selectedWeekStartNormalized.setHours(0, 0, 0, 0);
                
                let weekSubheading = null;
                if (selectedWeekStartNormalized.getTime() === currentWeekStart.getTime()) {
                  weekSubheading = 'This Week';
                } else if (selectedWeekStartNormalized.getTime() === previousWeekStart.getTime()) {
                  weekSubheading = 'Past Week';
                } else if (selectedWeekStartNormalized.getTime() === nextWeekStart.getTime()) {
                  weekSubheading = 'Next Week';
                }
                
                return weekSubheading ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)', opacity: 0.7, fontWeight: 500 }}>
                    {weekSubheading}
                  </span>
                ) : null;
              })()}
            </div>
            <button className="nav-btn" onClick={goToNextWeek}>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}
        
        {activityView === 'monthly' && (
          <div className="month-navigation">
            <button className="nav-btn" onClick={goToPreviousMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className="current-month">
              {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button className="nav-btn" onClick={goToNextMonth}>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}
        
        {activityView === 'yearly' && (
          <div className="year-navigation">
            <button className="nav-btn" onClick={goToPreviousYear}>
              <ChevronLeft size={16} />
            </button>
            <span className="current-year">{selectedYear}</span>
            <button className="nav-btn" onClick={goToNextYear}>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}
        
        {activityView === 'yearly' ? (
          <div className="yearly-activity">
            {activityData.map(({ month, intensity }) => (
              <div
                key={month}
                className={`month-square intensity-${intensity}`}
                title={`${new Date(selectedYear, month).toLocaleString('default', { month: 'long' })}: ${intensity === 0 ? 'No activity' : intensity === 1 ? 'Low activity' : intensity === 2 ? 'Medium activity' : 'High activity'}`}
              >
                {new Date(selectedYear, month).toLocaleString('default', { month: 'short' })}
              </div>
            ))}
          </div>
        ) : activityView === 'weekly' ? (
          <div className="weekly-activity">
            {activityData.map(({ date, intensity, dayName }, index) => (
              <div
                key={index}
                className={`week-day intensity-${intensity}`}
                title={`${date.toLocaleDateString()}: ${intensity === 0 ? 'No activity' : intensity === 1 ? 'Low activity' : intensity === 2 ? 'Medium activity' : 'High activity'}`}
              >
                <div className="day-name">{dayName}</div>
                <div className="day-date">{date.getDate()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-grid">
            {activityData.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map(({ date, intensity, dayNumber }, dayIndex) => {
                  if (!date) {
                    return <div key={dayIndex} className="calendar-day empty"></div>;
                  }
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`calendar-day intensity-${intensity}`}
                      title={`${date.toLocaleDateString()}: ${intensity === 0 ? 'No activity' : intensity === 1 ? 'Low activity' : intensity === 2 ? 'Medium activity' : 'High activity'}`}
                    >
                      {dayNumber}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        
        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-color intensity-0"></span>
            <span>No activity</span>
          </span>
          <span className="legend-item">
            <span className="legend-color intensity-1"></span>
            <span>Low</span>
          </span>
          <span className="legend-item">
            <span className="legend-color intensity-2"></span>
            <span>Medium</span>
          </span>
          <span className="legend-item">
            <span className="legend-color intensity-3"></span>
            <span>High</span>
          </span>
        </div>
      </div>

      {/* Achievement Display */}
      <div className="achievements-section">
        <h3>Achievements</h3>
        <div className="achievements-container">
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
      </div>

      {/* Export Dialog for Guest Users Creating Account */}
      {showExportDialog && (
        <>
          <div className="settings-popup-overlay" onClick={() => setShowExportDialog(false)}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} color="var(--rose)" />
                <h3>Export Your Progress</h3>
              </div>
              <button 
                className="settings-close-btn"
                onClick={() => setShowExportDialog(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                Before creating an account, please export your guest progress data. 
                After creating your account, you can import this data to transfer your progress.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <button 
                  className="skip-button"
                  onClick={() => {
                    setShowExportDialog(false);
                    navigate('/signup');
                  }}
                >
                  Skip for Now
                </button>
                <button 
                  className="btn btn-primary export-dialog-btn"
                  onClick={exportGuestProgress}
                  style={{ width: 'auto', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Download size={16} />
                  Export & Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
