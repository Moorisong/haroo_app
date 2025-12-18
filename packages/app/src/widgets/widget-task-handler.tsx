import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { HarooWidget } from './HarooWidget';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface MessageData {
    status: 'ACTIVE' | 'EXPIRED' | 'NONE';
    message: string | null;
    senderName: string | null;
}

async function fetchLatestMessage(): Promise<MessageData> {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            return { status: 'NONE', message: null, senderName: null };
        }

        const response = await fetch(`${API_URL}/messages/received/today`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return { status: 'NONE', message: null, senderName: null };
        }

        const data = await response.json();

        if (data.message) {
            const isExpired = new Date(data.message.expiresAt) < new Date();
            return {
                status: isExpired ? 'EXPIRED' : 'ACTIVE',
                message: data.message.content,
                senderName: typeof data.message.sender === 'object'
                    ? data.message.sender.nickname || data.message.sender.hashId
                    : null,
            };
        }

        return { status: 'NONE', message: null, senderName: null };
    } catch (error) {
        console.error('Widget fetch error:', error);
        return { status: 'NONE', message: null, senderName: null };
    }
}

function formatToday(): string {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[now.getDay()];
    return `${month}월 ${day}일 ${weekDay}요일`;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const widgetInfo = props.widgetInfo;
    const Widget = props.renderWidget;

    if (widgetInfo.widgetName !== 'HarooWidget') {
        return;
    }

    const { status, message, senderName } = await fetchLatestMessage();
    const today = formatToday();

    Widget(
        <HarooWidget
            message={message}
            senderName={senderName}
            status={status}
            today={today}
        />
    );
}
