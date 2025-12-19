// 위젯 새로고침 유틸리티
// 앱에서 조용히 데이터를 가져와 위젯을 갱신하는 함수

import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HarooWidget } from './HarooWidget';
import { loadWidgetConfig } from './WidgetConfigScreen';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// 날짜 포맷
function formatToday(): string {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[now.getDay()];
    return `${month}월 ${day}일 ${weekDay}요일`;
}

/**
 * 위젯을 조용히 새로고침합니다.
 */
export async function refreshWidgetSilently(): Promise<void> {
    if (Platform.OS !== 'android') {
        return;
    }

    try {
        console.log('[Widget] Starting silent refresh...');

        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            console.log('[Widget] No token, skipping refresh');
            return;
        }

        // API 호출로 최신 데이터 가져오기
        const response = await fetch(`${API_URL}/messages/received/today`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.log('[Widget] API response not ok:', response.status);
            return;
        }

        const data = await response.json();
        const config = await loadWidgetConfig();

        // 메시지 데이터 파싱
        let messageStatus: 'ACTIVE' | 'EXPIRED' | 'NONE' = 'NONE';
        let messageContent: string | null = null;
        let senderName: string | null = null;

        if (data.message) {
            const isExpired = new Date(data.message.expiresAt) < new Date();
            messageStatus = isExpired ? 'EXPIRED' : 'ACTIVE';
            messageContent = data.message.content;
            senderName = typeof data.message.sender === 'object'
                ? data.message.sender.nickname || data.message.sender.hashId
                : null;
        }

        const today = formatToday();

        // requestWidgetUpdate 사용
        const { requestWidgetUpdate } = await import('react-native-android-widget');

        // Small widget
        await requestWidgetUpdate({
            widgetName: 'HarooWidgetSmall',
            renderWidget: (widgetInfo) => {
                console.log('[Widget] Rendering small widget:', widgetInfo.widgetId);
                return (
                    <HarooWidget
                        message={messageContent}
                        senderName={senderName}
                        status={messageStatus}
                        today={today}
                        size="small"
                        config={config}
                    />
                );
            },
            widgetNotFound: () => {
                console.log('[Widget] No small widgets found');
            },
        });

        // Medium widget
        await requestWidgetUpdate({
            widgetName: 'HarooWidgetMedium',
            renderWidget: (widgetInfo) => {
                console.log('[Widget] Rendering medium widget:', widgetInfo.widgetId);
                return (
                    <HarooWidget
                        message={messageContent}
                        senderName={senderName}
                        status={messageStatus}
                        today={today}
                        size="medium"
                        config={config}
                    />
                );
            },
            widgetNotFound: () => {
                console.log('[Widget] No medium widgets found');
            },
        });

        console.log('[Widget] Refresh completed');
    } catch (error) {
        console.log('[Widget] Refresh error:', error);
    }
}
