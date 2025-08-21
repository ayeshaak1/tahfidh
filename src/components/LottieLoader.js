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
  const [verseLoading, setVerseLoading] = useState(false);

  useEffect(() => {
    if (showVerse) {
      const verse = versePreloader.getRandomVerse();
      console.log('🔍 LottieLoader received verse:', JSON.stringify(verse, null, 2));
      setRandomVerse(verse);
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
      {showVerse && verseLoading && (
        <div className="verse-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Fetching a beautiful verse for you...</p>
        </div>
      )}
      <div className="loading-message">
        <p>Please wait while we prepare your memorization journey.</p>
      </div>
    </div>
  );
};

export default LottieLoader;
