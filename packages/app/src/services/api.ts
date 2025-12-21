import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Connection, User } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to set up Axios interceptors
export const setupAxiosInterceptors = (logout: () => Promise<void>) => {
    // Request Interceptor: Attach Access Token
    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response Interceptor: Handle 401 (token expired) = logout
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401) {
                // 토큰 만료 또는 유효하지 않음 → 로그아웃
                await logout();
            }
            return Promise.reject(error);
        }
    );
};

// Export the configured axios instance
export default api;


export const getCurrentMode = async (): Promise<Connection> => {
    try {
        const response = await api.get<Connection>('/modes/current');
        return response.data;
    } catch (error) {
        console.error('Error fetching current mode:', error);
        throw error;
    }
};

export interface RequestModePayload {
    targetHashId: string;
    durationDays: 1 | 3;
}

export const requestMode = async (payload: RequestModePayload): Promise<Connection> => {
    try {
        const response = await api.post<Connection>('/modes/request', payload);
        return response.data;
    } catch (error) {
        console.error('Error requesting mode:', error);
        throw error;
    }
};

export const acceptMode = async (modeId: string) => {
    const response = await api.post(`/modes/accept/${modeId}`);
    return response.data;
};

export const rejectMode = async (modeId: string) => {
    const response = await api.post(`/modes/reject/${modeId}`);
    return response.data;
};

export const blockRequest = async (modeId: string) => {
    const response = await api.post(`/modes/block/${modeId}`);
    return response.data;
};

export const getUserProfile = async (): Promise<User> => {
    try {
        const response = await api.get<User>('/users/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export interface SendMessagePayload {
    content: string;
    modeId: string;
}

export const sendMessage = async (payload: SendMessagePayload): Promise<any> => {
    try {
        const response = await api.post('/messages', payload);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export interface ReceivedMessage {
    _id: string;
    modeId: string;
    sender: { _id: string; hashId: string; nickname?: string } | string;
    content: string;
    isRead: boolean;
    sentAt: string;
    createdAt: string;
}

export const getTodayReceivedMessage = async (): Promise<{ message: ReceivedMessage | null }> => {
    try {
        const response = await api.get<{ message: ReceivedMessage | null }>('/messages/received/today');
        return response.data;
    } catch (error) {
        console.error('Error fetching today received message:', error);
        throw error;
    }
};

export const markMessageAsRead = async (messageId: string): Promise<any> => {
    try {
        const response = await api.post(`/messages/${messageId}/read`);
        return response.data;
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
};

export interface UserSettings {
    displayMode: 'WIDGET' | 'NOTIFICATION';
}

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<any> => {
    try {
        const response = await api.patch('/users/settings', settings);
        return response.data;
    } catch (error) {
        console.error('Error updating user settings:', error);
        throw error;
    }
};

export const blockUser = async (targetHashId: string): Promise<any> => {
    try {
        const response = await api.post('/users/block', { targetHashId });
        return response.data;
    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
};

export interface BlockedUser {
    hashId: string;
    nickname?: string;
}

export const getBlockedUsers = async (): Promise<{ blockedUsers: BlockedUser[] }> => {
    try {
        const response = await api.get<{ blockedUsers: BlockedUser[] }>('/users/blocked');
        return response.data;
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        throw error;
    }
};

export const unblockUser = async (targetHashId: string): Promise<any> => {
    try {
        const response = await api.delete(`/users/block/${targetHashId}`);
        return response.data;
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
};

// Test Tools API
export const advanceDay = async (days: number = 1) => {
    const response = await api.post('/test-tools/advance-day', { days });
    return response.data;
};

export const advanceHours = async (hours: number = 12) => {
    const response = await api.post('/test-tools/advance-hours', { hours });
    return response.data;
};

export const resetMainTestState = async () => {
    const response = await api.post('/test-tools/reset-main');
    return response.data;
};

export const resetTraceTestState = async () => {
    const response = await api.post('/test-tools/reset-trace');
    return response.data;
};

export const getTestStatus = async () => {
    const response = await api.get('/test-tools/status');
    return response.data;
};

export const createTestUser = async () => {
    const response = await api.post('/test-tools/create-test-user');
    return response.data;
};

export const createTestConnection = async () => {
    const response = await api.post('/test-tools/create-connection');
    return response.data;
};

export const forceActivateMessageMode = async (durationDays: 1 | 3) => {
    const response = await api.post('/test-tools/force-activate', { durationDays });
    return response.data;
};

export const forceExpireMessageMode = async () => {
    const response = await api.post('/test-tools/force-expire');
    return response.data;
};

export const forceRejectMessageMode = async () => {
    const response = await api.post('/test-tools/force-reject');
    return response.data;
};

export const getTestMessageLogs = async () => {
    const response = await api.get('/test-tools/message-logs');
    return response.data;
};

export const getTestPushLogs = async () => {
    const response = await api.get('/test-tools/push-logs');
    return response.data;
};