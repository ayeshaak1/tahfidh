const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const { pool, initializeDatabase } = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Quran.com API configuration
const QURAN_API_CONFIG = {
  preProduction: {
    authUrl: 'https://prelive-oauth2.quran.foundation/oauth2/token',
    baseUrl: 'https://apis-prelive.quran.foundation/content/api/v4',
    clientId: process.env.QURAN_CLIENT_ID,
    clientSecret: process.env.QURAN_CLIENT_SECRET
  },
  production: {
    authUrl: 'https://oauth2.quran.foundation/oauth2/token',
    baseUrl: 'https://apis.quran.foundation/content/api/v4',
    clientId: process.env.QURAN_CLIENT_ID,
    clientSecret: process.env.QURAN_CLIENT_SECRET
  }
};

// Use pre-production for development
const API_CONFIG = QURAN_API_CONFIG.preProduction;

// Cache for access token
let accessToken = null;
let tokenExpiry = null;

// Cache for surah data
const surahCache = {
  // Cache for all surahs list
  allSurahs: {
    data: null,
    timestamp: null,
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Cache for individual surahs
  surahs: new Map(),
  surahTtl: 12 * 60 * 60 * 1000, // 12 hours
  
  // Cache for Juz-based surah lists
  juzSurahs: new Map(),
  juzTtl: 6 * 60 * 60 * 1000, // 6 hours
  
  // Cache for verses
  verses: new Map(),
  versesTtl: 6 * 60 * 60 * 1000, // 6 hours
  
  // Cache for translations
  translations: new Map(),
  translationTtl: 24 * 60 * 60 * 1000 // 24 hours
};

// Helper function to check if cache is valid
function isCacheValid(cacheEntry, ttl) {
  return cacheEntry && cacheEntry.timestamp && (Date.now() - cacheEntry.timestamp) < ttl;
}

// Helper function to get cache key for surah
function getSurahCacheKey(id, font) {
  return `surah_${id}_${font}`;
}

// Helper function to get cache key for Juz
function getJuzCacheKey(juzNumber) {
  return `juz_${juzNumber}`;
}

// Helper function to get cache key for verses
function getVersesCacheKey(id, font) {
  return `verses_${id}_${font}`;
}

// Helper function to get cache key for translation
function getTranslationCacheKey(id) {
  return `translation_${id}`;
}

// Get access token
async function getAccessToken() {
  try {
    // Check if we have a valid cached token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    const auth = Buffer.from(`${API_CONFIG.clientId}:${API_CONFIG.clientSecret}`).toString('base64');
    
    const response = await axios({
      method: 'post',
      url: API_CONFIG.authUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials&scope=content'
    });

    accessToken = response.data.access_token;
    // Set expiry to 1 hour from now (minus 5 minutes buffer)
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Quran API');
  }
}

// Helper function to make authenticated API calls
async function makeQuranApiCall(endpoint) {
  try {
    console.log(`Making Quran API call to: ${endpoint}`);
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${API_CONFIG.baseUrl}${endpoint}`,
      headers: {
        'x-auth-token': token,
        'x-client-id': API_CONFIG.clientId
      }
    });
    
    console.log(`API call successful for ${endpoint}, response status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`Quran API error for ${endpoint}:`, error.response?.data || error.message);
    throw new Error(`Failed to fetch data from Quran API: ${error.message}`);
  }
}

// API Routes

// Get all surahs/chapters
app.get('/api/surahs', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid(surahCache.allSurahs, surahCache.allSurahs.ttl)) {
      console.log('Returning cached surahs list');
      return res.json(surahCache.allSurahs.data);
    }
    
    console.log('Fetching surahs from Quran API...');
    const data = await makeQuranApiCall('/chapters');
    console.log('Quran API response:', JSON.stringify(data, null, 2));
    console.log(`Returning ${data.chapters ? data.chapters.length : 0} surahs`);
    
    // Cache the response
    surahCache.allSurahs.data = data;
    surahCache.allSurahs.timestamp = Date.now();
    console.log('Surahs list cached for 24 hours');
    
    res.json(data);
  } catch (error) {
    console.error('Error in /api/surahs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all Juzs
app.get('/api/juzs', async (req, res) => {
  try {
    console.log('Fetching Juzs from Quran API...');
    const data = await makeQuranApiCall('/juzs');
    console.log('Juzs API response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Error in /api/juzs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get surahs by Juz
app.get('/api/surahs/by-juz/:juzNumber', async (req, res) => {
  try {
    const { juzNumber } = req.params;
    const cacheKey = getJuzCacheKey(juzNumber);
    
    // Check cache first
    if (surahCache.juzSurahs.has(cacheKey)) {
      const cachedData = surahCache.juzSurahs.get(cacheKey);
      if (isCacheValid(cachedData, surahCache.juzTtl)) {
        console.log(`Returning cached Juz ${juzNumber} data`);
        return res.json(cachedData.data);
      } else {
        // Remove expired cache entry
        surahCache.juzSurahs.delete(cacheKey);
      }
    }
    
    console.log(`Fetching verses for Juz ${juzNumber} from Quran API...`);
    
    // Get verses for the specific Juz with smart pagination
    let currentPage = 1;
    let hasMorePages = true;
    let uniqueSurahIds = new Set();
    let consecutivePagesWithoutNewSurahs = 0;
    const maxConsecutivePagesWithoutNewSurahs = 2; // Stop after 2 pages with no new surahs
    const maxPagesToCheck = 5; // Maximum pages to check to prevent infinite loops
    const startTime = Date.now();
    const maxTimeMs = 10000; // 10 second timeout
    
    while (hasMorePages && 
           consecutivePagesWithoutNewSurahs < maxConsecutivePagesWithoutNewSurahs && 
           currentPage <= maxPagesToCheck &&
           (Date.now() - startTime) < maxTimeMs) {
      
      const versesData = await makeQuranApiCall(`/verses/by_juz/${juzNumber}?page=${currentPage}&per_page=50`);
      
      if (!versesData.verses || versesData.verses.length === 0) {
        break;
      }
      
      const pageStartCount = uniqueSurahIds.size;
      
      // Process verses and collect unique surah IDs
      versesData.verses.forEach(verse => {
        if (verse.verse_key) {
          const parts = verse.verse_key.split(':');
          if (parts.length >= 1) {
            const surahId = parseInt(parts[0]);
            if (!isNaN(surahId)) {
              uniqueSurahIds.add(surahId);
            }
          }
        }
      });
      
      const pageEndCount = uniqueSurahIds.size;
      const newSurahsFound = pageEndCount - pageStartCount;
      
      console.log(`Page ${currentPage}: ${versesData.verses.length} verses, ${newSurahsFound} new surahs found`);
      
      if (newSurahsFound === 0) {
        consecutivePagesWithoutNewSurahs++;
        console.log(`No new surahs found on page ${currentPage}. Consecutive count: ${consecutivePagesWithoutNewSurahs}`);
      } else {
        consecutivePagesWithoutNewSurahs = 0; // Reset counter when we find new surahs
      }
      
      // Check if there are more pages
      hasMorePages = versesData.pagination && versesData.pagination.next_page;
      currentPage++;
      
      // Early exit: if we've found all 114 surahs, we can stop
      if (uniqueSurahIds.size >= 114) {
        console.log('Found all 114 surahs, stopping pagination');
        break;
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Processing completed in ${totalTime}ms. Pages checked: ${currentPage - 1}, Unique surahs found: ${uniqueSurahIds.size}`);
    
    if (uniqueSurahIds.size === 0) {
      console.log('No surahs found for Juz', juzNumber);
      return res.json({ surahs: [] });
    }
    
    const surahIds = Array.from(uniqueSurahIds).sort((a, b) => a - b);
    console.log('Unique surah IDs found:', surahIds);
    
    // Fetch surah details for each unique surah ID (only once per surah)
    const surahsData = [];
    for (const surahId of surahIds) {
      try {
        console.log(`Fetching surah ${surahId}...`);
        const surahData = await makeQuranApiCall(`/chapters/${surahId}`);
        if (surahData.chapter) {
          surahsData.push(surahData.chapter);
          console.log(`Successfully fetched surah ${surahId}: ${surahData.chapter.name_simple}`);
        }
      } catch (err) {
        console.error(`Failed to fetch surah ${surahId}:`, err);
      }
    }
    
    const responseData = { surahs: surahsData };
    
    // Cache the response
    surahCache.juzSurahs.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    console.log(`Juz ${juzNumber} data cached for 6 hours`);
    
    console.log(`Returning ${surahsData.length} unique surahs for Juz ${juzNumber}`);
    res.json(responseData);
  } catch (error) {
    console.error('Error in /api/surahs/by-juz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific surah with verses
app.get('/api/surah/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { font = 'uthmani', clearCache = false, forceRefresh = false } = req.query;
    const cacheKey = getSurahCacheKey(id, font);
    
    // Check cache first (unless clearCache or forceRefresh is requested)
    if (!clearCache && !forceRefresh && surahCache.surahs.has(cacheKey)) {
      const cachedData = surahCache.surahs.get(cacheKey);
      if (isCacheValid(cachedData, surahCache.surahTtl)) {
        console.log(`Returning cached surah ${id} (${font}) data`);
        return res.json(cachedData.data);
      } else {
        // Remove expired cache entry
        surahCache.surahs.delete(cacheKey);
        console.log(`Expired cache entry removed for surah ${id} (${font})`);
      }
    }
    
    if (clearCache || forceRefresh) {
      console.log(`Cache cleared for surah ${id} (${font})`);
      surahCache.surahs.delete(cacheKey);
    }
    
    // Force clear cache for testing new resource IDs and prevent overlap
    if (id === '1') {
      console.log(`Forcing cache clear for surah 1 to test new resource IDs and prevent overlap`);
      surahCache.surahs.delete(cacheKey);
      
      // Also clear any other cache entries that might overlap
      for (const [key, value] of surahCache.surahs.entries()) {
        if (key.includes('surah_1_')) {
          surahCache.surahs.delete(key);
          console.log(`Cleared overlapping cache entry: ${key}`);
        }
      }
    }
    
    // Always clear cache when switching fonts to ensure fresh data
    if (surahCache.surahs.has(cacheKey)) {
      console.log(`Clearing cache for surah ${id} with font ${font} to ensure fresh data`);
      surahCache.surahs.delete(cacheKey);
    }
    
    console.log(`Fetching surah ${id} with font ${font} from Quran API...`);
    
    // Get surah info
    const surahData = await makeQuranApiCall(`/chapters/${id}`);
    
    // Get Juz information for this surah
    let juzInfo = null;
    try {
      // Get all Juzs and find which one contains this surah
      const juzsResponse = await makeQuranApiCall('/juzs');
      console.log(`Juzs response for surah ${id}:`, JSON.stringify(juzsResponse, null, 2));
      
      if (juzsResponse.juzs) {
        console.log(`Found ${juzsResponse.juzs.length} Juzs in response`);
        
        for (const juz of juzsResponse.juzs) {
          console.log(`Checking Juz ${juz.juz_number}:`, juz.verse_mapping);
          
          if (juz.verse_mapping && typeof juz.verse_mapping === 'object') {
            // The verse_mapping is an object like { "1": "1-7", "2": "1-141" }
            // Check if this surah is in this Juz
            const surahId = parseInt(id);
            const juzSurahs = Object.keys(juz.verse_mapping).map(s => parseInt(s)).sort((a, b) => a - b);
            console.log(`Juz ${juz.juz_number} contains surahs:`, juzSurahs);
            
            if (juz.verse_mapping[surahId]) {
              juzInfo = { juz_number: juz.juz_number };
              console.log(`✅ Surah ${id} belongs to Juz ${juz.juz_number} (found in verse_mapping)`);
              break;
            }
          } else {
            console.log(`Juz ${juz.juz_number} has no valid verse_mapping:`, juz.verse_mapping);
          }
        }
      } else {
        console.log(`No 'juzs' property found in response:`, Object.keys(juzsResponse));
      }
      
      if (!juzInfo) {
        console.log(`❌ Could not determine Juz for surah ${id} from API`);
      }
    } catch (err) {
      console.log(`❌ Could not determine Juz for surah ${id}:`, err.message);
    }
    
    // Log the final Juz result
    if (juzInfo) {
      console.log(`🎯 Final Juz result for surah ${id}: Juz ${juzInfo.juz_number}`);
    } else {
      console.log(`⚠️ No Juz information found for surah ${id}`);
    }
    
    // Get verses in both fonts simultaneously (14. Load fonts together)
    console.log(`Fetching verses for surah ${id} in both Uthmani and IndoPak fonts...`);
    const [uthmaniData, indopakData] = await Promise.all([
      makeQuranApiCall(`/quran/verses/uthmani?chapter_number=${id}`),
      makeQuranApiCall(`/quran/verses/indopak?chapter_number=${id}`)
    ]);
    
    console.log(`Uthmani verses for surah ${id}:`, uthmaniData.verses?.length || 0, 'verses');
    console.log(`IndoPak verses for surah ${id}:`, indopakData.verses?.length || 0, 'verses');
    
    // Merge verses with both font texts
    const mergedVerses = (uthmaniData.verses || []).map((uthmaniVerse, index) => {
      const indopakVerse = indopakData.verses?.[index];
      return {
        ...uthmaniVerse,
        text_uthmani: uthmaniVerse.text_uthmani || uthmaniVerse.text,
        text_indopak: indopakVerse?.text_indopak || indopakVerse?.text || null
      };
    });
    
    console.log(`Merged ${mergedVerses.length} verses with both fonts for surah ${id}`);
    
    // Log sample verse data to see font fields
    if (mergedVerses.length > 0) {
      console.log(`Sample merged verse data for surah ${id}:`, {
        verse_key: mergedVerses[0].verse_key,
        text_uthmani: mergedVerses[0].text_uthmani ? 'Available' : 'Not Available',
        text_indopak: mergedVerses[0].text_indopak ? 'Available' : 'Not Available',
        text: mergedVerses[0].text ? 'Available' : 'Not Available',
        uthmani_length: mergedVerses[0].text_uthmani?.length || 0,
        indopak_length: mergedVerses[0].text_indopak?.length || 0,
        has_diacritics: mergedVerses[0].text_uthmani ? mergedVerses[0].text_uthmani.includes('َ') || mergedVerses[0].text_uthmani.includes('ِ') || mergedVerses[0].text_uthmani.includes('ُ') : 'N/A'
      });
    }
    
    // Get translation (try multiple resource IDs until we find one that works)
    let translationData = { translations: [] };
    try {
      // Try multiple resource IDs for English translations - prioritize Clear Quran (131), then fallback to Abdul Haleem (85)
      const translationResourceIds = [131, 85, 57, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Start with 131 (Clear Quran), then 85 (Abdul Haleem), then 57 (English), then others
      let response = null;
      let workingResourceId = null;
      
      for (const resourceId of translationResourceIds) {
        try {
          console.log(`Trying translation resource ID ${resourceId}...`);
          response = await makeQuranApiCall(`/translations/${resourceId}/by_chapter/${id}`);
          console.log(`Translation resource ${resourceId} response:`, JSON.stringify(response, null, 2));
          
          if (response.translations && response.translations.length > 0) {
            workingResourceId = resourceId;
            console.log(`✅ Found working translation resource ID: ${resourceId}`);
            break;
          } else {
            console.log(`❌ Resource ${resourceId} has no translations`);
          }
        } catch (err) {
          console.log(`❌ Resource ${resourceId} failed: ${err.message}`);
        }
      }
      
      if (workingResourceId && response && response.translations && response.translations.length > 0) {
        // Map the translations to include verse_key for frontend matching
        const mappedTranslations = response.translations.map((translation, index) => ({
          ...translation,
          verse_key: `${id}:${index + 1}`,
          verse_number: index + 1
        }));
        translationData = { translations: mappedTranslations };
        console.log(`Found ${response.translations.length} translations using resource ID ${workingResourceId}`);
        console.log(`Translation source: ${workingResourceId === 131 ? 'Clear Quran (Dr. Mustafa Khattab)' : workingResourceId === 85 ? 'Abdul Haleem (English)' : `Resource ${workingResourceId}`}`);
        console.log(`Mapped translations:`, JSON.stringify(mappedTranslations, null, 2));
      } else {
        console.log(`No translations found for surah ${id} with any resource ID`);
      }
    } catch (err) {
      console.error(`Failed to fetch translation for surah ${id}:`, err);
    }
    
    // Get transliteration (English transliteration - resource ID 57)
    let transliterationData = { translations: [] };
    try {
      // Use resource ID 57 for English transliteration
      const response = await makeQuranApiCall(`/translations/57/by_chapter/${id}`);
      console.log(`Transliteration response for surah ${id} (resource 57):`, JSON.stringify(response, null, 2));
      
      if (response.translations && response.translations.length > 0) {
        // Map the transliterations to include verse_key for frontend matching
        const mappedTransliterations = response.translations.map((transliteration, index) => ({
          ...transliteration,
          verse_key: `${id}:${index + 1}`,
          verse_number: index + 1
        }));
        transliterationData = { translations: mappedTransliterations };
        console.log(`Found ${response.translations.length} transliterations for surah ${id}`);
        console.log(`Mapped transliterations:`, JSON.stringify(mappedTransliterations, null, 2));
      } else {
        console.log(`No transliterations found for surah ${id} with resource 57`);
      }
    } catch (err) {
      console.error(`Failed to fetch transliteration for surah ${id}:`, err);
    }
    
    // Combine the data with merged verses containing both fonts
    const surah = {
      ...surahData.chapter,
      verses: mergedVerses,
      translation: translationData.translations || [],
      transliteration: transliterationData.translations || [],
      juz: juzInfo // Add juz info to the surah object
    };
    
    console.log(`Final surah data structure:`, {
      id: surah.id,
      name: surah.name_simple,
      versesCount: surah.verses?.length || 0,
      translationCount: surah.translation?.length || 0,
      transliterationCount: surah.transliteration?.length || 0
    });
    
    // Cache the response
    surahCache.surahs.set(cacheKey, {
      data: surah,
      timestamp: Date.now()
    });
    console.log(`Surah ${id} (${font}) data cached for 12 hours`);
    
    res.json(surah);
  } catch (error) {
    console.error('Error fetching surah:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get verses in specific font
app.get('/api/surah/:id/verses/:font', async (req, res) => {
  try {
    const { id, font } = req.params;
    const data = await makeQuranApiCall(`/quran/verses/${font}?chapter_number=${id}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get translation
app.get('/api/surah/:id/translation', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await makeQuranApiCall(`/quran/translations/131?chapter_number=${id}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check available translations
app.get('/api/test/translations', async (req, res) => {
  try {
    console.log('Testing available translations...');
    
    // First, get the list of available translations
    let availableTranslations = [];
    try {
      console.log('Fetching available translations list...');
      const translationsList = await makeQuranApiCall('/resources/translations');
      console.log('Available translations list:', JSON.stringify(translationsList, null, 2));
      availableTranslations = translationsList.translations || [];
    } catch (err) {
      console.error('Failed to get translations list:', err);
    }
    
    // Test different translation endpoints for surah 1
    const testEndpoints = [
      '/translations/131/by_chapter/1',  // Clear Quran translation
      '/translations/57/by_chapter/1',   // English transliteration
      '/quran/translations/131?chapter_number=1',
      '/quran/translations/57?chapter_number=1'
    ];
    
    const results = {};
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const response = await makeQuranApiCall(endpoint);
        results[endpoint] = {
          success: true,
          data: response,
          translationsCount: response.translations ? response.translations.length : 0,
          hasTranslations: response.translations && response.translations.length > 0
        };
        console.log(`Endpoint ${endpoint} result:`, JSON.stringify(response, null, 2));
      } catch (err) {
        results[endpoint] = {
          success: false,
          error: err.message
        };
        console.error(`Endpoint ${endpoint} failed:`, err);
      }
    }
    
    // Test a few specific resource IDs that might work
    const specificResourceIds = [57, 131]; // Focus on transliteration (57) and Clear Quran (131)
    const resourceResults = {};
    
    for (const resourceId of specificResourceIds) {
      try {
        console.log(`Testing resource ID: ${resourceId}`);
        const response = await makeQuranApiCall(`/translations/${resourceId}/by_chapter/1`);
        
        testResults[resourceId] = {
          success: true,
          translationsCount: response.translations ? response.translations.length : 0,
          hasTranslations: response.translations && response.translations.length > 0,
          pagination: response.pagination
        };
      } catch (err) {
        resourceResults[resourceId] = {
          success: false,
          error: err.message
        };
      }
    }
    
    res.json({
      message: 'Translation endpoint test results',
      availableTranslations: availableTranslations.slice(0, 10), // Show first 10
      endpointResults: results,
      resourceResults,
      summary: {
        totalEndpoints: testEndpoints.length,
        successfulEndpoints: Object.values(results).filter(r => r.success).length,
        failedEndpoints: Object.values(results).filter(r => !r.success).length,
        endpointsWithTranslations: Object.values(results).filter(r => r.success && r.hasTranslations).length,
        totalResources: specificResourceIds.length,
        resourcesWithTranslations: Object.values(resourceResults).filter(r => r.success && r.hasTranslations).length
      }
    });
  } catch (error) {
    console.error('Error testing translations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint to check if translations work at all
app.get('/api/test/simple', async (req, res) => {
  try {
    console.log('Running simple translation test...');
    
    // Test 1: Get available translations
    let translationsList = null;
    try {
      translationsList = await makeQuranApiCall('/resources/translations');
      console.log('Translations list response:', JSON.stringify(translationsList, null, 2));
    } catch (err) {
      console.error('Failed to get translations list:', err);
    }
    
    // Test 2: Try to get any translation for surah 1
    let anyTranslation = null;
    try {
      anyTranslation = await makeQuranApiCall('/translations/131/by_chapter/1');
      console.log('Any translation response:', JSON.stringify(anyTranslation, null, 2));
    } catch (err) {
      console.error('Failed to get any translation:', err);
    }
    
    // Test 3: Try to get verses with translations
    let versesWithTranslations = null;
    try {
      versesWithTranslations = await makeQuranApiCall('/quran/verses/uthmani?chapter_number=1&translations=131');
      console.log('Verses with translations response:', JSON.stringify(versesWithTranslations, null, 2));
    } catch (err) {
      console.error('Failed to get verses with translations:', err);
    }
    
    res.json({
      message: 'Simple translation test results',
      translationsList: translationsList ? {
        hasData: !!translationsList.translations,
        count: translationsList.translations ? translationsList.translations.length : 0,
        sample: translationsList.translations ? translationsList.translations.slice(0, 3) : []
      } : null,
      anyTranslation: anyTranslation ? {
        hasData: !!anyTranslation.translations,
        count: anyTranslation.translations ? anyTranslation.translations.length : 0,
        pagination: anyTranslation.pagination
      } : null,
      versesWithTranslations: versesWithTranslations ? {
        hasData: !!versesWithTranslations.verses,
        verseCount: versesWithTranslations.verses ? versesWithTranslations.verses.length : 0,
        hasTranslations: !!versesWithTranslations.translations
      } : null
    });
  } catch (error) {
    console.error('Error in simple test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check translation API specifically
app.get('/api/test/translation-131', async (req, res) => {
  try {
    console.log('Testing translation API for resource 131...');
    
    // Test different approaches for surah 1
    const testResults = {};
    
    // Test 1: Direct endpoint
    try {
      const response1 = await makeQuranApiCall('/translations/131/by_chapter/1');
      testResults.approach1 = {
        success: true,
        translationsCount: response1.translations ? response1.translations.length : 0,
        hasTranslations: response1.translations && response1.translations.length > 0,
        data: response1
      };
    } catch (err) {
      testResults.approach1 = {
        success: false,
        error: err.message
      };
    }
    
    // Test 2: Alternative endpoint
    try {
      const response2 = await makeQuranApiCall('/quran/translations/131?chapter_number=1');
      testResults.approach2 = {
        success: true,
        translationsCount: response2.translations ? response2.translations.length : 0,
        hasTranslations: response2.translations && response2.translations.length > 0,
        data: response2
      };
    } catch (err) {
      testResults.approach2 = {
        success: false,
        error: err.message
      };
    }
    
    // Test 3: Verses with translations
    try {
      const response3 = await makeQuranApiCall('/quran/verses/uthmani?chapter_number=1&translations=131');
      testResults.approach3 = {
        success: true,
        versesCount: response3.verses ? response3.verses.length : 0,
        hasTranslations: response3.translations && response3.translations.length > 0,
        data: response3
      };
    } catch (err) {
      testResults.approach3 = {
        success: false,
        error: err.message
      };
    }
    
    // Test 4: Check if resource 131 exists
    try {
      const resourcesResponse = await makeQuranApiCall('/resources/translations');
      const resource131 = resourcesResponse.translations?.find(r => r.id === 131);
      testResults.resource131 = {
        exists: !!resource131,
        details: resource131
      };
    } catch (err) {
      testResults.resource131 = {
        exists: false,
        error: err.message
      };
    }
    
    res.json({
      message: 'Translation API test results for resource 131',
      testResults,
      summary: {
        totalApproaches: 3,
        successfulApproaches: Object.values(testResults).filter(r => r.success !== undefined && r.success).length,
        hasTranslations: Object.values(testResults).filter(r => r.hasTranslations).length > 0,
        resource131Exists: testResults.resource131?.exists || false
      }
    });
  } catch (error) {
    console.error('Error testing translation API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive endpoint to list all translation resources and find Clear Quran
app.get('/api/test/all-translations', async (req, res) => {
  try {
    console.log('🔍 Fetching ALL available translation resources...');
    
    // Get all available translations
    let allTranslations = [];
    try {
      const resourcesResponse = await makeQuranApiCall('/resources/translations');
      allTranslations = resourcesResponse.translations || [];
      console.log(`📊 Found ${allTranslations.length} total translation resources`);
    } catch (err) {
      console.error('❌ Failed to get translations list:', err);
      return res.status(500).json({ error: 'Failed to fetch translations list' });
    }
    
    // Filter for English translations
    const englishTranslations = allTranslations.filter(t => 
      t.language_name && t.language_name.toLowerCase().includes('english')
    );
    
    // Look specifically for Clear Quran
    const clearQuran = allTranslations.filter(t => 
      t.resource_name && (
        t.resource_name.toLowerCase().includes('clear') ||
        t.resource_name.toLowerCase().includes('khattab') ||
        t.resource_name.toLowerCase().includes('mustafa')
      )
    );
    
    // Look for other common English translations
    const commonEnglish = allTranslations.filter(t => 
      t.language_name && t.language_name.toLowerCase().includes('english') &&
      t.resource_name && (
        t.resource_name.toLowerCase().includes('pickthall') ||
        t.resource_name.toLowerCase().includes('yusuf ali') ||
        t.resource_name.toLowerCase().includes('hilali') ||
        t.resource_name.toLowerCase().includes('saheeh') ||
        t.resource_name.toLowerCase().includes('sahih')
      )
    );
    
    console.log(`🇺🇸 Found ${englishTranslations.length} English translations`);
    console.log(`📖 Found ${clearQuran.length} Clear Quran translations`);
    console.log(`🔤 Found ${commonEnglish.length} common English translations`);
    
    // Test a few promising resource IDs for surah 1
    const testResourceIds = [];
    
    // Add Clear Quran IDs first
    clearQuran.forEach(t => testResourceIds.push(t.id));
    
    // Add common English IDs
    commonEnglish.forEach(t => testResourceIds.push(t.id));
    
    // Add first 20 English translations
    englishTranslations.slice(0, 20).forEach(t => {
      if (!testResourceIds.includes(t.id)) {
        testResourceIds.push(t.id);
      }
    });
    
    // Add some low-numbered IDs as fallback
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(id => {
      if (!testResourceIds.includes(id)) {
        testResourceIds.push(id);
      }
    });
    
    console.log(`🧪 Will test ${testResourceIds.length} resource IDs:`, testResourceIds);
    
    const testResults = {};
    
    for (const resourceId of testResourceIds) {
      try {
        console.log(`\n🔍 Testing resource ID ${resourceId}...`);
        const response = await makeQuranApiCall(`/translations/${resourceId}/by_chapter/1`);
        
        testResults[resourceId] = {
          success: true,
          translationsCount: response.translations ? response.translations.length : 0,
          hasTranslations: response.translations && response.translations.length > 0,
          pagination: response.pagination,
          sampleTranslation: response.translations && response.translations.length > 0 ? response.translations[0] : null
        };
        
        if (response.translations && response.translations.length > 0) {
          console.log(`✅ Resource ${resourceId} has ${response.translations.length} translations`);
          console.log(`📝 Sample: "${response.translations[0].text.substring(0, 100)}..."`);
        } else {
          console.log(`❌ Resource ${resourceId} has no translations (but API call succeeded)`);
        }
      } catch (err) {
        testResults[resourceId] = {
          success: false,
          error: err.message
        };
        console.log(`❌ Resource ${resourceId} failed: ${err.message}`);
      }
    }
    
    // Find the best working English translation
    let bestTranslation = null;
    for (const [resourceId, result] of Object.entries(testResults)) {
      if (result.success && result.hasTranslations) {
        const resource = allTranslations.find(t => t.id === parseInt(resourceId));
        if (resource && resource.language_name && resource.language_name.toLowerCase().includes('english')) {
          bestTranslation = { resourceId: parseInt(resourceId), resource, result };
          console.log(`🏆 Best working English translation: Resource ${resourceId} - ${resource.resource_name}`);
          break;
        }
      }
    }
    
    // Summary
    const workingResources = Object.entries(testResults).filter(([id, result]) => 
      result.success && result.hasTranslations
    );
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total resources tested: ${testResourceIds.length}`);
    console.log(`Working resources: ${workingResources.length}`);
    console.log(`Resources with translations: ${workingResources.length}`);
    
    if (bestTranslation) {
      console.log(`🎯 Best translation: Resource ${bestTranslation.resourceId} - ${bestTranslation.resource.resource_name}`);
    } else {
      console.log(`⚠️ No working English translations found!`);
    }
    
    res.json({
      message: 'Comprehensive translation resources test',
      totalResources: allTranslations.length,
      englishTranslations: englishTranslations.slice(0, 30), // Show first 30
      clearQuran: clearQuran,
      commonEnglish: commonEnglish,
      testResults,
      bestTranslation,
      workingResources: workingResources.map(([id, result]) => ({
        resourceId: parseInt(id),
        resource: allTranslations.find(t => t.id === parseInt(id)),
        result
      })),
      summary: {
        totalTested: testResourceIds.length,
        successful: Object.values(testResults).filter(r => r.success).length,
        withTranslations: workingResources.length,
        bestEnglishTranslation: bestTranslation ? {
          resourceId: bestTranslation.resourceId,
          name: bestTranslation.resource.resource_name,
          language: bestTranslation.resource.language_name
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Error in comprehensive translation test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint to check what's available
app.get('/api/test/quick', async (req, res) => {
  try {
    console.log('Quick test of available resources...');
    
    // Test 1: Get available translations list
    let translationsList = null;
    try {
      translationsList = await makeQuranApiCall('/resources/translations');
      console.log('Translations list:', translationsList.translations?.slice(0, 5));
    } catch (err) {
      console.error('Failed to get translations list:', err);
    }
    
    // Test 2: Try resource 1 (often the default)
    let resource1 = null;
    try {
      resource1 = await makeQuranApiCall('/translations/1/by_chapter/1');
      console.log('Resource 1 test:', resource1);
    } catch (err) {
      console.error('Resource 1 failed:', err);
    }
    
    // Test 3: Try resource 2
    let resource2 = null;
    try {
      resource2 = await makeQuranApiCall('/translations/2/by_chapter/1');
      console.log('Resource 2 test:', resource2);
    } catch (err) {
      console.error('Resource 2 failed:', err);
    }
    
    res.json({
      message: 'Quick test results',
      translationsList: translationsList ? {
        total: translationsList.translations?.length || 0,
        first5: translationsList.translations?.slice(0, 5) || []
      } : null,
      resource1: resource1 ? {
        success: true,
        hasTranslations: resource1.translations && resource1.translations.length > 0,
        count: resource1.translations?.length || 0
      } : { success: false },
      resource2: resource2 ? {
        success: true,
        hasTranslations: resource2.translations && resource2.translations.length > 0,
        count: resource2.translations?.length || 0
      } : { success: false }
    });
  } catch (error) {
    console.error('Error in quick test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick test for resource 85 (Abdul Haleem)
app.get('/api/test/resource-85', async (req, res) => {
  try {
    console.log('🧪 Testing resource 85 (Abdul Haleem)...');
    
    const response = await makeQuranApiCall('/translations/85/by_chapter/1');
    console.log('Resource 85 response:', JSON.stringify(response, null, 2));
    
    res.json({
      message: 'Resource 85 test result',
      success: true,
      hasTranslations: response.translations && response.translations.length > 0,
      translationsCount: response.translations ? response.translations.length : 0,
      pagination: response.pagination,
      sampleTranslation: response.translations && response.translations.length > 0 ? response.translations[0] : null,
      fullResponse: response
    });
  } catch (error) {
    console.error('❌ Error testing resource 85:', error);
    res.status(500).json({ 
      message: 'Resource 85 test failed',
      success: false,
      error: error.message 
    });
  }
});

// Test endpoint to check Juzs API response
app.get('/api/test/juzs', async (req, res) => {
  try {
    console.log('🧪 Testing Juzs API endpoint...');
    
    const juzsResponse = await makeQuranApiCall('/juzs');
    console.log('Juzs API response:', JSON.stringify(juzsResponse, null, 2));
    
    res.json({
      message: 'Juzs API test result',
      success: true,
      response: juzsResponse,
      hasJuzs: !!juzsResponse.juzs,
      juzsCount: juzsResponse.juzs ? juzsResponse.juzs.length : 0,
      sampleJuz: juzsResponse.juzs && juzsResponse.juzs.length > 0 ? juzsResponse.juzs[0] : null
    });
  } catch (error) {
    console.error('❌ Error testing Juzs API:', error);
    res.status(500).json({ 
      message: 'Juzs API test failed',
      success: false,
      error: error.message 
    });
  }
});

// Get random verse
app.get('/api/verses/random', async (req, res) => {
  try {
    const { translations = '85,131' } = req.query;
    console.log('Fetching random verse with endpoint:', `/verses/random?translations=${translations}&words=true`);
    const data = await makeQuranApiCall(`/verses/random?translations=${translations}&words=true`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching random verse:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Cache management endpoints
app.get('/api/cache/status', (req, res) => {
  const cacheStatus = {
    allSurahs: {
      cached: surahCache.allSurahs.data !== null,
      timestamp: surahCache.allSurahs.timestamp,
      age: surahCache.allSurahs.timestamp ? Date.now() - surahCache.allSurahs.timestamp : null
    },
    surahs: {
      count: surahCache.surahs.size,
      ttl: surahCache.surahTtl
    },
    juzSurahs: {
      count: surahCache.juzSurahs.size,
      ttl: surahCache.juzTtl
    },
    verses: {
      count: surahCache.verses.size,
      ttl: surahCache.versesTtl
    },
    translations: {
      count: surahCache.translations.size,
      ttl: surahCache.translationTtl
    }
  };
  
  res.json(cacheStatus);
});

app.post('/api/cache/clear', (req, res) => {
  try {
    // Clear all caches
    surahCache.allSurahs.data = null;
    surahCache.allSurahs.timestamp = null;
    surahCache.surahs.clear();
    surahCache.juzSurahs.clear();
    surahCache.verses.clear();
    surahCache.translations.clear();
    
    console.log('All caches cleared');
    res.json({ message: 'All caches cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.post('/api/cache/clear/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    switch (type) {
      case 'surahs':
        surahCache.surahs.clear();
        console.log('Surahs cache cleared');
        break;
      case 'juz':
        surahCache.juzSurahs.clear();
        console.log('Juz surahs cache cleared');
        break;
      case 'verses':
        surahCache.verses.clear();
        console.log('Verses cache cleared');
        break;
      case 'translations':
        surahCache.translations.clear();
        console.log('Translations cache cleared');
        break;
      case 'all':
        surahCache.allSurahs.data = null;
        surahCache.allSurahs.timestamp = null;
        surahCache.surahs.clear();
        surahCache.juzSurahs.clear();
        surahCache.verses.clear();
        surahCache.translations.clear();
        console.log('All caches cleared');
        break;
      default:
        return res.status(400).json({ error: 'Invalid cache type. Use: surahs, juz, verses, translations, or all' });
    }
    
    res.json({ message: `${type} cache cleared successfully` });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Simple endpoint to list all available translation resources
app.get('/api/test/list-translations', async (req, res) => {
  try {
    console.log('📋 Listing all available translation resources...');
    
    // Get all available translations
    let allTranslations = [];
    try {
      const resourcesResponse = await makeQuranApiCall('/resources/translations');
      allTranslations = resourcesResponse.translations || [];
      console.log(`📊 Found ${allTranslations.length} total translation resources`);
    } catch (err) {
      console.error('❌ Failed to get translations list:', err);
      return res.status(500).json({ error: 'Failed to fetch translations list' });
    }
    
    // Filter for English translations
    const englishTranslations = allTranslations.filter(t => 
      t.language_name && t.language_name.toLowerCase().includes('english')
    );
    
    // Look specifically for Clear Quran
    const clearQuran = allTranslations.filter(t => 
      t.resource_name && (
        t.resource_name.toLowerCase().includes('clear') ||
        t.resource_name.toLowerCase().includes('khattab') ||
        t.resource_name.toLowerCase().includes('mustafa')
      )
    );
    
    // Look for other common English translations
    const commonEnglish = allTranslations.filter(t => 
      t.language_name && t.language_name.toLowerCase().includes('english') &&
      t.resource_name && (
        t.resource_name.toLowerCase().includes('pickthall') ||
        t.resource_name.toLowerCase().includes('yusuf ali') ||
        t.resource_name.toLowerCase().includes('hilali') ||
        t.resource_name.toLowerCase().includes('saheeh') ||
        t.resource_name.toLowerCase().includes('sahih')
      )
    );
    
    console.log(`🇺🇸 Found ${englishTranslations.length} English translations`);
    console.log(`📖 Found ${clearQuran.length} Clear Quran translations`);
    console.log(`🔤 Found ${commonEnglish.length} common English translations`);
    
    // Show first 50 translations for reference
    const sampleTranslations = allTranslations.slice(0, 50).map(t => ({
      id: t.id,
      resource_name: t.resource_name,
      language_name: t.language_name,
      author_name: t.author_name
    }));
    
    res.json({
      message: 'All available translation resources',
      note: 'Clear Quran (Dr. Mustafa Khattab) is prioritized as primary translation. Abdul Haleem (Resource 85) serves as fallback if Clear Quran is unavailable.',
      totalResources: allTranslations.length,
      englishTranslations: englishTranslations.map(t => ({
        id: t.id,
        resource_name: t.resource_name,
        language_name: t.language_name,
        author_name: t.author_name
      })),
      clearQuran: clearQuran.map(t => ({
        id: t.id,
        resource_name: t.resource_name,
        language_name: t.language_name,
        author_name: t.author_name
      })),
      commonEnglish: commonEnglish.map(t => ({
        id: t.id,
        resource_name: t.resource_name,
        language_name: t.language_name,
        author_name: t.author_name
      })),
      sampleTranslations,
      summary: {
        total: allTranslations.length,
        english: englishTranslations.length,
        clearQuran: clearQuran.length,
        commonEnglish: commonEnglish.length
      }
    });
  } catch (error) {
    console.error('❌ Error listing translation resources:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Quran API proxy server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: ${API_CONFIG.baseUrl}`);
  console.log('Caching enabled with the following TTLs:');
  console.log(`  - All Surahs: 24 hours`);
  console.log(`  - Individual Surahs: 12 hours`);
  console.log(`  - Juz-based Surahs: 6 hours`);
  console.log(`  - Verses: 6 hours`);
  console.log(`  - Translations: 24 hours`);
  
  // Initialize database
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
});

// Cache cleanup job - run every hour
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  // Clean expired surahs
  for (const [key, value] of surahCache.surahs.entries()) {
    if (!isCacheValid(value, surahCache.surahTtl)) {
      surahCache.surahs.delete(key);
      cleanedCount++;
    }
  }
  
  // Clean expired Juz surahs
  for (const [key, value] of surahCache.juzSurahs.entries()) {
    if (!isCacheValid(value, surahCache.juzTtl)) {
      surahCache.juzSurahs.delete(key);
      cleanedCount++;
    }
  }
  
  // Clean expired verses
  for (const [key, value] of surahCache.verses.entries()) {
    if (!isCacheValid(value, surahCache.versesTtl)) {
      surahCache.verses.delete(key);
      cleanedCount++;
    }
  }
  
  // Clean expired translations
  for (const [key, value] of surahCache.translations.entries()) {
    if (!isCacheValid(value, surahCache.translationTtl)) {
      surahCache.translations.delete(key);
      cleanedCount++;
    }
  }
  
  // Clean expired all surahs cache
  if (surahCache.allSurahs.data && !isCacheValid(surahCache.allSurahs, surahCache.allSurahs.ttl)) {
    surahCache.allSurahs.data = null;
    surahCache.allSurahs.timestamp = null;
    cleanedCount++;
  }
  
  if (cleanedCount > 0) {
    console.log(`Cache cleanup: Removed ${cleanedCount} expired entries`);
  }
}, 60 * 60 * 1000); // Run every hour

// ============================================================================
// AUTHENTICATION
// ============================================================================

// JWT Secret - MUST be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables!');
  console.error('Generate a secret key using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Sign up endpoint
app.post('/api/auth/signup', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await client.query(
      `INSERT INTO users (email, name, password, onboarding_complete, progress)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, onboarding_complete`,
      [email, name, hashedPassword, false, '{}']
    );

    const user = result.rows[0];

    await client.query('COMMIT');

    // Generate token
    const token = generateToken({ id: user.id.toString(), email: user.email });

    res.json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
      onboardingComplete: false,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Sign in endpoint
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user (include auth_provider to check if they're an OAuth user)
    const result = await pool.query(
      'SELECT id, email, name, password, onboarding_complete, auth_provider, google_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user signed up with Google OAuth (no password)
    if (!user.password && (user.auth_provider === 'google' || user.google_id)) {
      return res.status(401).json({ 
        message: 'This account was created with Google. Please sign in using Google OAuth.' 
      });
    }

    // If user has no password and no OAuth provider, something is wrong
    if (!user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken({ id: user.id.toString(), email: user.email });

    res.json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
      onboardingComplete: user.onboarding_complete,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, onboarding_complete FROM users WHERE email = $1',
      [req.user.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      valid: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
      onboardingComplete: user.onboarding_complete,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============================================================================
// GOOGLE OAUTH CONFIGURATION
// ============================================================================

// Configure Google OAuth Strategy
// Using only basic scopes (email, profile) - these don't require Google verification
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:5000/api/auth/google/callback`,
  // Only request basic scopes that don't require verification
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, displayName, emails } = profile;
    const email = emails && emails[0] ? emails[0].value : null;

    if (!email) {
      return done(new Error('No email found in Google profile'), null);
    }

    // Check if user exists with this Google ID
    let userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [id]
    );

    let user;

    if (userResult.rows.length > 0) {
      // User exists with Google ID
      user = userResult.rows[0];
    } else {
      // Check if user exists with this email
      const emailResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (emailResult.rows.length > 0) {
        // User exists with email, link Google account
        await pool.query(
          'UPDATE users SET google_id = $1, auth_provider = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3',
          [id, 'google', email]
        );
        user = emailResult.rows[0];
        user.google_id = id;
        user.auth_provider = 'google';
      } else {
        // Create new user
        const newUserResult = await pool.query(
          `INSERT INTO users (email, name, google_id, auth_provider, onboarding_complete, progress)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [email, displayName, id, 'google', false, '{}']
        );
        user = newUserResult.rows[0];
      }
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth endpoint - initiates OAuth flow
// Using only basic scopes (email, profile) - these work for all users without verification
app.get('/api/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  // Access type and prompt settings for better UX
  accessType: 'offline',
  prompt: 'consent'
}));

// Google OAuth callback - handles OAuth response
app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT token
      const token = generateToken({ id: user.id.toString(), email: user.email });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = user.onboarding_complete
        ? `${frontendUrl}/dashboard?token=${token}`
        : `${frontendUrl}/onboarding?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/signin?error=oauth_failed`);
    }
  }
);

// Google OAuth failure handler
app.get('/api/auth/google/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/signin?error=oauth_failed`);
});

// Onboarding endpoint
app.post('/api/auth/onboarding', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { memorizedSurahs, progress: frontendProgress } = req.body;

    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    await client.query('BEGIN');

    // Build progress object from memorized surahs
    // Use frontend progress if provided (contains all verses marked as memorized)
    const progress = frontendProgress || {};
    
    for (const { surahId, name } of memorizedSurahs) {
      // If frontend progress exists for this surah, use it; otherwise create empty
      if (!progress[surahId]) {
        progress[surahId] = {
          name,
          verses: {},
        };
      }

      // Store in user_progress table with the actual verses data
      const versesData = progress[surahId].verses || {};
      await client.query(
        `INSERT INTO user_progress (user_id, surah_id, surah_name, verses)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, surah_id)
         DO UPDATE SET surah_name = $3, verses = $4, updated_at = CURRENT_TIMESTAMP`,
        [userId, surahId, progress[surahId].name || name, JSON.stringify(versesData)]
      );
    }

    // Update user onboarding status and progress
    await client.query(
      'UPDATE users SET onboarding_complete = $1, progress = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [true, JSON.stringify(progress), userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      progress,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update profile endpoint (name and email)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email } = req.body;

    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Build update query dynamically based on what's provided
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, onboarding_complete
    `;

    const result = await client.query(updateQuery, values);
    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update password endpoint
app.put('/api/auth/profile/password', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const userResult = await client.query(
      'SELECT id, password FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user has a password (Google OAuth users might not have one)
    if (!user.password) {
      return res.status(400).json({ message: 'Password cannot be changed for Google OAuth accounts' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get user progress endpoint
app.get('/api/auth/progress', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get progress from user_progress table
    const progressResult = await client.query(
      'SELECT surah_id, surah_name, verses FROM user_progress WHERE user_id = $1',
      [userId]
    );

    // Build progress object from database
    const progress = {};
    progressResult.rows.forEach(row => {
      progress[row.surah_id] = {
        name: row.surah_name,
        verses: row.verses || {}
      };
    });

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update user progress endpoint
app.put('/api/auth/progress', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { progress } = req.body;

    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ message: 'Progress data is required' });
    }

    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    await client.query('BEGIN');

    // Update or insert progress for each surah
    for (const [surahId, surahData] of Object.entries(progress)) {
      const versesData = surahData.verses || {};
      await client.query(
        `INSERT INTO user_progress (user_id, surah_id, surah_name, verses)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, surah_id)
         DO UPDATE SET surah_name = $3, verses = $4, updated_at = CURRENT_TIMESTAMP`,
        [userId, surahId, surahData.name || '', JSON.stringify(versesData)]
      );
    }

    // Also update the progress JSONB in users table for backward compatibility
    await client.query(
      'UPDATE users SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(progress), userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      progress,
      message: 'Progress updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete user progress endpoint
app.delete('/api/auth/progress', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    await client.query('BEGIN');

    // Delete all progress for the user
    await client.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);

    // Also clear the progress JSONB in users table
    await client.query(
      'UPDATE users SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify({}), userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Progress cleared successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete account endpoint
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    await client.query('BEGIN');

    // Delete user progress (CASCADE will handle this, but being explicit)
    await client.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

