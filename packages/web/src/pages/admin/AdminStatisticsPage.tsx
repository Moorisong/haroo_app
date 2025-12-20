import React, { useState } from 'react';
import './AdminStatisticsPage.css';

// Mock 데이터
const MOCK_WEEKLY_TREND = {
    labels: ['12/14', '12/15', '12/16', '12/17', '12/18', '12/19', '12/20'],
    data: [45, 62, 38, 55, 78, 92, 67],
};

const MOCK_TONE_DISTRIBUTION = [
    { label: '행복', value: 35, color: '#f1c40f' },
    { label: '혼잣말', value: 25, color: '#9b59b6' },
    { label: '후기', value: 18, color: '#3498db' },
    { label: '위로', value: 12, color: '#e91e63' },
    { label: '기타', value: 6, color: '#95a5a6' },
    { label: '공포', value: 2, color: '#1abc9c' },
    { label: '분노', value: 2, color: '#e74c3c' },
];

const MOCK_PAYMENT_TREND = {
    labels: ['12/14', '12/15', '12/16', '12/17', '12/18', '12/19', '12/20'],
    freeData: [40, 55, 32, 48, 65, 80, 58],
    paidData: [5, 7, 6, 7, 13, 12, 9],
};

// 간단한 라인 차트 (CSS 기반)
const SimpleLineChart: React.FC<{ labels: string[]; data: number[] }> = ({ labels, data }) => {
    const maxValue = Math.max(...data);
    return (
        <div className="simple-line-chart">
            <div className="line-chart-area">
                {data.map((value, index) => (
                    <div key={index} className="line-point-wrapper">
                        <div
                            className="line-point"
                            style={{ bottom: `${(value / maxValue) * 150}px` }}
                        >
                            <span className="point-value">{value}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="line-labels">
                {labels.map((label, index) => (
                    <span key={index} className="line-label">{label}</span>
                ))}
            </div>
        </div>
    );
};

// 톤 분포 바 차트
const ToneDistributionChart: React.FC = () => {
    const maxValue = Math.max(...MOCK_TONE_DISTRIBUTION.map(t => t.value));
    return (
        <div className="tone-distribution">
            {MOCK_TONE_DISTRIBUTION.map((tone, index) => (
                <div key={index} className="tone-item">
                    <span className="tone-label">{tone.label}</span>
                    <div className="tone-bar-wrapper">
                        <div
                            className="tone-bar"
                            style={{
                                width: `${(tone.value / maxValue) * 100}%`,
                                backgroundColor: tone.color
                            }}
                        />
                    </div>
                    <span className="tone-value">{tone.value}%</span>
                </div>
            ))}
        </div>
    );
};

// 스택 바 차트
const StackedBarChart: React.FC = () => {
    const maxValue = Math.max(...MOCK_PAYMENT_TREND.freeData.map((f, i) => f + MOCK_PAYMENT_TREND.paidData[i]));
    return (
        <div className="stacked-bar-chart">
            {MOCK_PAYMENT_TREND.labels.map((label, index) => {
                const freeHeight = (MOCK_PAYMENT_TREND.freeData[index] / maxValue) * 150;
                const paidHeight = (MOCK_PAYMENT_TREND.paidData[index] / maxValue) * 150;
                return (
                    <div key={index} className="stacked-bar-item">
                        <div className="stacked-bar">
                            <div className="stacked-paid" style={{ height: `${paidHeight}px` }} />
                            <div className="stacked-free" style={{ height: `${freeHeight}px` }} />
                        </div>
                        <span className="stacked-label">{label}</span>
                    </div>
                );
            })}
            <div className="stacked-legend">
                <span><span className="legend-dot free"></span> 무료</span>
                <span><span className="legend-dot paid"></span> 유료</span>
            </div>
        </div>
    );
};

export const AdminStatisticsPage: React.FC = () => {
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');

    return (
        <div className="admin-statistics-page">
            {/* 날짜 범위 선택 */}
            <div className="date-range-selector">
                <button
                    className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
                    onClick={() => setDateRange('week')}
                >
                    최근 7일
                </button>
                <button
                    className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
                    onClick={() => setDateRange('month')}
                >
                    최근 30일
                </button>
                <button
                    className={`range-btn ${dateRange === 'quarter' ? 'active' : ''}`}
                    onClick={() => setDateRange('quarter')}
                >
                    최근 90일
                </button>
            </div>

            {/* 주요 지표 */}
            <div className="key-metrics">
                <div className="metric-card">
                    <span className="metric-label">기간 내 총 작성</span>
                    <span className="metric-value">437</span>
                    <span className="metric-change positive">↑ 12.5%</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">일평균 작성</span>
                    <span className="metric-value">62.4</span>
                    <span className="metric-change positive">↑ 8.3%</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">유료 전환율</span>
                    <span className="metric-value">13.2%</span>
                    <span className="metric-change negative">↓ 2.1%</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">신고율</span>
                    <span className="metric-value">0.8%</span>
                    <span className="metric-change positive">↓ 0.3%</span>
                </div>
            </div>

            {/* 차트 그리드 */}
            <div className="charts-grid">
                <div className="chart-card large">
                    <h3>메시지 작성 추이</h3>
                    <div className="chart-container">
                        <SimpleLineChart
                            labels={MOCK_WEEKLY_TREND.labels}
                            data={MOCK_WEEKLY_TREND.data}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>톤 태그 분포</h3>
                    <div className="chart-container">
                        <ToneDistributionChart />
                    </div>
                </div>

                <div className="chart-card large">
                    <h3>무료/유료 작성 비교</h3>
                    <div className="chart-container">
                        <StackedBarChart />
                    </div>
                </div>
            </div>
        </div>
    );
};
