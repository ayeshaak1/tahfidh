import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Download, Upload, Trash2, User, Sun, Moon, Menu, X, Star, BookOpenCheck, Target, Flame, Trophy, Lock, AlertTriangle, Edit2, Check, HelpCircle, CheckCircle, Mail, LogOut } from 'lucide-react';
import quranApi from '../services/quranApi';
import progressApi from '../services/progressApi';
import LottieLoader from './LottieLoader';
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
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, deleteAccount } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showImportSuccessDialog, setShowImportSuccessDialog] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [userName, setUserName] = useState(() => {
    // COMPLETELY SEPARATE: Guest uses GUEST_USER_NAME, Auth uses USER_DATA.name
    if (isGuest) {
      // Guest mode: ONLY use GUEST_USER_NAME, never touch auth data
      const guestName = StorageHelpers.getItem(STORAGE_KEYS.GUEST_USER_NAME, '');
      return guestName || '';
    }
    // Authenticated mode: ONLY use USER_DATA.name, never touch guest data
    const authUser = StorageHelpers.getJSONItem(STORAGE_KEYS.USER_DATA);
    return authUser?.name || '';
  });
  const [userEmail, setUserEmail] = useState(() => {
    // For guest mode, don't show email. For authenticated users, use auth data.
    if (isGuest) {
      return '';
    }
    const authUser = StorageHelpers.getJSONItem(STORAGE_KEYS.USER_DATA);
    return authUser?.email || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [showEditProfilePopup, setShowEditProfilePopup] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
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

  // Reset userName when switching between guest and authenticated mode
  // COMPLETELY SEPARATE: Guest uses GUEST_USER_NAME, Auth uses user object from context
  useEffect(() => {
    // CRITICAL: Check isGuest FIRST - if guest, never read auth data
    if (isGuest) {
      // Guest mode: ONLY use GUEST_USER_NAME, never touch auth data
      // Defensive: Clear any auth data that might be lingering
      StorageHelpers.removeItem(STORAGE_KEYS.USER_DATA);
      StorageHelpers.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      const guestName = StorageHelpers.getItem(STORAGE_KEYS.GUEST_USER_NAME, '');
      setUserName(guestName || '');
      setUserEmail(''); // Guests don't have email
    } else if (isAuthenticated && user) {
      // Authenticated mode: ONLY use user object from auth context, never touch guest data
      setUserName(user.name || '');
      setUserEmail(user.email || '');
    } else {
      // Neither guest nor authenticated - reset to empty
      setUserName('');
      setUserEmail('');
    }
  }, [isGuest, isAuthenticated, user]);

  // Listen for storage changes (when localStorage is cleared) - GUEST ONLY
  useEffect(() => {
    if (!isGuest) return;

    const checkUserName = () => {
      // Guest mode: ONLY use GUEST_USER_NAME
      const guestName = StorageHelpers.getItem(STORAGE_KEYS.GUEST_USER_NAME, '');
      const newName = guestName || '';
      if (userName !== newName) {
        setUserName(newName);
      }
    };

    // Listen for storage events (when localStorage is cleared from another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.GUEST_USER_NAME || e.key === null) {
        checkUserName();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check on focus (when user returns to tab after clearing data)
    const handleFocus = () => {
      checkUserName();
    };
    
    window.addEventListener('focus', handleFocus);

    // Also check periodically (every 500ms) to catch manual localStorage clears in same tab
    // This is needed because storage event doesn't fire for same-tab clears
    const intervalId = setInterval(() => {
      checkUserName();
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [isGuest, userName]);

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

  // Update userName and userEmail from auth context when user changes (only for authenticated users)
  // CRITICAL: Only update if NOT in guest mode
  useEffect(() => {
    if (isGuest) {
      // In guest mode, ignore auth user changes
      return;
    }
    if (isAuthenticated && user) {
      if (user.name) setUserName(user.name);
      if (user.email) setUserEmail(user.email);
    }
  }, [user, isGuest, isAuthenticated]);

  // Save userName to localStorage - GUEST ONLY
  // Authenticated users' names are stored in USER_DATA (managed by backend)
  useEffect(() => {
    if (isGuest && userName) {
      // Guest mode: ONLY save to GUEST_USER_NAME
      StorageHelpers.setItem(STORAGE_KEYS.GUEST_USER_NAME, userName);
    }
    // Authenticated users: DO NOT save to localStorage - name is in USER_DATA from backend
  }, [userName, isGuest]);

  const handleEditName = () => {
    setEditedName(userName);
    setIsEditingName(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveName = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      setProfileError('Name cannot be empty');
      return;
    }

    if (isAuthenticated && !isGuest) {
      // Update via API
      setIsUpdating(true);
      setProfileError('');
      try {
        const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update name');
        }

        const data = await response.json();
        setUserName(data.user.name);
        // Update stored user data
        StorageHelpers.setItem(STORAGE_KEYS.USER_DATA, data.user);
        setProfileSuccess('Name updated successfully');
        setIsEditingName(false);
        setTimeout(() => setProfileSuccess(''), 3000);
      } catch (error) {
        setProfileError(error.message || 'Failed to update name');
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Guest mode - just update local state
      setUserName(trimmedName);
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
    setProfileError('');
    setProfileSuccess('');
  };

  const handleEditEmail = () => {
    setEditedEmail(userEmail);
    setIsEditingEmail(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveEmail = async () => {
    const trimmedEmail = editedEmail.trim();
    if (!trimmedEmail) {
      setProfileError('Email cannot be empty');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileError('Please enter a valid email address');
      return;
    }

    setIsUpdating(true);
    setProfileError('');
    try {
      const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update email');
      }

      const data = await response.json();
      setUserEmail(data.user.email);
      StorageHelpers.setItem(STORAGE_KEYS.USER_DATA, data.user);
      setProfileSuccess('Email updated successfully');
      setIsEditingEmail(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      setProfileError(error.message || 'Failed to update email');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setEditedEmail('');
    setProfileError('');
    setProfileSuccess('');
  };

  const handleEditPassword = () => {
    setPasswordData({ current: '', new: '', confirm: '' });
    setIsEditingPassword(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSavePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setProfileError('All password fields are required');
      return;
    }

    if (passwordData.new.length < 6) {
      setProfileError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setProfileError('New passwords do not match');
      return;
    }

    setIsUpdating(true);
    setProfileError('');
    try {
      const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          currentPassword: passwordData.current,
          newPassword: passwordData.new 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }

      setProfileSuccess('Password updated successfully');
      setIsEditingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      setProfileError(error.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEditPassword = () => {
    setIsEditingPassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setProfileError('');
    setProfileSuccess('');
  };

  const handleLogout = () => {
    // CRITICAL: Logout should clear all auth data and switch to guest mode
    // The App.js useEffect will handle the mode switch when isAuthenticated becomes false
    console.log('🚪 User initiated logout');
    signOut();
    // Navigate to landing page - the app will automatically switch to guest mode
    navigate('/');
  };

  const handleOpenEditProfile = () => {
    setEditedName(userName);
    setEditedEmail(userEmail);
    setIsEditingName(false);
    setIsEditingEmail(false);
    setIsEditingPassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setProfileError('');
    setProfileSuccess('');
    setShowEditProfilePopup(true);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfilePopup(false);
    setIsEditingName(false);
    setIsEditingEmail(false);
    setIsEditingPassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setProfileError('');
    setProfileSuccess('');
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
      setIsImportingData(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate import data
          const validation = ExportHelpers.validateImportData(importedData);
          if (!validation.valid) {
            setImportError(validation.error || 'Invalid file format');
            setShowImportSuccessDialog(false);
            setIsImportingData(false);
            return;
          }
          
          // Clear any previous errors
          setImportError(null);
          
          // Import progress data (includes all verse data with lastReviewed timestamps)
          // This is the most important data - contains all memorization progress
          if (importedData.progress && Validators.isValidUserProgress(importedData.progress)) {
            setUserProgress(importedData.progress);
            // Don't save directly - App.js will handle saving to correct location (GUEST_PROGRESS or QURAN_PROGRESS + database)
          } else {
            // If progress is missing or invalid, that's a critical error
            setImportError('Invalid or missing progress data');
            setShowImportSuccessDialog(false);
            setIsImportingData(false);
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
          setIsImportingData(false);
        } catch (error) {
          // Handle JSON parse errors or other unexpected errors
          setImportError(error.message || 'Failed to parse import file. Please ensure it is a valid JSON file.');
          setShowImportSuccessDialog(false);
          setIsImportingData(false);
        }
      };
      
      reader.onerror = () => {
        setImportError('Failed to read file. Please try again.');
        setShowImportSuccessDialog(false);
        setIsImportingData(false);
      };
      
      reader.readAsText(file);
    }
    // Reset file input so same file can be imported again
    event.target.value = '';
  };

  const clearLocalData = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClear = async () => {
    setIsClearingData(true);
    try {
      // Clear local cache first - this will trigger App.js to save empty progress
      setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
      
      // Use appropriate storage key based on user type - COMPLETELY SEPARATE
      if (isGuest) {
        StorageHelpers.removeItem(STORAGE_KEYS.GUEST_PROGRESS);
        StorageHelpers.setItem(STORAGE_KEYS.GUEST_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
        StorageHelpers.removeItem(STORAGE_KEYS.GUEST_USER_NAME);
        setUserName(''); // Reset to empty so "Guest User" is displayed
      } else {
        StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
        StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, DEFAULT_VALUES.USER_PROGRESS);
        // For authenticated users, also clear from database
        if (isAuthenticated) {
          try {
            await progressApi.clearProgress();
            console.log('Progress cleared from database');
          } catch (error) {
            console.error('Failed to clear progress from database:', error);
            // Still show success since local cache is cleared
          }
        }
      }
      
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error clearing data:', error);
      setProfileError('Failed to clear data. Please try again.');
      setShowConfirmDialog(false);
    } finally {
      setIsClearingData(false);
    }
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

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true);
  };

  const handleCancelDeleteAccount = () => {
    setShowDeleteAccountDialog(false);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowDeleteAccountDialog(false);
      setShowDeleteSuccessDialog(true);
      // Clear all local data as well
      setUserProgress(DEFAULT_VALUES.USER_PROGRESS);
      StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS);
      // Navigate to landing page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setProfileError(error.message || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
    }
  };

  const handleCloseDeleteSuccess = () => {
    setShowDeleteSuccessDialog(false);
    navigate('/');
  };


  // Show loading screen while clearing or importing data
  if (isClearingData || isImportingData) {
    return (
      <div className={`profile-page ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="app-header">
          <div className="header-left">
            <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">Profile & Settings</h1>
          </div>
        </header>
        <LottieLoader 
          size="large" 
          showVerse={true}
        />
      </div>
    );
  }

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
          <button 
            className="create-account-btn" 
            onClick={() => {
              // Check if user has any progress to export
              const hasProgress = userProgress && Object.keys(userProgress).length > 0;
              if (hasProgress) {
                setShowExportDialog(true);
              } else {
                // No progress, go directly to signup
                navigate('/signup');
              }
            }}
          >
            Create Account
          </button>
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
              <div className="user-name-container">
                {isGuest ? (
                  // Guest mode: use old simple edit design
                  isEditingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                        style={{
                          flex: 1,
                          minWidth: '200px',
                          padding: '0.5rem 1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '20px',
                          background: 'var(--cream)',
                          color: 'var(--text)',
                          fontSize: '1.8rem',
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--rose)';
                          e.target.style.background = 'var(--beige)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(226, 182, 179, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.background = 'var(--cream)';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="Enter your name"
                        autoFocus
                        disabled={isUpdating}
                      />
                      <button
                        onClick={handleSaveName}
                        className="user-name-action-btn user-name-save-btn"
                        title="Save name"
                        disabled={isUpdating}
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        className="user-name-action-btn user-name-cancel-btn"
                        title="Cancel editing"
                        disabled={isUpdating}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="edit-profile-display">
                      <h2>{userName || 'Guest User'}</h2>
                      <button
                        onClick={handleEditName}
                        className="user-name-edit-btn"
                        title="Edit name"
                      >
                        <Edit2 size={20} />
                      </button>
                    </div>
                  )
                ) : (
                  // Authenticated users: show name with edit profile button
                  <>
                    <h2>{userName || 'User Name'}</h2>
                    {isAuthenticated && (
                      <button
                        onClick={handleOpenEditProfile}
                        className="btn btn-secondary"
                        style={{ width: 'auto', minWidth: '120px' }}
                      >
                        <Edit2 size={16} />
                        Edit Profile
                      </button>
                    )}
                  </>
                )}
              </div>
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
              <>
                <button className="btn btn-danger" onClick={clearLocalData} style={{ marginRight: '1rem' }}>
                  <Trash2 size={16} />
                  Clear Data
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  <Trash2 size={16} />
                  Delete Account
                </button>
              </>
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
          {!isGuest && isAuthenticated && (
            <button
              onClick={handleLogout}
              className="btn"
              style={{ 
                width: '100%',
                maxWidth: '100%',
                minWidth: '100%',
                border: '2px solid var(--error-red)',
                color: 'var(--error-red)',
                backgroundColor: 'transparent',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--error-red-light)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
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
                <h3>{isGuest ? 'Clear Local Data' : 'Clear Data'}</h3>
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
                {isGuest 
                  ? 'Are you sure you want to clear all local progress data? This action cannot be undone.'
                  : 'Are you sure you want to clear all progress data from both the database and local cache? This action cannot be undone.'
                }
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

      {/* Delete Account Confirmation Dialog */}
      {showDeleteAccountDialog && (
        <>
          <div className="settings-popup-overlay" onClick={handleCancelDeleteAccount}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} color="var(--error-red)" />
                <h3>Delete Account</h3>
              </div>
              <button 
                className="settings-close-btn"
                onClick={handleCancelDeleteAccount}
                disabled={isDeletingAccount}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                Are you sure you want to delete your account? This will permanently delete all your data, including your progress, settings, and account information. This action cannot be undone.
              </p>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.6' }}>
                Before deleting, make sure to export your progress as a backup if you want to keep a copy.
              </p>
              {profileError && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  marginBottom: '1.5rem',
                  backgroundColor: 'var(--error-red-light)', 
                  border: '1px solid var(--error-red-border)', 
                  borderRadius: '8px',
                  color: 'var(--error-red)',
                  fontSize: '0.9rem'
                }}>
                  {profileError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancelDeleteAccount}
                  style={{ width: 'auto', minWidth: '120px' }}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleConfirmDeleteAccount}
                  style={{ width: 'auto', minWidth: '120px' }}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Account Success Dialog */}
      {showDeleteSuccessDialog && (
        <>
          <div className="settings-popup-overlay" onClick={handleCloseDeleteSuccess}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={24} color="var(--rose)" />
                <h3>Account Deleted</h3>
              </div>
              <button 
                className="settings-close-btn"
                onClick={handleCloseDeleteSuccess}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
                Your account has been successfully deleted. You will be redirected to the home page.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCloseDeleteSuccess}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Profile Popup */}
      {showEditProfilePopup && (
        <>
          <div className="settings-popup-overlay" onClick={handleCloseEditProfile}></div>
          <div className="settings-popup confirmation-dialog">
            <div className="settings-popup-header">
              <h3>Edit Profile</h3>
              <button 
                className="settings-close-btn"
                onClick={handleCloseEditProfile}
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-popup-content">
              {/* Profile Error/Success Messages */}
              {profileError && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  marginBottom: '1.5rem',
                  backgroundColor: 'var(--error-red-light)', 
                  border: '1px solid var(--error-red-border)', 
                  borderRadius: '8px',
                  color: 'var(--error-red)',
                  fontSize: '0.9rem'
                }}>
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  marginBottom: '1.5rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  borderRadius: '8px',
                  color: '#059669',
                  fontSize: '0.9rem'
                }}>
                  {profileSuccess}
                </div>
              )}

              {/* Name Editing */}
              <div className="edit-profile-section">
                <h4 className="edit-profile-label">Name</h4>
                {isEditingName ? (
                  <div className="edit-profile-field-container">
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
                      className="edit-profile-input"
                      placeholder="Enter your name"
                      disabled={isUpdating}
                    />
                    <div className="edit-profile-actions">
                      <button
                        onClick={handleSaveName}
                        className="user-name-action-btn user-name-save-btn"
                        title="Save name"
                        disabled={isUpdating}
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        className="user-name-action-btn user-name-cancel-btn"
                        title="Cancel editing"
                        disabled={isUpdating}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="edit-profile-display">
                    <span>{userName || (isGuest ? 'Guest User' : 'User Name')}</span>
                    <button
                      onClick={() => {
                        setEditedName(userName);
                        setIsEditingName(true);
                        setProfileError('');
                        setProfileSuccess('');
                      }}
                      className="user-name-edit-btn"
                      title="Edit name"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Email Editing */}
              <div className="edit-profile-section">
                <h4 className="edit-profile-label">Email</h4>
                {isEditingEmail ? (
                  <div className="edit-profile-field-container">
                    <input
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEmail();
                        } else if (e.key === 'Escape') {
                          handleCancelEditEmail();
                        }
                      }}
                      autoFocus
                      className="edit-profile-input"
                      placeholder="Enter your email"
                      disabled={isUpdating}
                    />
                    <div className="edit-profile-actions">
                      <button
                        onClick={handleSaveEmail}
                        className="user-name-action-btn user-name-save-btn"
                        title="Save email"
                        disabled={isUpdating}
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={handleCancelEditEmail}
                        className="user-name-action-btn user-name-cancel-btn"
                        title="Cancel editing"
                        disabled={isUpdating}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="edit-profile-display">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={16} style={{ opacity: 0.7 }} />
                      <span>{userEmail || 'No email'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditedEmail(userEmail);
                        setIsEditingEmail(true);
                        setProfileError('');
                        setProfileSuccess('');
                      }}
                      className="user-name-edit-btn"
                      title="Edit email"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Password Change */}
              <div className="edit-profile-section">
                <h4 className="edit-profile-label">Change Password</h4>
                {isEditingPassword ? (
                  <div className="edit-profile-field-container">
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="edit-profile-input"
                      placeholder="Enter current password"
                      disabled={isUpdating}
                      style={{ marginBottom: '0.75rem' }}
                    />
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="edit-profile-input"
                      placeholder="Enter new password (min. 6 characters)"
                      disabled={isUpdating}
                      style={{ marginBottom: '0.75rem' }}
                    />
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="edit-profile-input"
                      placeholder="Confirm new password"
                      disabled={isUpdating}
                    />
                    <div className="edit-profile-actions" style={{ marginTop: '0.75rem' }}>
                      <button
                        onClick={handleSavePassword}
                        className="user-name-action-btn user-name-save-btn"
                        title="Save password"
                        disabled={isUpdating}
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={handleCancelEditPassword}
                        className="user-name-action-btn user-name-cancel-btn"
                        title="Cancel editing"
                        disabled={isUpdating}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="edit-profile-display">
                    <span style={{ opacity: 0.7 }}>Click to change password</span>
                    <button
                      onClick={() => {
                        setPasswordData({ current: '', new: '', confirm: '' });
                        setIsEditingPassword(true);
                        setProfileError('');
                        setProfileSuccess('');
                      }}
                      className="user-name-edit-btn"
                      title="Change password"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  className="skip-button"
                  onClick={() => {
                    setShowExportDialog(false);
                    navigate('/signup');
                  }}
                >
                  Skip
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    exportProgress();
                    setShowExportDialog(false);
                    navigate('/signup');
                  }}
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

export default Profile;
