import React from 'react';
import './AdminLayout.css';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPath: string;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPath, onLogout }) => {
    const menuItems = [
        { path: '/admin', label: '대시보드', icon: '📊' },
        { path: '/admin/users', label: '유저 관리', icon: '👥' },
        { path: '/admin/messages', label: '메시지 관리', icon: '💬' },
        { path: '/admin/statistics', label: '통계', icon: '📈' },
    ];

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>Haroo Admin</h2>
                </div>
                <nav className="admin-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`admin-nav-item ${currentPath === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="admin-footer">
                    <button className="logout-button" onClick={onLogout}>
                        로그아웃
                    </button>
                </div>
            </aside>
            <main className="admin-main">
                <header className="admin-header">
                    <h1>{menuItems.find(item => item.path === currentPath)?.label || 'Admin'}</h1>
                </header>
                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
};
