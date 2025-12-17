import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Connection, User } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to refresh access token
const refreshAccessToken = async (refreshToken: string) => {
    try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        return response.data.accessToken;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

// Function to set up Axios interceptors
export const setupAxiosInterceptors = (setAccessToken: (token: string | null) => void, logout: () => Promise<void>) => {
    // Request Interceptor: Attach Access Token
    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('accessToken'); // Use accessToken
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response Interceptor: Handle 401 and refresh token
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            // If error is 401 and not a refresh token request itself
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true; // Mark request as retried

                try {
                    const refreshToken = await AsyncStorage.getItem('refreshToken');
                    if (!refreshToken) {
                        // No refresh token, log out user
                        await logout();
                        return Promise.reject(error);
                    }

                    const newAccessToken = await refreshAccessToken(refreshToken);
                    setAccessToken(newAccessToken); // Update access token in state
                    await AsyncStorage.setItem('accessToken', newAccessToken); // Update in storage

                    // Retry original request with new access token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);

                } catch (refreshError) {
                    // Refresh token failed, log out user
                    await logout();
                    return Promise.reject(refreshError);
                }
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

export interface SendMessagePayload {
    message: string;
    duration: 1 | 3;
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