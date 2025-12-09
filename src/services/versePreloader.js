import quranApi from './quranApi';

class VersePreloader {
  constructor() {
    this.randomVerses = [];
    this.isPreloading = false;
    this.currentIndex = 0;
    this.hasPreloaded = false; // Track if we've already preloaded
  }

  async preloadRandomVerses(count = 20, force = false) {
    // Allow force reload if needed
    if (!force && (this.isPreloading || this.hasPreloaded)) {
      return;
    }
    
    this.isPreloading = true;
    
    // Increase count to get more variety (but still reasonable)
    // Always use a reasonable limit
    const actualCount = Math.min(count, 10);
    
    try {
      const promises = [];
      for (let i = 0; i < actualCount; i++) {
        promises.push(this.fetchRandomVerse());
      }
      
      const verses = await Promise.allSettled(promises);
      
      // Filter successful results and check verse length
      this.randomVerses = verses
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .filter(verse => verse && verse.verse)
        .filter(verse => {
          // Check if verse has words and calculate total length
          // Increase length limit to allow more verses through
          if (verse.verse.words && Array.isArray(verse.verse.words)) {
            const totalLength = verse.verse.words.reduce((total, word) => total + (word.text ? word.text.length : 0), 0);
            // Increased from 25 to 50 to allow more verses
            if (totalLength > 50) {
              return false;
            }
          }
          // Also check translation length
          if (verse.verse.translations && verse.verse.translations.length > 0) {
            const translationText = verse.verse.translations[0].text || '';
            // Filter out very long translations
            if (translationText.length > 200) {
              return false;
            }
          }
          return true;
        });
      
      // Always include default verses for variety
      // Merge with defaults instead of replacing
      const defaultVerses = this.getDefaultVerses();
      const existingKeys = new Set(this.randomVerses.map(v => v.verse?.verse_key));
      const newDefaults = defaultVerses.filter(v => !existingKeys.has(v.verse?.verse_key));
      this.randomVerses.push(...newDefaults);
      
      // Shuffle the array for better variety
      this.randomVerses = this.shuffleArray([...this.randomVerses]);
      
      this.hasPreloaded = true; // Mark as preloaded
    } catch (error) {
      // Fallback to default verses
      this.randomVerses = this.getDefaultVerses();
      this.hasPreloaded = true; // Mark as preloaded even on error
    } finally {
      this.isPreloading = false;
    }
  }

  async fetchRandomVerse() {
    try {
      const response = await quranApi.getRandomVerse();
      return response;
    } catch (error) {
      return null;
    }
  }

  getRandomVerse() {
    if (this.randomVerses.length === 0) {
      // If no verses loaded, return a random default
      const defaults = this.getDefaultVerses();
      return defaults[Math.floor(Math.random() * defaults.length)];
    }
    
    // Use random selection instead of sequential for more variety
    const randomIndex = Math.floor(Math.random() * this.randomVerses.length);
    const verse = this.randomVerses[randomIndex];
    this.currentIndex++;
    
    // Preload more verses when we're halfway through
    if (this.currentIndex >= Math.floor(this.randomVerses.length / 2)) {
      this.preloadRandomVerses(10, true); // Force reload more verses
    }
    
    return verse;
  }
  
  // Helper to shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getDefaultVerses() {
    return [
      {
        verse: {
          chapter_id: 3,
          verse_number: 2,
          verse_key: "2:255",
          text_uthmani: "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ",
          translations: [
            {
              text: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence."
            }
          ]
        }
      },
      {
        verse: {
          chapter_id: 15,
          verse_number: 9,
          verse_key: "15:9",
          text_uthmani: "إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَـٰفِظُونَ",
          translations: [
            {
              text: "Indeed, it is We who sent down the Qur'an and indeed, We will be its guardian."
            }
          ]
        }
      },
      {
        verse: {
          chapter_id: 2,
          verse_number: 286,
          verse_key: "2:286",
          text_uthmani: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
          translations: [
            {
              text: "Allah does not charge a soul except [with that within] its capacity."
            }
          ]
        }
      },
      {
        verse: {
          chapter_id: 18,
          verse_number: 110,
          verse_key: "18:110",
          text_uthmani: "قُلْ إِنَّمَآ أَنَا۠ بَشَرٌ مِّثْلُكُمْ يُوحَىٰٓ إِلَىَّ",
          translations: [
            {
              text: "Say, 'I am only a man like you, to whom has been revealed...'"
            }
          ]
        }
      }
    ];
  }

  // Check if verses are available
  hasVerses() {
    return this.randomVerses.length > 0;
  }

  // Get remaining verse count
  getRemainingCount() {
    return Math.max(0, this.randomVerses.length - this.currentIndex);
  }
}

const versePreloader = new VersePreloader();
export default versePreloader;
