import React, { useState } from 'react';
import './AdminMessagesPage.css';

// Mock 메시지 데이터
const MOCK_MESSAGES = [
    { id: 'msg_001', content: '오늘 날씨가 정말 좋다.', toneTag: 'happy', reportCount: 0, status: 'ACTIVE', createdAt: '2024-12-20 14:30', location: '강남구' },
    { id: 'msg_002', content: '이 카페 분위기 너무 좋아요', toneTag: 'review', reportCount: 0, status: 'ACTIVE', createdAt: '2024-12-20 13:15', location: '마포구' },
    { id: 'msg_003', content: '신고된 부적절한 메시지입니다', toneTag: 'anger', reportCount: 5, status: 'HIDDEN', createdAt: '2024-12-20 12:00', location: '서초구' },
    { id: 'msg_004', content: '힘든 하루였지만, 내일은 더 나을 거야.', toneTag: 'comfort', reportCount: 0, status: 'ACTIVE', createdAt: '2024-12-20 11:45', location: '종로구' },
    { id: 'msg_005', content: '신고 검토 대기 중인 메시지', toneTag: 'other', reportCount: 3, status: 'ACTIVE', createdAt: '2024-12-20 10:30', location: '영등포구' },
];

const TONE_TAG_MAP: Record<string, { emoji: string; label: string }> = {
    happy: { emoji: '😊', label: '행복' },
    fear: { emoji: '😨', label: '공포' },
    anger: { emoji: '😡', label: '분노' },
    monologue: { emoji: '😶', label: '혼잣말' },
    review: { emoji: '📝', label: '후기' },
    comfort: { emoji: '🤍', label: '위로' },
    other: { emoji: '🪶', label: '기타' },
};

export const AdminMessagesPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [toneFilter, setToneFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showReportedOnly, setShowReportedOnly] = useState(false);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            'ACTIVE': { label: '활성', className: 'badge-active' },
            'HIDDEN': { label: '숨김', className: 'badge-hidden' },
            'REMOVED': { label: '삭제됨', className: 'badge-removed' },
        };
        const badge = badges[status] || { label: status, className: '' };
        return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
    };

    const filteredMessages = MOCK_MESSAGES.filter(msg => {
        const matchesSearch = msg.content.includes(searchQuery) || msg.location.includes(searchQuery);
        const matchesTone = toneFilter === 'all' || msg.toneTag === toneFilter;
        const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
        const matchesReported = !showReportedOnly || msg.reportCount > 0;
        return matchesSearch && matchesTone && matchesStatus && matchesReported;
    });

    const handleHide = (id: string) => {
        console.log('Hide message:', id);
        alert('메시지가 숨김 처리되었습니다.');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            console.log('Delete message:', id);
            alert('메시지가 삭제되었습니다.');
        }
    };

    return (
        <div className="admin-messages-page">
            {/* 필터 영역 */}
            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="내용 또는 위치로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <select
                    value={toneFilter}
                    onChange={(e) => setToneFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">전체 톤</option>
                    {Object.entries(TONE_TAG_MAP).map(([key, { emoji, label }]) => (
                        <option key={key} value={key}>{emoji} {label}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">전체 상태</option>
                    <option value="ACTIVE">활성</option>
                    <option value="HIDDEN">숨김</option>
                    <option value="REMOVED">삭제됨</option>
                </select>
                <label className="reported-toggle">
                    <input
                        type="checkbox"
                        checked={showReportedOnly}
                        onChange={(e) => setShowReportedOnly(e.target.checked)}
                    />
                    신고된 메시지만
                </label>
            </div>

            {/* 메시지 리스트 */}
            <div className="messages-list">
                {filteredMessages.map((msg) => (
                    <div key={msg.id} className={`message-card ${msg.reportCount > 0 ? 'reported' : ''}`}>
                        <div className="message-header">
                            <div className="message-meta">
                                <span className="tone-tag">
                                    {TONE_TAG_MAP[msg.toneTag]?.emoji} {TONE_TAG_MAP[msg.toneTag]?.label}
                                </span>
                                <span className="location">📍 {msg.location}</span>
                                <span className="created-at">{msg.createdAt}</span>
                            </div>
                            <div className="message-status">
                                {msg.reportCount > 0 && (
                                    <span className="report-badge">🚨 신고 {msg.reportCount}건</span>
                                )}
                                {getStatusBadge(msg.status)}
                            </div>
                        </div>
                        <div className="message-content">
                            {msg.content}
                        </div>
                        <div className="message-actions">
                            <button className="action-btn view">상세 보기</button>
                            {msg.status === 'ACTIVE' && (
                                <>
                                    <button className="action-btn hide" onClick={() => handleHide(msg.id)}>숨기기</button>
                                    <button className="action-btn delete" onClick={() => handleDelete(msg.id)}>삭제</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
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
