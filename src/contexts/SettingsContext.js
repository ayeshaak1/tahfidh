import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  STORAGE_KEYS, 
  DEFAULT_VALUES, 
  VALID_VALUES, 
  CONSTRAINTS,
  StorageHelpers, 
  Validators 
} from '../constants/storageConstants';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Load all settings from localStorage with defaults
  const [quranFont, setQuranFont] = useState(() => {
    const saved = StorageHelpers.getItem(STORAGE_KEYS.QURAN_FONT_PREFERENCE, DEFAULT_VALUES.QURAN_FONT);
    return Validators.isValidFontType(saved) ? saved : DEFAULT_VALUES.QURAN_FONT;
  });

  const [showTranslation, setShowTranslation] = useState(() => {
    const saved = StorageHelpers.getJSONItem(STORAGE_KEYS.SHOW_TRANSLATION_PREFERENCE, DEFAULT_VALUES.SHOW_TRANSLATION);
    return typeof saved === 'boolean' ? saved : DEFAULT_VALUES.SHOW_TRANSLATION;
  });

  const [showTransliteration, setShowTransliteration] = useState(() => {
    const saved = StorageHelpers.getJSONItem(STORAGE_KEYS.SHOW_TRANSLITERATION_PREFERENCE, DEFAULT_VALUES.SHOW_TRANSLITERATION);
    return typeof saved === 'boolean' ? saved : DEFAULT_VALUES.SHOW_TRANSLITERATION;
  });

  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = StorageHelpers.getJSONItem(STORAGE_KEYS.AUTO_SCROLL_PREFERENCE, DEFAULT_VALUES.AUTO_SCROLL);
    return typeof saved === 'boolean' ? saved : DEFAULT_VALUES.AUTO_SCROLL;
  });

  const [arabicFontSize, setArabicFontSize] = useState(() => {
    const saved = StorageHelpers.getItem(STORAGE_KEYS.ARABIC_FONT_SIZE);
    const parsed = saved ? parseFloat(saved) : DEFAULT_VALUES.ARABIC_FONT_SIZE;
    return Validators.validateFontSize(parsed, 'arabic');
  });

  const [translationFontSize, setTranslationFontSize] = useState(() => {
    const saved = StorageHelpers.getItem(STORAGE_KEYS.TRANSLATION_FONT_SIZE);
    const parsed = saved ? parseFloat(saved) : DEFAULT_VALUES.TRANSLATION_FONT_SIZE;
    return Validators.validateFontSize(parsed, 'translation');
  });

  const [transliterationFontSize, setTransliterationFontSize] = useState(() => {
    const saved = StorageHelpers.getItem(STORAGE_KEYS.TRANSLITERATION_FONT_SIZE);
    const parsed = saved ? parseFloat(saved) : DEFAULT_VALUES.TRANSLITERATION_FONT_SIZE;
    return Validators.validateFontSize(parsed, 'transliteration');
  });

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.QURAN_FONT_PREFERENCE, quranFont);
  }, [quranFont]);

  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.SHOW_TRANSLATION_PREFERENCE, showTranslation);
  }, [showTranslation]);

  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.SHOW_TRANSLITERATION_PREFERENCE, showTransliteration);
  }, [showTransliteration]);

  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.AUTO_SCROLL_PREFERENCE, autoScroll);
  }, [autoScroll]);

  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.ARABIC_FONT_SIZE, arabicFontSize.toString());
  }, [arabicFontSize]);

  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.TRANSLATION_FONT_SIZE, translationFontSize.toString());
  }, [translationFontSize]);

  useEffect(() => {
    StorageHelpers.setItem(STORAGE_KEYS.TRANSLITERATION_FONT_SIZE, transliterationFontSize.toString());
  }, [transliterationFontSize]);

  // Reset all font sizes to defaults
  const resetFontSizes = () => {
    setArabicFontSize(DEFAULT_VALUES.ARABIC_FONT_SIZE);
    setTranslationFontSize(DEFAULT_VALUES.TRANSLATION_FONT_SIZE);
    setTransliterationFontSize(DEFAULT_VALUES.TRANSLITERATION_FONT_SIZE);
  };

  const value = {
    // Font preference
    quranFont,
    setQuranFont,
    
    // Display preferences
    showTranslation,
    setShowTranslation,
    showTransliteration,
    setShowTransliteration,
    autoScroll,
    setAutoScroll,
    
    // Font sizes
    arabicFontSize,
    setArabicFontSize,
    translationFontSize,
    setTranslationFontSize,
    transliterationFontSize,
    setTransliterationFontSize,
    resetFontSizes,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

