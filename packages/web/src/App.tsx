import React, { useState, useEffect } from 'react';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminStatisticsPage } from './pages/admin/AdminStatisticsPage';
import { AdminLayout } from './components/AdminLayout';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    // 로그인 상태 확인
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setIsAdminLoggedIn(true);
    }

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    // 대시보드로 이동
    window.history.pushState({}, '', '/admin');
    setCurrentPath('/admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAdminLoggedIn(false);
    // 로그인 페이지로 이동
    window.history.pushState({}, '', '/admin');
    setCurrentPath('/admin');
  };

  // Admin 라우트 체크
  const isAdminRoute = currentPath.startsWith('/admin');

  // Admin 라우트 처리
  if (isAdminRoute) {
    // 로그인하지 않은 경우 로그인 페이지 표시
    if (!isAdminLoggedIn) {
      return <AdminLoginPage onLogin={handleAdminLogin} />;
    }

    // Admin 페이지 렌더링
    const renderAdminPage = () => {
      switch (currentPath) {
        case '/admin':
          return <AdminDashboard />;
        case '/admin/users':
          return <AdminUsersPage />;
        case '/admin/messages':
          return <AdminMessagesPage />;
        case '/admin/statistics':
          return <AdminStatisticsPage />;
        default:
          return <AdminDashboard />;
      }
    };

    return (
      <AdminLayout currentPath={currentPath} onLogout={handleAdminLogout}>
        {renderAdminPage()}
      </AdminLayout>
    );
  }

  // 일반 라우트 렌더링
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
