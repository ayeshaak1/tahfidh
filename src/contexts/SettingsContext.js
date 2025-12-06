import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = localStorage.getItem('autoScrollPreference');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [arabicFontSize, setArabicFontSize] = useState(() => {
    const saved = localStorage.getItem('arabicFontSize');
    return saved ? parseFloat(saved) : 2.5;
  });

  const [translationFontSize, setTranslationFontSize] = useState(() => {
    const saved = localStorage.getItem('translationFontSize');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [transliterationFontSize, setTransliterationFontSize] = useState(() => {
    const saved = localStorage.getItem('transliterationFontSize');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quranFontPreference', quranFont);
  }, [quranFont]);

  useEffect(() => {
    localStorage.setItem('showTranslationPreference', JSON.stringify(showTranslation));
  }, [showTranslation]);

  useEffect(() => {
    localStorage.setItem('showTransliterationPreference', JSON.stringify(showTransliteration));
  }, [showTransliteration]);

  useEffect(() => {
    localStorage.setItem('autoScrollPreference', JSON.stringify(autoScroll));
  }, [autoScroll]);

  useEffect(() => {
    localStorage.setItem('arabicFontSize', arabicFontSize.toString());
  }, [arabicFontSize]);

  useEffect(() => {
    localStorage.setItem('translationFontSize', translationFontSize.toString());
  }, [translationFontSize]);

  useEffect(() => {
    localStorage.setItem('transliterationFontSize', transliterationFontSize.toString());
  }, [transliterationFontSize]);

  // Reset all font sizes to defaults
  const resetFontSizes = () => {
    setArabicFontSize(2.5);
    setTranslationFontSize(1.0);
    setTransliterationFontSize(1.0);
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

