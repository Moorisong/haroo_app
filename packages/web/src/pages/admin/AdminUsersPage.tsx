import React, { useState } from 'react';
import './AdminUsersPage.css';

// Mock 유저 데이터
const MOCK_USERS = [
    { id: 'usr_001', hashId: 'haroo-a1b2c3', status: 'ACTIVE', createdAt: '2024-12-15', messageCount: 45, lastActive: '2024-12-20' },
    { id: 'usr_002', hashId: 'haroo-d4e5f6', status: 'ACTIVE', createdAt: '2024-12-18', messageCount: 12, lastActive: '2024-12-20' },
    { id: 'usr_003', hashId: 'haroo-g7h8i9', status: 'WRITE_BLOCKED', createdAt: '2024-12-10', messageCount: 87, lastActive: '2024-12-19' },
    { id: 'usr_004', hashId: 'haroo-j0k1l2', status: 'REPORT_MUTED', createdAt: '2024-12-05', messageCount: 23, lastActive: '2024-12-18' },
    { id: 'usr_005', hashId: 'haroo-m3n4o5', status: 'ACTIVE', createdAt: '2024-12-20', messageCount: 3, lastActive: '2024-12-20' },
];

export const AdminUsersPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            'ACTIVE': { label: '활성', className: 'badge-active' },
            'WRITE_BLOCKED': { label: '작성 차단', className: 'badge-blocked' },
            'REPORT_MUTED': { label: '신고 무효화', className: 'badge-muted' },
            'BANNED': { label: '정지', className: 'badge-banned' },
        };
        const badge = badges[status] || { label: status, className: '' };
        return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
    };

    const filteredUsers = MOCK_USERS.filter(user => {
        const matchesSearch = user.hashId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-users-page">
            {/* 필터 영역 */}
            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="유저 ID로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-select"
                >
                    <option value="all">전체 상태</option>
                    <option value="ACTIVE">활성</option>
                    <option value="WRITE_BLOCKED">작성 차단</option>
                    <option value="REPORT_MUTED">신고 무효화</option>
                    <option value="BANNED">정지</option>
                </select>
            </div>

            {/* 유저 테이블 */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>유저 ID</th>
                            <th>상태</th>
                            <th>가입일</th>
                            <th>작성 메시지</th>
                            <th>마지막 활동</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="user-id">{user.hashId}</td>
                                <td>{getStatusBadge(user.status)}</td>
                                <td>{user.createdAt}</td>
                                <td>{user.messageCount}</td>
                                <td>{user.lastActive}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="action-btn view">상세</button>
                                        <button className="action-btn warn">제재</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
                <button className="page-btn" disabled>이전</button>
                <span className="page-info">1 / 1</span>
                <button className="page-btn" disabled>다음</button>
            </div>
        </div>
    );
};
