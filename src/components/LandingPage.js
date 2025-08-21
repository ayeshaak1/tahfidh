import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, BarChart3, Award, Sun, Moon } from 'lucide-react';

const LandingPage = ({ onGuestMode, onSignUp, setCurrentPath }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    setCurrentPath('/');
  }, [setCurrentPath]);

  const handleGuestMode = () => {
    onGuestMode();
    navigate('/dashboard');
  };

  const handleSignUp = () => {
    onSignUp();
    navigate('/dashboard');
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="logo">
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
            <button className="btn btn-primary" onClick={handleSignUp}>
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
                <BookOpen size={32} />
              </div>
              <h3>Authentic Arabic Scripts</h3>
              <p>Experience the beauty of Quran with Uthmani and IndoPak scripts, ensuring accuracy and authenticity</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={32} />
              </div>
              <h3>Comprehensive Progress Tracking</h3>
              <p>Monitor every step of your memorization journey with detailed analytics and visual progress indicators</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Award size={32} />
              </div>
              <h3>Motivational Achievements</h3>
              <p>Stay inspired with meaningful milestones and achievements that celebrate your dedication and progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Disclaimer Bar */}
      <div className="guest-disclaimer-bar">
        <div className="container">
          <p>
            <strong>Guest Mode:</strong> Your progress will be saved locally on this device. 
            For cloud backup and syncing across devices, consider creating an account.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section disclaimer-section">
              <h4>Important Disclaimer</h4>
              <p>
                Tahfidh is a digital tool designed to assist with Quran memorization tracking and progress monitoring. 
                It serves as a supplementary aid and is not intended to replace traditional Islamic education, 
                guidance from qualified scholars, or direct study of authentic Quranic sources. 
                Always verify Quranic text with authoritative sources and consult with knowledgeable individuals 
                for proper recitation and understanding.
              </p>
            </div>
            
            <div className="footer-section about-section">
              <h4>About Tahfidh</h4>
              <p>
                Tahfidh is thoughtfully designed to support Muslims worldwide in their sacred Quran memorization journey. 
                Our platform provides a modern, accessible, and respectful environment for tracking progress, 
                maintaining consistency, and building lasting habits in the noble pursuit of memorizing Allah's words.
              </p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 Tahfidh. All rights reserved.</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
