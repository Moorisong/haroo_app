import React, { useState, useEffect } from 'react';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import './App.css';

// Simple hash-based routing without react-router-dom
function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Route rendering
  const renderPage = () => {
    switch (currentPath) {
      case '/terms':
        return <TermsPage />;
      case '/privacy':
        return <PrivacyPage />;
      default:
        return (
          <div className="home-container">
            <h1>Haroo</h1>
            <p>하루에 한 번, 마음을 전하는 메시지 앱</p>
            <nav className="home-nav">
              <a href="/terms">이용약관</a>
              <a href="/privacy">개인정보처리방침</a>
            </nav>
          </div>
        );
    }
  };

  return <>{renderPage()}</>;
}

export default App;
