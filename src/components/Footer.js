import React from 'react';

const Footer = ({ sidebarOpen }) => {
  return (
    <footer className={`app-footer ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="footer-content">
        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> The Quran text displayed on this website is for reference only. 
            This website is designed to help you track your memorization progress. 
            Please use a trustworthy, verified copy of the Quran for your actual memorization and study.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

