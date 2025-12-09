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
        
        if (token) {
          // If we have a token but no userData (e.g., after Google OAuth redirect), fetch user data
          if (!userData) {
            // Retry logic for OAuth tokens (signup flow)
            let retries = 2;
            let lastError = null;
            
            while (retries >= 0) {
              try {
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                
                if (response.ok) {
                  const data = await response.json();
                  const fetchedUserData = data.user;
                  const fetchedOnboardingStatus = data.onboardingComplete;
                  
                  // Store fetched user data
                  StorageHelpers.setItem(STORAGE_KEYS.USER_DATA, fetchedUserData);
                  StorageHelpers.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, fetchedOnboardingStatus ? 'true' : 'false');
                  
                  // Clear OAuth redirect path if it exists
                  StorageHelpers.removeItem('oauth_redirect_path');
                  
                  setUser(fetchedUserData);
                  setIsAuthenticated(true);
                  setHasCompletedOnboarding(fetchedOnboardingStatus);
                  return;
                } else if (response.status === 401 || response.status === 403) {
                  // Token invalid, clear storage
                  console.log('⚠️ Token verification failed - clearing auth');
                  clearAuth();
                  return;
                } else if (response.status === 429) {
                  // Rate limited - wait a bit and retry
                  if (retries > 0) {
                    console.warn('⚠️ Rate limited during user data fetch, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries--;
                    continue;
                  } else {
                    // Out of retries, but token is still valid - clear and let user retry
                    console.warn('⚠️ Rate limited - too many retries, clearing auth');
                    clearAuth();
                    return;
                  }
                } else {
                  // Other error - retry if we have retries left
                  if (retries > 0) {
                    console.warn(`⚠️ Error ${response.status} fetching user data, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries--;
                    continue;
                  } else {
                    console.error(`⚠️ Failed to fetch user data after retries: ${response.status}`);
                    clearAuth();
                    return;
                  }
                }
              } catch (fetchError) {
                // Network error - retry if we have retries left
                if (retries > 0) {
                  console.warn('⚠️ Network error fetching user data, retrying...', fetchError);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  retries--;
                  continue;
                } else {
                  // Out of retries - clear auth
                  console.error('⚠️ Network error - failed after retries:', fetchError);
                  clearAuth();
                  return;
                }
              }
            }
          } else {
            // We have both token and userData - verify token is still valid
            // CRITICAL: Don't clear auth on network errors or rate limits - only on actual auth failures
          const isValid = await verifyToken(token);
          if (isValid) {
            setUser(userData);
            setIsAuthenticated(true);
            setHasCompletedOnboarding(onboardingStatus === 'true');
          } else {
              // Token invalid (401/403), clear storage
              console.log('⚠️ Token verification failed - clearing auth');
            clearAuth();
            }
          }
        }
      } catch (error) {
        // CRITICAL: Don't clear auth on network errors - user might just have connectivity issues
        // Only clear auth if we get a definitive auth failure
        console.error('Auth check error (non-fatal):', error);
        // Keep user authenticated if they have token and userData - might just be a network issue
        const token = StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN, null);
        const userData = StorageHelpers.getJSONItem(STORAGE_KEYS.USER_DATA, null);
        if (token && userData) {
          // Assume token is valid if we have both - network error, not auth failure
          console.log('⚠️ Network error during auth check - keeping user authenticated');
          setUser(userData);
          setIsAuthenticated(true);
          const onboardingStatus = StorageHelpers.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');
          setHasCompletedOnboarding(onboardingStatus === 'true');
        } else {
          // No token/userData, clear auth
        clearAuth();
        }
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
      
      // CRITICAL: 429 (rate limit) doesn't mean token is invalid
      // Only treat actual auth failures (401, 403) as invalid tokens
      if (response.status === 429) {
        console.warn('⚠️ Rate limited during token verification - token is still valid, keeping user authenticated');
        return true; // Token is valid, just rate limited
      }
      
      return response.ok;
    } catch (error) {
      // Network errors - assume token might still be valid, don't log out user
      // Only clear auth if we get a definitive auth failure response
      console.warn('⚠️ Network error during token verification - keeping user authenticated to prevent accidental logout');
      return true; // Assume token is valid on network errors to prevent accidental logout
    }
  };

  const clearAuth = () => {
    // ONLY clear authenticated user data - DO NOT touch guest data
    StorageHelpers.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    StorageHelpers.removeItem(STORAGE_KEYS.USER_DATA);
    StorageHelpers.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    StorageHelpers.removeItem(STORAGE_KEYS.QURAN_PROGRESS); // Auth user cache only
    // DO NOT clear GUEST_PROGRESS or GUEST_USER_NAME - they belong to guest mode
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
        // Handle rate limiting and other non-JSON errors
        if (response.status === 429) {
          // If user is already authenticated, log them out so they can try again
          if (isAuthenticated) {
            clearAuth();
            throw new Error('Too many requests. You have been logged out. Please wait a moment and try again.');
          }
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        // Try to parse as JSON, but handle non-JSON responses
        let error;
        try {
          error = await response.json();
        } catch (parseError) {
          // If response is not JSON, use status text
          throw new Error(response.statusText || 'Sign in failed');
        }
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
        // Handle rate limiting and other non-JSON errors
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        // Try to parse as JSON, but handle non-JSON responses
        let error;
        try {
          error = await response.json();
        } catch (parseError) {
          // If response is not JSON, use status text
          throw new Error(response.statusText || 'Sign up failed');
        }
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
    // CRITICAL: Clear all authenticated data completely
    // This ensures no auth data can leak into guest mode after logout
    console.log('🚪 Logging out - clearing all authenticated data');
    clearAuth();
    // Force a small delay to ensure state updates propagate
    // The App.js useEffect will handle switching to guest mode when isAuthenticated becomes false
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

