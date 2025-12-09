import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, Check, Sun, Moon, ArrowRight } from 'lucide-react';
import quranApi from '../services/quranApi';
import { StorageHelpers, STORAGE_KEYS } from '../constants/storageConstants';

const Onboarding = ({ setCurrentPath }) => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [surahs, setSurahs] = useState([]);
  const [selectedSurahs, setSelectedSurahs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Most commonly memorized surahs in ascending order of surah number
  // These are the most frequently memorized surahs by everyone
  const commonSurahs = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

  React.useEffect(() => {
    setCurrentPath('/onboarding');
  }, [setCurrentPath]);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const data = await quranApi.getSurahs();
        if (data && data.chapters) {
          // Store all surahs sorted by number (ascending order)
          const sortedSurahs = [...data.chapters].sort((a, b) => {
            return parseInt(a.id) - parseInt(b.id);
          });
          
          setSurahs(sortedSurahs);
        }
      } catch (err) {
        console.error('Failed to fetch surahs:', err);
        setError('Failed to load surahs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  const toggleSurah = (surahId) => {
    const newSelected = new Set(selectedSurahs);
    if (newSelected.has(surahId)) {
      newSelected.delete(surahId);
    } else {
      newSelected.add(surahId);
    }
    setSelectedSurahs(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedSurahs.size === 0) {
      setError('Please select at least one surah you have memorized, or click "Skip" to start fresh.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Fetch verse counts for selected surahs and create progress
      const progress = {};
      const now = new Date().toISOString();

      for (const surahId of selectedSurahs) {
        const surah = surahs.find(s => s.id === surahId);
        if (!surah) continue;

        try {
          // Fetch surah data to get verse count
          const surahData = await quranApi.getSurah(surahId);
          const verseCount = surahData.chapter?.verses_count || surah.verses_count || 0;

          // Mark all verses as memorized
          const verses = {};
          for (let i = 1; i <= verseCount; i++) {
            verses[i.toString()] = {
              memorized: true,
              lastReviewed: now,
            };
          }

          progress[surahId.toString()] = {
            name: surah.name_simple,
            verses,
          };
        } catch (err) {
          console.error(`Failed to fetch surah ${surahId}:`, err);
          // Fallback: create empty verses object, user can mark verses later
          progress[surahId.toString()] = {
            name: surah.name_simple,
            verses: {},
          };
        }
      }

      // Convert to format expected by backend
      const memorizedSurahs = Array.from(selectedSurahs).map(surahId => {
        const surah = surahs.find(s => s.id === surahId);
        return {
          surahId: surahId.toString(),
          name: surah ? surah.name_simple : `Surah ${surahId}`,
          allVersesMemorized: true,
        };
      });

      // Pass both memorizedSurahs and the detailed progress with all verses
      const result = await completeOnboarding(memorizedSurahs, progress);
      
      // Update local progress with fetched data
      let finalProgress = progress;
      if (result && result.progress) {
        // Merge backend progress with our detailed progress
        finalProgress = { ...result.progress, ...progress };
      }
      
      // Store in localStorage
      StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, finalProgress);
      
      // Set a flag to indicate we just completed onboarding - App.js will reload progress
      StorageHelpers.setItem('onboarding_just_completed', 'true');
      
      // Small delay to ensure localStorage write completes before navigation
      // This ensures App.js can read the data when it loads
      await new Promise(resolve => setTimeout(resolve, 50));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save your progress. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Mark onboarding as complete with no memorized surahs
      await completeOnboarding([], {});
      
      // Clear any existing progress in localStorage (user is starting fresh)
      StorageHelpers.setItem(STORAGE_KEYS.QURAN_PROGRESS, {});
      
      // Set flag to indicate onboarding just completed
      StorageHelpers.setItem('onboarding_just_completed', 'true');
      
      // Small delay to ensure localStorage write completes
      await new Promise(resolve => setTimeout(resolve, 50));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to skip onboarding. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-loading">
          <p>Loading surahs...</p>
        </div>
      </div>
    );
  }

  // Split surahs into frequently memorized and all surahs
  // Frequently memorized: sorted in ascending order of surah number
  const commonSurahsList = surahs
    .filter(s => commonSurahs.includes(parseInt(s.id)))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));
  
  // All surahs: sorted in ascending order of surah number (includes frequently memorized ones)
  const allSurahsList = surahs
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="bismillah-section">
            <div className="bismillah arabic uthmani">﷽</div>
          </div>

          <h1 className="onboarding-title">Welcome to Your Journey</h1>
          <p className="onboarding-subtitle">
            Select the surahs you have already memorized. This helps us track your progress accurately.
          </p>

          {error && (
            <div className="onboarding-error">
              {error}
            </div>
          )}

          <div className="onboarding-content">
            {commonSurahsList.length > 0 && (
              <div className="surah-section">
                <h3 className="surah-section-title">Frequently Memorized</h3>
                <div className="surah-grid">
                  {commonSurahsList.map(surah => (
                    <button
                      key={surah.id}
                      className={`surah-select-btn ${selectedSurahs.has(surah.id) ? 'selected' : ''}`}
                      onClick={() => toggleSurah(surah.id)}
                    >
                      <div className="surah-select-number">{surah.id}</div>
                      <div className="surah-select-name">{surah.name_simple}</div>
                      {selectedSurahs.has(surah.id) && (
                        <div className="surah-select-check">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {allSurahsList.length > 0 && (
              <div className="surah-section">
                <h3 className="surah-section-title">All Surahs</h3>
                <div className="surah-grid">
                  {allSurahsList.map(surah => (
                    <button
                      key={surah.id}
                      className={`surah-select-btn ${selectedSurahs.has(surah.id) ? 'selected' : ''}`}
                      onClick={() => toggleSurah(surah.id)}
                    >
                      <div className="surah-select-number">{surah.id}</div>
                      <div className="surah-select-name">{surah.name_simple}</div>
                      {selectedSurahs.has(surah.id) && (
                        <div className="surah-select-check">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="onboarding-footer">
            <button
              className="skip-button"
              onClick={handleSkip}
              disabled={submitting}
            >
              Skip for Now
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || selectedSurahs.size === 0}
            >
              {submitting ? 'Saving...' : `Continue (${selectedSurahs.size} selected)`}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

