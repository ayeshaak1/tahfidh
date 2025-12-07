import quranApi from './quranApi';

class VersePreloader {
  constructor() {
    this.randomVerses = [];
    this.isPreloading = false;
    this.currentIndex = 0;
  }

  async preloadRandomVerses(count = 20) {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log(`Preloading ${count} random verses...`);
    
    try {
      const promises = [];
      for (let i = 0; i < count; i++) {
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
          if (verse.verse.words && Array.isArray(verse.verse.words)) {
            const totalLength = verse.verse.words.reduce((total, word) => total + (word.text ? word.text.length : 0), 0);
            if (totalLength > 25) {
              console.log(`Skipping verse ${verse.verse.verse_key} - too long (${totalLength} characters)`);
              return false;
            }
          }
          return true;
        });
      
      console.log(`Successfully preloaded ${this.randomVerses.length} random verses`);
      if (this.randomVerses.length > 0) {
        console.log('Sample preloaded verse structure:', JSON.stringify(this.randomVerses[0], null, 2));
      }
      
      // Fallback if we couldn't get enough verses after length filtering
      if (this.randomVerses.length < 3) {
        console.log('Limited verses preloaded after length filtering, loading default verses...');
        this.randomVerses.push(...this.getDefaultVerses());
      }
    } catch (error) {
      console.error('Error preloading verses:', error);
      // Fallback to default verses
      this.randomVerses = this.getDefaultVerses();
    } finally {
      this.isPreloading = false;
    }
  }

  async fetchRandomVerse() {
    try {
      const response = await quranApi.getRandomVerse();
      console.log('Random verse API response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.warn('Failed to fetch random verse:', error);
      return null;
    }
  }

  getRandomVerse() {
    console.log(`getRandomVerse called. Available verses: ${this.randomVerses.length}, current index: ${this.currentIndex}`);
    
    if (this.randomVerses.length === 0) {
      console.log('No preloaded verses, returning default verse');
      return this.getDefaultVerses()[0];
    }
    
    const verse = this.randomVerses[this.currentIndex % this.randomVerses.length];
    console.log(`Returning verse at index ${this.currentIndex % this.randomVerses.length}:`, JSON.stringify(verse, null, 2));
    this.currentIndex++;
    
    // Preload more verses when we're halfway through
    if (this.currentIndex >= Math.floor(this.randomVerses.length / 2)) {
      this.preloadRandomVerses(5); // Preload 5 more verses
    }
    
    return verse;
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

export default new VersePreloader();
