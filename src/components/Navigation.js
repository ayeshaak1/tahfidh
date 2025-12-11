import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Home, BookOpen, User, Sun, Moon } from 'lucide-react';

const Navigation = ({ sidebarOpen, setSidebarOpen }) => {
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && sidebarOpen) {
        const nav = document.querySelector('.navigation');
        const hamburger = document.querySelector('.hamburger-menu');
        if (nav && !nav.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen, setSidebarOpen]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const handleNavClick = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="nav-overlay" 
          onClick={() => {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
              setSidebarOpen(false);
            }
          }}
        />
      )}
      <nav className={`navigation ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        {/* Logo Section */}
        <div className="nav-logo">
          <NavLink to="/dashboard" className="logo" onClick={handleLogoClick} style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <span className="arabic-logo">تحفيظ</span>
            <span className="english-logo">Tahfidh</span>
          </NavLink>
        </div>

        <div className="nav-list">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/surahs" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <BookOpen size={20} />
            <span>Surahs</span>
          </NavLink>
          
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </div>
          
        <div className="nav-footer">
          <button className="nav-item theme-toggle" onClick={toggleTheme}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span>Theme</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
