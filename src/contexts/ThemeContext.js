import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULT_VALUES, VALID_VALUES, StorageHelpers, Validators } from '../constants/storageConstants';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default
    const savedTheme = StorageHelpers.getItem(STORAGE_KEYS.THEME, DEFAULT_VALUES.THEME);
    // Validate theme value
    return Validators.isValidTheme(savedTheme) ? savedTheme : DEFAULT_VALUES.THEME;
  });

  useEffect(() => {
    // Apply theme to document whenever theme changes
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage whenever theme changes
    StorageHelpers.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === VALID_VALUES.THEMES.LIGHT ? VALID_VALUES.THEMES.DARK : VALID_VALUES.THEMES.LIGHT);
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};


