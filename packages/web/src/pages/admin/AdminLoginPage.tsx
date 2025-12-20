import React, { useState } from 'react';
import './AdminLoginPage.css';

interface AdminLoginPageProps {
    onLogin: () => void;
}

// 카카오 REST API 키 (web 환경변수에서 가져오기)
const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID || 'your_kakao_client_id';
const REDIRECT_URI = `${window.location.origin}/admin/callback`;

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleKakaoLogin = () => {
        setIsLoading(true);
        // 카카오 OAuth 로그인 페이지로 리다이렉트
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
        window.location.href = kakaoAuthUrl;
    };

    // 개발용 임시 로그인
    const handleDevLogin = () => {
        // 개발 환경에서만 사용
        localStorage.setItem('admin_token', 'dev_admin_token');
        localStorage.setItem('admin_user', JSON.stringify({ name: '관리자', email: 'admin@haroo.site' }));
        onLogin();
    };

    return (
        <div className="admin-login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Haroo Admin</h1>
                    <p>운영자 전용 페이지입니다</p>
                </div>

                <div className="login-buttons">
                    <button
                        className="kakao-login-button"
                        onClick={handleKakaoLogin}
                        disabled={isLoading}
                    >
                        <img
                            src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png"
                            alt="Kakao"
                            className="kakao-icon"
                        />
                        카카오 계정으로 로그인
                    </button>

                    {/* 개발용 임시 로그인 버튼 - 항상 표시 */}
                    <button
                        className="dev-login-button"
                        onClick={handleDevLogin}
                    >
                        🔧 개발용 로그인 (테스트)
                    </button>
                </div>

                <p className="login-notice">
                    ⚠️ 권한이 있는 관리자만 접근할 수 있습니다
                </p>
            </div>
        </div>
    );
};
