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

  // 카카오 OAuth 콜백 처리
  const processedRef = React.useRef(false);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      // /admin/callback 경로이고 code가 있는 경우
      if (window.location.pathname === '/admin/callback' && code) {
        // 이미 처리된 경우 중단
        if (processedRef.current) return;
        processedRef.current = true;

        try {
          // 서버에 code를 전송하여 토큰 교환 요청
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/kakao/admin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            const data = await response.json();

            // 토큰 및 사용자 정보 저장
            localStorage.setItem('admin_token', data.token || 'kakao_admin_token');
            localStorage.setItem('admin_user', JSON.stringify(data.user || { name: '관리자' }));

            // 로그인 상태 업데이트 및 대시보드로 이동
            setIsAdminLoggedIn(true);
            window.history.replaceState({}, '', '/admin');
            setCurrentPath('/admin');
          } else {
            const errorData = await response.json().catch(() => ({}));
            alert(`로그인 실패: ${errorData.message || '권한이 없거나 서버 오류가 발생했습니다.'}`);

            // 로그인 페이지로 이동
            window.history.replaceState({}, '', '/admin');
            setCurrentPath('/admin');
          }
        } catch (error) {
          alert('로그인 처리 중 오류가 발생했습니다. 네트워크를 확인해주세요.');

          // 로그인 페이지로 이동
          window.history.replaceState({}, '', '/admin');
          setCurrentPath('/admin');
        }
      }
    };

    handleKakaoCallback();
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
