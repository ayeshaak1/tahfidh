/**
 * Storage Constants
 * 
 * This file defines ALL constants for data storage and retrieval throughout the application.
 * Every localStorage key, default value, and data structure is defined here to ensure consistency.
 * 
 * IMPORTANT: Always import and use these constants instead of hardcoding strings.
 */

// ============================================================================
// LOCALSTORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  // User Progress
  QURAN_PROGRESS: 'quranProgress',
  
  // Theme
  THEME: 'theme',
  
  // User Profile
  USER_NAME: 'userName',
  
  // Settings - Font Preference
  QURAN_FONT_PREFERENCE: 'quranFontPreference',
  
  // Settings - Display Preferences
  SHOW_TRANSLATION_PREFERENCE: 'showTranslationPreference',
  SHOW_TRANSLITERATION_PREFERENCE: 'showTransliterationPreference',
  AUTO_SCROLL_PREFERENCE: 'autoScrollPreference',
  
  // Settings - Font Sizes
  ARABIC_FONT_SIZE: 'arabicFontSize',
  TRANSLATION_FONT_SIZE: 'translationFontSize',
  TRANSLITERATION_FONT_SIZE: 'transliterationFontSize',
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_VALUES = {
  // Theme
  THEME: 'light',
  
  // User Profile
  USER_NAME: '',
  
  // Settings - Font Preference
  QURAN_FONT: 'uthmani',
  
  // Settings - Display Preferences
  SHOW_TRANSLATION: true,
  SHOW_TRANSLITERATION: true,
  AUTO_SCROLL: false,
  
  // Settings - Font Sizes
  ARABIC_FONT_SIZE: 2.5,
  TRANSLATION_FONT_SIZE: 1.0,
  TRANSLITERATION_FONT_SIZE: 1.0,
  
  // Progress
  USER_PROGRESS: {},
};

// ============================================================================
// VALID VALUES / ENUMS
// ============================================================================

export const VALID_VALUES = {
  // Theme
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  
  // Font Types
  FONT_TYPES: {
    UTHMANI: 'uthmani',
    INDOPAK: 'indopak',
  },
  
  // Activity Views
  ACTIVITY_VIEWS: {
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },
  
  // Surah Status
  SURAH_STATUS: {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  },
  
  // Status Filters
  STATUS_FILTERS: {
    ALL: 'All',
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  },
};

// ============================================================================
// CONSTRAINTS / RANGES
// ============================================================================

export const CONSTRAINTS = {
  // Font Sizes
  FONT_SIZES: {
    ARABIC: {
      MIN: 1.0,
      MAX: 4.0,
      STEP: 0.1,
    },
    TRANSLATION: {
      MIN: 0.7,
      MAX: 2.0,
      STEP: 0.1,
    },
    TRANSLITERATION: {
      MIN: 0.7,
      MAX: 2.0,
      STEP: 0.1,
    },
  },
  
  // Quran Constants
  QURAN: {
    TOTAL_SURAHS: 114,
    TOTAL_VERSES: 6236,
    TOTAL_JUZ: 30,
  },
};

// ============================================================================
// DATA STRUCTURE DEFINITIONS
// ============================================================================

/**
 * User Progress Data Structure
 * 
 * @typedef {Object} VerseProgress
 * @property {boolean} memorized - Whether the verse is memorized
 * @property {string} lastReviewed - ISO timestamp of last review (e.g., "2024-01-15T10:30:00.000Z")
 * 
 * @typedef {Object} SurahProgress
 * @property {string} name - Surah name (e.g., "Al-Fatihah")
 * @property {Object<string, VerseProgress>} verses - Object mapping verse numbers to their progress
 * 
 * @typedef {Object<string, SurahProgress>} UserProgress
 * Maps surah IDs (as strings) to their progress data
 */

export const DATA_STRUCTURES = {
  /**
   * Creates an empty verse progress object
   * @param {boolean} memorized - Whether the verse is memorized
   * @param {string} lastReviewed - ISO timestamp
   * @returns {VerseProgress}
   */
  createVerseProgress: (memorized = false, lastReviewed = null) => ({
    memorized,
    lastReviewed: lastReviewed || new Date().toISOString(),
  }),
  
  /**
   * Creates an empty surah progress object
   * @param {string} name - Surah name
   * @returns {SurahProgress}
   */
  createSurahProgress: (name) => ({
    name,
    verses: {},
  }),
  
  /**
   * Creates an empty user progress object
   * @returns {UserProgress}
   */
  createUserProgress: () => ({}),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Storage Helper Functions
 * These functions provide a consistent interface for localStorage operations
 */

export const StorageHelpers = {
  /**
   * Get item from localStorage with default value
   * @param {string} key - localStorage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any}
   */
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (error) {
      console.error(`Error getting localStorage item "${key}":`, error);
      return defaultValue;
    }
  },
  
  /**
   * Get JSON item from localStorage with default value
   * @param {string} key - localStorage key
   * @param {any} defaultValue - Default value if key doesn't exist or parse fails
   * @returns {any}
   */
  getJSONItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error parsing JSON from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  
  /**
   * Set item in localStorage
   * @param {string} key - localStorage key
   * @param {any} value - Value to store (will be stringified if not a string)
   * @returns {boolean} - Success status
   */
  setItem: (key, value) => {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error(`Error setting localStorage item "${key}":`, error);
      return false;
    }
  },
  
  /**
   * Remove item from localStorage
   * @param {string} key - localStorage key
   * @returns {boolean} - Success status
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage item "${key}":`, error);
      return false;
    }
  },
  
  /**
   * Clear all app-related localStorage items
   * @returns {boolean} - Success status
   */
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const Validators = {
  /**
   * Validate theme value
   * @param {string} theme - Theme value to validate
   * @returns {boolean}
   */
  isValidTheme: (theme) => {
    return Object.values(VALID_VALUES.THEMES).includes(theme);
  },
  
  /**
   * Validate font type value
   * @param {string} font - Font type to validate
   * @returns {boolean}
   */
  isValidFontType: (font) => {
    return Object.values(VALID_VALUES.FONT_TYPES).includes(font);
  },
  
  /**
   * Validate and clamp font size
   * @param {number} size - Font size to validate
   * @param {string} type - Font size type ('arabic', 'translation', 'transliteration')
   * @returns {number} - Clamped and validated font size
   */
  validateFontSize: (size, type) => {
    const constraints = CONSTRAINTS.FONT_SIZES[type.toUpperCase()];
    if (!constraints) {
      console.warn(`Unknown font size type: ${type}`);
      return size;
    }
    return Math.max(constraints.MIN, Math.min(constraints.MAX, size));
  },
  
  /**
   * Validate user progress structure
   * @param {any} progress - Progress object to validate
   * @returns {boolean}
   */
  isValidUserProgress: (progress) => {
    if (!progress || typeof progress !== 'object') return false;
    
    // Check each surah entry
    for (const [surahId, surahData] of Object.entries(progress)) {
      if (!surahData || typeof surahData !== 'object') return false;
      if (!surahData.name || typeof surahData.name !== 'string') return false;
      if (!surahData.verses || typeof surahData.verses !== 'object') return false;
      
      // Check each verse entry
      for (const [verseNum, verseData] of Object.entries(surahData.verses)) {
        if (!verseData || typeof verseData !== 'object') return false;
        if (typeof verseData.memorized !== 'boolean') return false;
        if (verseData.lastReviewed && typeof verseData.lastReviewed !== 'string') return false;
      }
    }
    
    return true;
  },
};

// ============================================================================
// EXPORT/IMPORT DATA STRUCTURE
// ============================================================================

/**
 * Export Data Structure
 * Contains all user data that should be exported/imported
 * 
 * @typedef {Object} ExportData
 * @property {UserProgress} progress - User progress data
 * @property {string} userName - User's name
 * @property {string} theme - Theme preference
 * @property {string} quranFont - Font preference
 * @property {boolean} showTranslation - Translation visibility
 * @property {boolean} showTransliteration - Transliteration visibility
 * @property {boolean} autoScroll - Auto-scroll preference
 * @property {number} arabicFontSize - Arabic font size
 * @property {number} translationFontSize - Translation font size
 * @property {number} transliterationFontSize - Transliteration font size
 * @property {string} exportDate - ISO timestamp of export
 * @property {string} version - Export format version
 */

export const EXPORT_VERSION = '1.0.0';

export const ExportHelpers = {
  /**
   * Create export data object from current app state
   * @param {UserProgress} userProgress - Current user progress (includes all verse data with memorized status and lastReviewed timestamps)
   * @param {string} userName - Current user name
   * @param {string} theme - Current theme
   * @param {Object} settings - All settings from SettingsContext
   * @returns {ExportData}
   */
  createExportData: (userProgress, userName, theme, settings) => {
    return {
      progress: userProgress, // Contains all surahs, verses, memorized status, and lastReviewed timestamps
      userName: userName || '',
      theme: theme || DEFAULT_VALUES.THEME,
      quranFont: settings.quranFont || DEFAULT_VALUES.QURAN_FONT,
      showTranslation: settings.showTranslation ?? DEFAULT_VALUES.SHOW_TRANSLATION,
      showTransliteration: settings.showTransliteration ?? DEFAULT_VALUES.SHOW_TRANSLITERATION,
      autoScroll: settings.autoScroll ?? DEFAULT_VALUES.AUTO_SCROLL,
      arabicFontSize: settings.arabicFontSize || DEFAULT_VALUES.ARABIC_FONT_SIZE,
      translationFontSize: settings.translationFontSize || DEFAULT_VALUES.TRANSLATION_FONT_SIZE,
      transliterationFontSize: settings.transliterationFontSize || DEFAULT_VALUES.TRANSLITERATION_FONT_SIZE,
      exportDate: new Date().toISOString(),
      version: EXPORT_VERSION,
    };
  },
  
  /**
   * Validate and parse import data
   * @param {any} data - Import data to validate
   * @returns {{valid: boolean, data: ExportData | null, error: string | null}}
   */
  validateImportData: (data) => {
    try {
      if (!data || typeof data !== 'object') {
        return { valid: false, data: null, error: 'Invalid data format' };
      }
      
      // Check required fields
      if (!data.progress || typeof data.progress !== 'object') {
        return { valid: false, data: null, error: 'Missing or invalid progress data' };
      }
      
      // Validate progress structure
      if (!Validators.isValidUserProgress(data.progress)) {
        return { valid: false, data: null, error: 'Invalid progress data structure' };
      }
      
      return { valid: true, data, error: null };
    } catch (error) {
      return { valid: false, data: null, error: error.message };
    }
  },
};

