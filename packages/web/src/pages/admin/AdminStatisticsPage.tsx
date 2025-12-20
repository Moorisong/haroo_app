import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './AdminStatisticsPage.css';

// Chart.js 등록
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

// Mock 데이터
const MOCK_WEEKLY_TREND = {
    labels: ['12/14', '12/15', '12/16', '12/17', '12/18', '12/19', '12/20'],
    data: [45, 62, 38, 55, 78, 92, 67],
};

const MOCK_TONE_DISTRIBUTION = {
    labels: ['행복', '혼잣말', '후기', '위로', '기타', '공포', '분노'],
    data: [35, 25, 18, 12, 6, 2, 2],
    colors: ['#f1c40f', '#9b59b6', '#3498db', '#e91e63', '#95a5a6', '#1abc9c', '#e74c3c'],
};

const MOCK_PAYMENT_TREND = {
    labels: ['12/14', '12/15', '12/16', '12/17', '12/18', '12/19', '12/20'],
    freeData: [40, 55, 32, 48, 65, 80, 58],
    paidData: [5, 7, 6, 7, 13, 12, 9],
};

export const AdminStatisticsPage: React.FC = () => {
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');

    // 작성 추이 차트
    const trendChartData = {
        labels: MOCK_WEEKLY_TREND.labels,
        datasets: [
            {
                label: '메시지 작성',
                data: MOCK_WEEKLY_TREND.data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const trendChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    // 톤 태그 분포 차트
    const toneChartData = {
        labels: MOCK_TONE_DISTRIBUTION.labels,
        datasets: [
            {
                data: MOCK_TONE_DISTRIBUTION.data,
                backgroundColor: MOCK_TONE_DISTRIBUTION.colors,
                borderWidth: 0,
            },
        ],
    };

    const toneChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
            },
        },
    };

    // 무료/유료 비교 차트
    const paymentChartData = {
        labels: MOCK_PAYMENT_TREND.labels,
        datasets: [
            {
                label: '무료 작성',
                data: MOCK_PAYMENT_TREND.freeData,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
            },
            {
                label: '유료 작성',
                data: MOCK_PAYMENT_TREND.paidData,
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
            },
        ],
    };

    const paymentChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                beginAtZero: true,
            },
        },
    };

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
                        <Line data={trendChartData} options={trendChartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>톤 태그 분포</h3>
                    <div className="chart-container doughnut">
                        <Doughnut data={toneChartData} options={toneChartOptions} />
                    </div>
                </div>

                <div className="chart-card large">
                    <h3>무료/유료 작성 비교</h3>
                    <div className="chart-container">
                        <Bar data={paymentChartData} options={paymentChartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};
