import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Connection, User } from '../types';

// Android Simulator/Emulator -> 10.0.2.2
// iOS Simulator -> localhost
// Web -> localhost
const BASE_URL = Platform.select({
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
});

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
    targetUserId: string;
    duration: 1 | 3;
}

export const requestMode = async (payload: RequestModePayload): Promise<Connection> => {
    try {
        const response = await api.post<Connection>('/modes/request', payload);
        return response.data;
    } catch (error) {
        console.error('Error requesting mode:', error);
        // Re-throw the error so the component can handle it
        throw error;
    }
};

export const acceptMode = async (id: string): Promise<Connection> => {
    try {
        const response = await api.post<Connection>(`/modes/accept/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error accepting mode:', error);
        throw error;
    }
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

export default api;
