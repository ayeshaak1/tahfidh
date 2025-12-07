import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, StorageHelpers } from '../constants/storageConstants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN, null);
        const userData = StorageHelpers.getJSONItem(STORAGE_KEYS.USER_DATA, null);
        const onboardingStatus = StorageHelpers.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');
        
        if (token && userData) {
          // Verify token is still valid
          const isValid = await verifyToken(token);
          if (isValid) {
            setUser(userData);
            setIsAuthenticated(true);
            setHasCompletedOnboarding(onboardingStatus === 'true');
          } else {
            // Token invalid, clear storage
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const clearAuth = () => {
    StorageHelpers.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    StorageHelpers.removeItem(STORAGE_KEYS.USER_DATA);
    StorageHelpers.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    setUser(null);
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
  };

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign in failed');
      }

      const data = await response.json();
      const { token, user: userData, onboardingComplete } = data;

      StorageHelpers.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      StorageHelpers.setItem(STORAGE_KEYS.USER_DATA, userData);
      StorageHelpers.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, onboardingComplete ? 'true' : 'false');

      setUser(userData);
      setIsAuthenticated(true);
      setHasCompletedOnboarding(onboardingComplete);

      return { success: true, needsOnboarding: !onboardingComplete };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign up failed');
      }

      const data = await response.json();
      const { token, user: userData } = data;

      StorageHelpers.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      StorageHelpers.setItem(STORAGE_KEYS.USER_DATA, userData);
      StorageHelpers.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');

      setUser(userData);
      setIsAuthenticated(true);
      setHasCompletedOnboarding(false);

      return { success: true, needsOnboarding: true };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Redirect to Google OAuth
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      window.location.href = `${apiUrl}/auth/google`;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = () => {
    clearAuth();
  };

  const completeOnboarding = async (memorizedSurahs, progress = null) => {
    try {
      const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ memorizedSurahs, progress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Onboarding failed');
      }

      const data = await response.json();
      StorageHelpers.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      setHasCompletedOnboarding(true);

      return { success: true, progress: data.progress };
    } catch (error) {
      console.error('Onboarding error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      // Clear local auth data
      clearAuth();
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    hasCompletedOnboarding,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    completeOnboarding,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

