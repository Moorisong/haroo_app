import React from 'react';
import './AdminDashboard.css';

// Mock 데이터
const MOCK_STATS = {
    totalUsers: 1234,
    newUsersToday: 56,
    totalMessages: 8765,
    messagesThisWeek: 432,
};

const MOCK_DAILY_MESSAGES = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    data: [45, 62, 38, 55, 78, 92, 67],
};

const MOCK_PAYMENT_RATIO = {
    free: 78,
    paid: 22,
};

// 간단한 막대 차트 컴포넌트 (CSS 기반)
const SimpleBarChart: React.FC<{ labels: string[]; data: number[] }> = ({ labels, data }) => {
    const maxValue = Math.max(...data);
    return (
        <div className="simple-bar-chart">
            {data.map((value, index) => (
                <div key={index} className="bar-item">
                    <div
                        className="bar"
                        style={{ height: `${(value / maxValue) * 150}px` }}
                    >
                        <span className="bar-value">{value}</span>
                    </div>
                    <span className="bar-label">{labels[index]}</span>
                </div>
            ))}
        </div>
    );
};

// 간단한 도넛 차트 컴포넌트 (CSS 기반)
const SimpleDonutChart: React.FC<{ free: number; paid: number }> = ({ free, paid }) => {
    return (
        <div className="simple-donut-chart">
            <div
                className="donut"
                style={{
                    background: `conic-gradient(#3498db 0deg ${free * 3.6}deg, #e74c3c ${free * 3.6}deg 360deg)`
                }}
            >
                <div className="donut-center">
                    <span className="donut-total">{free + paid}%</span>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
    return (
        <div className="admin-dashboard">
            {/* 상단 카드 영역 */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <span className="stat-value">{MOCK_STATS.totalUsers.toLocaleString()}</span>
                        <span className="stat-label">총 유저 수</span>
                    </div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-info">
                        <span className="stat-value">+{MOCK_STATS.newUsersToday}</span>
                        <span className="stat-label">오늘 신규 유저</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-info">
                        <span className="stat-value">{MOCK_STATS.totalMessages.toLocaleString()}</span>
                        <span className="stat-label">총 메시지 수</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-info">
                        <span className="stat-value">{MOCK_STATS.messagesThisWeek}</span>
                        <span className="stat-label">이번 주 작성</span>
                    </div>
                </div>
            </div>

            {/* 차트 영역 */}
            <div className="charts-row">
                <div className="chart-card">
                    <h3>일별 메시지 작성 현황</h3>
                    <div className="chart-filter">
                        <button className="filter-btn active">일별</button>
                        <button className="filter-btn">주간</button>
                        <button className="filter-btn">월별</button>
                    </div>
                    <div className="chart-container">
                        <SimpleBarChart
                            labels={MOCK_DAILY_MESSAGES.labels}
                            data={MOCK_DAILY_MESSAGES.data}
                        />
                    </div>
                </div>

                <div className="chart-card small">
                    <h3>무료/유료 작성 비율</h3>
                    <div className="chart-container doughnut">
                        <SimpleDonutChart free={MOCK_PAYMENT_RATIO.free} paid={MOCK_PAYMENT_RATIO.paid} />
                    </div>
                    <div className="payment-stats">
                        <div className="payment-stat">
                            <span className="dot blue"></span>
                            <span>무료: {MOCK_PAYMENT_RATIO.free}%</span>
                        </div>
                        <div className="payment-stat">
                            <span className="dot red"></span>
                            <span>유료: {MOCK_PAYMENT_RATIO.paid}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 최근 활동 */}
            <div className="recent-activity">
                <h3>최근 활동</h3>
                <div className="activity-list">
                    <div className="activity-item">
                        <span className="activity-icon">📝</span>
                        <span className="activity-text">새로운 메시지가 작성되었습니다 (강남구)</span>
                        <span className="activity-time">방금 전</span>
                    </div>
                    <div className="activity-item">
                        <span className="activity-icon">👤</span>
                        <span className="activity-text">새로운 유저가 가입했습니다</span>
                        <span className="activity-time">5분 전</span>
                    </div>
                    <div className="activity-item">
                        <span className="activity-icon">🚨</span>
                        <span className="activity-text">신고된 메시지가 있습니다</span>
                        <span className="activity-time">12분 전</span>
                    </div>
                    <div className="activity-item">
                        <span className="activity-icon">💳</span>
                        <span className="activity-text">유료 작성 결제가 완료되었습니다</span>
                        <span className="activity-time">30분 전</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
