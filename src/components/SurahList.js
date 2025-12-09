import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Filter, Menu, CheckCircle, Circle, Clock, BookOpen, ChevronDown } from 'lucide-react';
import quranApi from '../services/quranApi';
import LottieLoader from './LottieLoader';

const SurahList = ({ userProgress, setUserProgress, setCurrentPath, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [juzFilter, setJuzFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showJuzDropdown, setShowJuzDropdown] = useState(false);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allSurahs, setAllSurahs] = useState([]); // Store all surahs for filtering
  const juzDropdownRef = useRef(null);

  useEffect(() => {
    setCurrentPath('/surahs');
    fetchSurahs();
  }, [setCurrentPath]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (juzDropdownRef.current && !juzDropdownRef.current.contains(event.target)) {
        setShowJuzDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSurahs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quranApi.getSurahs();
      
      if (!data || !data.chapters) {
        setError('Invalid response from API. Please check backend connection.');
        return;
      }
      
      if (data.chapters.length === 0) {
        setError('No surahs found. This may be due to test mode limitations.');
        return;
      }
      
      setAllSurahs(data.chapters); // Store all surahs
      setSurahs(data.chapters);
    } catch (err) {
      setError(`Failed to load surahs: ${err.message}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for each surah
  const getSurahProgress = (surahId, totalVerses) => {
    const surahProgress = userProgress[surahId];
    if (!surahProgress || !surahProgress.verses) {
      return { status: 'Not Started', percentage: 0, memorizedVerses: 0 };
    }

    const verses = Object.values(surahProgress.verses);
    const memorizedVerses = verses.filter(verse => verse.memorized).length;
    // Use totalVerses from surah data, not verses.length (which only counts tracked verses)
    const percentage = Math.round((memorizedVerses / totalVerses) * 100);

    // Determine status based on verse count, not percentage
    let status = 'Not Started';
    if (memorizedVerses === 0) {
      status = 'Not Started';
    } else if (memorizedVerses === totalVerses) {
      status = 'Completed';
    } else {
      status = 'In Progress';
    }

    return { status, percentage, memorizedVerses };
  };

  // Filter surahs based on search and filters
  const filteredSurahs = surahs.filter(surah => {
    const matchesSearch = surah.name_simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         surah.name_arabic.includes(searchTerm) ||
                         surah.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || getSurahProgress(surah.id, surah.verses_count).status === statusFilter;
    // Note: Juz filtering will need to be implemented based on actual API data structure
    const matchesJuz = juzFilter === 'All' || true; // Placeholder for now

    return matchesSearch && matchesStatus && matchesJuz;
  });

  const clearSearch = () => {
    setSearchTerm('');
    setShowSearch(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={20} className="status-icon completed" />;
      case 'In Progress':
        return <Clock size={20} className="status-icon in-progress" />;
      default:
        return <Circle size={20} className="status-icon not-started" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Completed': return 'Completed';
      case 'In Progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const handleMarkAsDone = (surahId, totalVerses) => {
    setUserProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[surahId]) {
        newProgress[surahId] = { verses: {} };
      }
      
      // Get today's date and time
      const todayTimestamp = new Date().toISOString();
      
      // Mark all verses as memorized and assign today's date/time to all verses
      for (let i = 1; i <= totalVerses; i++) {
        const verseKey = i.toString();
        
        if (!newProgress[surahId].verses[verseKey]) {
          newProgress[surahId].verses[verseKey] = {};
        }
        newProgress[surahId].verses[verseKey].memorized = true;
        // Always set lastReviewed to today's date/time when marking surah as done
        newProgress[surahId].verses[verseKey].lastReviewed = todayTimestamp;
      }
      
      // Don't save directly - App.js will handle saving to correct location (GUEST_PROGRESS or QURAN_PROGRESS + database)
      
      return newProgress;
    });
  };

  // Find the most recently memorized verse number for a surah (by timestamp)
  const getLastMemorizedVerse = (surahId) => {
    const surahProgress = userProgress[surahId];
    if (!surahProgress || !surahProgress.verses) {
      return null;
    }

    // Find the verse with the most recent lastReviewed timestamp
    let mostRecentVerse = null;
    let mostRecentTimestamp = null;
    
    Object.keys(surahProgress.verses).forEach(verseNum => {
      const verse = surahProgress.verses[verseNum];
      if (verse.memorized && verse.lastReviewed) {
        const verseTimestamp = new Date(verse.lastReviewed).getTime();
        if (!mostRecentTimestamp || verseTimestamp > mostRecentTimestamp) {
          mostRecentTimestamp = verseTimestamp;
          mostRecentVerse = parseInt(verseNum);
        }
      }
    });

    return mostRecentVerse;
  };

  const handleJuzSelect = async (juz) => {
    setJuzFilter(juz);
    setShowJuzDropdown(false);
    
    if (juz === 'All') {
      setSurahs(allSurahs); // Show all surahs
      setError(null); // Clear any previous errors
      console.log('Showing all surahs');
    } else {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const data = await quranApi.getSurahsByJuz(juz);
        
        if (data && data.surahs && data.surahs.length > 0) {
          setSurahs(data.surahs);
        } else {
          setSurahs([]);
          // Show a user-friendly message
          setError(`No surahs found for Juz ${juz}. This may be due to API limitations or the Juz may be empty.`);
        }
      } catch (err) {
        setSurahs([]);
        setError(`Failed to load surahs for Juz ${juz}. Please try again or select "All Juz".`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={`surah-list ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="app-header">
          <div className="header-left">
            <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">Surah List</h1>
          </div>
        </header>
        
        <LottieLoader 
          size="large" 
          showVerse={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`surah-list ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="app-header">
          <div className="header-left">
            <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">Surah List</h1>
          </div>
        </header>
        
        <div className="error-state">
          <div className="lottie-loader-container">
          
            {/* Error Icon */}
            <div className="error-icon-container">
              <BookOpen size={64} className="error-icon" />
            </div>

            {/* Error Message */}
            <h3 className="loading-title">Failed to Load Surahs</h3>
            <div className="loading-message">
              <p>{error}</p>
            </div>

            {/* Error Actions */}
            <div className="error-actions">
              <button className="retry-btn" onClick={fetchSurahs}>
                Try Again
              </button>
              {juzFilter !== 'All' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleJuzSelect('All')}
                  style={{ marginLeft: '1rem' }}
                >
                  Show All Surahs
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`surah-list ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">Surah List</h1>
        </div>
      </header>

      {/* Modern Search and Filter Header */}
      <div className="surah-header">
        <div className="search-section">
          {/* Collapsible Search Bar */}
          <div className={`search-container ${showSearch ? 'expanded' : ''}`}>
            {showSearch ? (
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
                  autoFocus
            />
            {searchTerm && (
              <button className="clear-search" onClick={clearSearch}>
                <X size={16} />
                  </button>
                )}
                <button className="close-search" onClick={() => setShowSearch(false)}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="search-toggle-btn"
                onClick={() => setShowSearch(true)}
              >
                <Search size={20} />
                <span>Search surahs...</span>
              </button>
            )}
          </div>
          
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        {showFilters && (
        <div className="filter-section">
            <div className="filter-group">
              <label className="filter-label">Status</label>
          <div className="status-filters">
            {['All', 'Not Started', 'In Progress', 'Completed'].map(status => (
              <button
                key={status}
                className={`status-filter ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Juz</label>
              <div className="custom-dropdown" ref={juzDropdownRef}>
                <button
                  className="dropdown-trigger"
                  onClick={() => setShowJuzDropdown(!showJuzDropdown)}
                >
                  <span>{juzFilter === 'All' ? 'All Juz' : `Juz ${juzFilter}`}</span>
                  <ChevronDown 
                    size={16} 
                    className={`dropdown-arrow ${showJuzDropdown ? 'rotated' : ''}`} 
                  />
                </button>
                
                {showJuzDropdown && (
                  <div className="dropdown-menu">
                    <div 
                      className={`dropdown-item ${juzFilter === 'All' ? 'active' : ''}`}
                      onClick={() => handleJuzSelect('All')}
                    >
                      All Juz
                    </div>
              {Array.from({ length: 30 }, (_, i) => (
                      <div
                        key={i + 1}
                        className={`dropdown-item ${juzFilter === (i + 1).toString() ? 'active' : ''}`}
                        onClick={() => handleJuzSelect((i + 1).toString())}
                      >
                        Juz {i + 1}
                      </div>
              ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Surah Cards Grid */}
      <div className="surah-grid">
        {filteredSurahs.length > 0 ? (
          filteredSurahs.map(surah => {
            const progress = getSurahProgress(surah.id, surah.verses_count);
            const isCompleted = progress.status === 'Completed';
            const isInProgress = progress.status === 'In Progress';
            
            // Debug: Log the revelation place for each surah

            return (
              <div
                key={surah.id}
                className={`surah-card ${progress.status.toLowerCase().replace(' ', '-')}`}
                onClick={() => {
                  // Navigate to last memorized verse if exists, otherwise to top
                  const lastVerse = getLastMemorizedVerse(surah.id);
                  const verseParam = lastVerse ? `?verse=${lastVerse}` : '';
                  navigate(`/surah/${surah.id}${verseParam}`);
                }}
              >
                {/* Top Bar */}
                <div className="surah-top-bar">
                  <div className="surah-number">{surah.id}</div>
                  <div 
                    className="surah-arabic-name uthmani"
                    title={`Arabic name: ${surah.name_arabic}`}
                    style={{ 
                      direction: 'rtl',
                      textAlign: 'right'
                    }}
                  >
                    {surah.name_arabic}
                  </div>
                </div>

                {/* Body */}
                <div className="surah-body">
                  <h3 className="surah-english-name">{surah.name_complex || surah.name_simple}</h3>
                  <div className="surah-details">
                    <span className="verse-count">{surah.verses_count} Verses</span>
                    <span 
                      className={`location-badge ${surah.revelation_place === 'makkah' ? 'meccan' : 'medinan'}`}
                      title={`Revelation place: ${surah.revelation_place}`}
                      data-location={surah.revelation_place}
                      style={{ 
                        backgroundColor: surah.revelation_place === 'makkah' ? 'var(--rose)' : 'var(--lavender)',
                        color: 'white'
                      }}
                    >
                      {surah.revelation_place === 'makkah' ? 'Meccan' : 'Medinan'}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="surah-progress">
                  <div className="progress-status">
                    {getStatusIcon(progress.status)}
                    <span className="status-text">{getStatusText(progress.status)}</span>
                  </div>
                  
                  <div className="progress-bar-container">
                    <div className="progress-bar" title={`${progress.memorizedVerses} out of ${surah.verses_count} verses memorized`}>
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      <span className="progress-verses">{progress.memorizedVerses}/{surah.verses_count}</span>
                    <span className="progress-percentage">{progress.percentage}%</span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="surah-action-buttons" onClick={(e) => e.stopPropagation()}>
                      {isInProgress ? (
                        <>
                          <button 
                            className="action-btn resume-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const lastVerse = getLastMemorizedVerse(surah.id);
                              // Navigate to the last memorized verse, or start if none found
                              const verseParam = lastVerse ? `?verse=${lastVerse}` : '';
                              navigate(`/surah/${surah.id}${verseParam}`);
                            }}
                          >
                      Resume
                          </button>
                          <button 
                            className="action-btn mark-done-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsDone(surah.id, surah.verses_count);
                            }}
                          >
                            Mark as Done
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="action-btn start-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/surah/${surah.id}`);
                            }}
                          >
                            Start
                          </button>
                          <button 
                            className="action-btn mark-done-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsDone(surah.id, surah.verses_count);
                            }}
                          >
                            Mark as Done
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <BookOpen size={48} />
            </div>
            <h3>No surahs match filters</h3>
            <p>Try adjusting your search or filter criteria</p>
           
            <button 
              className="reset-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setJuzFilter('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurahList;
