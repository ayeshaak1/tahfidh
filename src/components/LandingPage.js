import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, BarChart3, Award, Sun, Moon } from 'lucide-react';

const LandingPage = ({ onGuestMode, setCurrentPath }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setCurrentPath('/');
    // Redirect to dashboard if already logged in
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [setCurrentPath, isAuthenticated, navigate]);

  const handleGuestMode = () => {
    onGuestMode();
    navigate('/dashboard');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div 
          className="logo" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ cursor: 'pointer' }}
        >
          <span className="arabic-logo">تحفيظ</span>
          <span className="english-logo">Tahfidh</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="islamic-pattern"></div>
        </div>
        <div className="hero-content">
          {/* Bismillah*/}
          <div className="bismillah-section">
            <div className="bismillah arabic uthmani">
            ﷽
            </div>
          </div>
          
          <h1 className="hero-title">Preserve the Divine Words</h1>
          <p className="hero-subtitle">
            Embark on your sacred journey of Quran memorization with our comprehensive tracking system
          </p>
          
          <div className="quran-verse">
            <div className="verse-arabic arabic uthmani">
              إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
            </div>
            <div className="verse-translation">
              "It is certainly We Who have revealed the Reminder, and it is certainly We Who will preserve it."
            </div>
            <div className="verse-reference">— Qur'an 15:9 | Al-Hijr</div>
          </div>
          
          <div className="cta-buttons">
            <button className="btn btn-ghost" onClick={handleGuestMode}>
              Continue as Guest
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/signin')}>
              Start Journey
            </button>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="feature-showcase">
        <div className="container">
          <h2>Why Choose Tahfidh?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <BookOpen size={24} />
              </div>
              <h3>Authentic Arabic Scripts</h3>
              <p>Experience the beauty of Quran with Uthmani and IndoPak scripts, ensuring accuracy and authenticity</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={24} />
              </div>
              <h3>Comprehensive Progress Tracking</h3>
              <p>Monitor every step of your memorization journey with detailed analytics and visual progress indicators</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Award size={24} />
              </div>
              <h3>Motivational Achievements</h3>
              <p>Stay inspired with meaningful milestones and achievements that celebrate your dedication and progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> The Quran text displayed on this website is for reference only.
            This website is designed to help you track your memorization progress.
            Please use a trustworthy, verified copy of the Quran for your actual memorization and study.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
