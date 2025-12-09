const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Cache keys
const CACHE_KEYS = {
  SURAHS: 'quran_api_cache_surahs',
  JUZS: 'quran_api_cache_juzs',
  SURAH_BY_JUZ: 'quran_api_cache_surah_by_juz_',
};

// Cache duration: 1 hour (3600000 ms)
const CACHE_DURATION = 60 * 60 * 1000;

class QuranApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.cache = new Map();
  }

  /**
   * Get cached data if available and not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/not found
   */
  getCached(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set cached data with timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCached(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all surahs (cached)
  async getSurahs() {
    const cacheKey = CACHE_KEYS.SURAHS;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }
    
    const data = await this.makeRequest('/surahs');
    this.setCached(cacheKey, data);
    return data;
  }

  // Get all Juzs (cached)
  async getJuzs() {
    const cacheKey = CACHE_KEYS.JUZS;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }
    
    const data = await this.makeRequest('/juzs');
    this.setCached(cacheKey, data);
    return data;
  }

  // Get surahs by Juz (cached)
  async getSurahsByJuz(juzNumber) {
    const cacheKey = `${CACHE_KEYS.SURAH_BY_JUZ}${juzNumber}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }
    
    const data = await this.makeRequest(`/surahs/by-juz/${juzNumber}`);
    this.setCached(cacheKey, data);
    return data;
  }

  // Get specific surah with verses
  async getSurah(id, font = 'uthmani') {
    return this.makeRequest(`/surah/${id}?font=${font}`);
  }

  // Get verses in specific font
  async getSurahVerses(id, font) {
    return this.makeRequest(`/surah/${id}/verses/${font}`);
  }

  // Get translation
  async getSurahTranslation(id) {
    return this.makeRequest(`/surah/${id}/translation`);
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }

  async getRandomVerse() {
    return this.makeRequest('/verses/random?translations=85,131&words=false');
  }
}

export default new QuranApiService();
