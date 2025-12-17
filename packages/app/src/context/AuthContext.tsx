import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupAxiosInterceptors } from '../services/api'; // Import the setup function

interface AuthContextType {
    isLoading: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    userInfo: any | null;
    login: (accessToken: string, refreshToken: string, user: any) => Promise<void>;
    logout: () => Promise<void>;
    setAccessToken: (token: string | null) => void; // For interceptor to update
    setRefreshToken: (token: string | null) => void; // For interceptor to update
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any | null>(null);

    const login = async (newAccessToken: string, newRefreshToken: string, user: any) => {
        setIsLoading(true);
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setUserInfo(user);
        await AsyncStorage.setItem('accessToken', newAccessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        setAccessToken(null);
        setRefreshToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let storedAccessToken = await AsyncStorage.getItem('accessToken');
            let storedRefreshToken = await AsyncStorage.getItem('refreshToken');
            let userInfoStr = await AsyncStorage.getItem('userInfo');

            if (storedAccessToken && storedRefreshToken) {
                setAccessToken(storedAccessToken);
                setRefreshToken(storedRefreshToken);
                if (userInfoStr) {
                    setUserInfo(JSON.parse(userInfoStr));
                }
            }
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    // Setup Axios interceptors when AuthContext is ready
    useEffect(() => {
        setupAxiosInterceptors(setAccessToken, logout);
    }, [setAccessToken, logout]); // Dependencies to re-run if these functions change

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, accessToken, refreshToken, userInfo, setAccessToken, setRefreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
