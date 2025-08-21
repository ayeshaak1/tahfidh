const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class QuranApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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

  // Get all surahs
  async getSurahs() {
    return this.makeRequest('/surahs');
  }

  // Get all Juzs
  async getJuzs() {
    return this.makeRequest('/juzs');
  }

  // Get surahs by Juz
  async getSurahsByJuz(juzNumber) {
    return this.makeRequest(`/surahs/by-juz/${juzNumber}`);
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
