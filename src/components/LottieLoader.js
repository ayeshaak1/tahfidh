import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { useTheme } from '../contexts/ThemeContext';
import lightLoader from '../assets/light.json';
import darkLoader from '../assets/dark.json';
import versePreloader from '../services/versePreloader';

const LottieLoader = ({ size = 'medium', className = '', showVerse = true }) => {
  const { isDark } = useTheme();
  const animationData = isDark ? darkLoader : lightLoader;
  const [randomVerse, setRandomVerse] = useState(null);

  useEffect(() => {
    if (showVerse) {
      // Preload verses if not already done
      if (!versePreloader.hasPreloaded) {
        versePreloader.preloadRandomVerses(10).then(() => {
          const verse = versePreloader.getRandomVerse();
          setRandomVerse(verse);
        });
      } else {
        const verse = versePreloader.getRandomVerse();
        setRandomVerse(verse);
      }
      
      // Rotate verses every 5 seconds for variety
      const interval = setInterval(() => {
        const verse = versePreloader.getRandomVerse();
        setRandomVerse(verse);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [showVerse]);

  const getVerseReference = (verse) => {
    if (!verse || !verse.verse) return '';
    // Use verse_key instead of separate chapter_id and verse_number
    return `Surah ${verse.verse.verse_key}`;
  };


  return (
    <div className={`lottie-loader-container ${className}`}>
      <div className="bismillah-section">
        <div className="bismillah"> ﷽
        </div>
      </div>
      <div className={`lottie-loader lottie-${size}`}>
        <Lottie 
          animationData={animationData} 
          loop={true} 
          autoplay={true} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
      {showVerse && randomVerse && (
        <div className="random-verse-display">
          
          {randomVerse.verse.translations && randomVerse.verse.translations.length > 0 && (
            <div className="verse-translation">
              "{randomVerse.verse.translations[0].text}"
            </div>
          )}
          <div className="verse-reference">
            — {getVerseReference(randomVerse)}
          </div>
        </div>
      )}
      <div className="loading-message">
        <p>Please wait while we prepare your memorization journey.</p>
      </div>
    </div>
  );
};

export default LottieLoader;
