import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Home, BookOpen, User, Sun, Moon } from 'lucide-react';

const Navigation = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
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
        >
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/surahs" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>Surahs</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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
  );
};

export default Navigation;
