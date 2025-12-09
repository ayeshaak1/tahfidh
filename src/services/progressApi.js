/**
 * Progress API Service
 * Handles fetching and saving user progress to/from the backend database
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Fetch user progress from backend
 * @returns {Promise<Object>} User progress object
 */
export const fetchProgress = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/progress`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(`Failed to fetch progress: ${response.statusText}`);
    }

    const data = await response.json();
    return data.progress || {};
  } catch (error) {
    console.error('Error fetching progress from backend:', error);
    throw error;
  }
};

/**
 * Save user progress to backend
 * @param {Object} progress - User progress object
 * @returns {Promise<Object>} Updated progress object
 */
export const saveProgress = async (progress) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(`Failed to save progress: ${response.statusText}`);
    }

    const data = await response.json();
    return data.progress || progress;
  } catch (error) {
    console.error('Error saving progress to backend:', error);
    throw error;
  }
};

/**
 * Clear user progress from backend database
 * @returns {Promise<void>}
 */
export const clearProgress = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/progress`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(`Failed to clear progress: ${response.statusText}`);
    }

    return;
  } catch (error) {
    console.error('Error clearing progress from backend:', error);
    throw error;
  }
};

const progressApi = {
  fetchProgress,
  saveProgress,
  clearProgress,
};

export default progressApi;

