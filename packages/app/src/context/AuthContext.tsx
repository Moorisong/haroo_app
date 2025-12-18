import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { setupAxiosInterceptors } from '../services/api';

interface AuthContextType {
    isLoading: boolean;
    accessToken: string | null;
    userInfo: any | null;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any | null>(null);

    // 단순화된 로그인 (단일 토큰)
    const login = useCallback(async (token: string) => {
        setIsLoading(true);
        setAccessToken(token);
        await AsyncStorage.setItem('accessToken', token);
        setIsLoading(false);
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        setAccessToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    }, []);

    // 저장된 토큰 확인
    const checkStoredToken = useCallback(async () => {
        try {
            setIsLoading(true);
            const storedToken = await AsyncStorage.getItem('accessToken');
            const storedUserInfo = await AsyncStorage.getItem('userInfo');

            if (storedToken) {
                setAccessToken(storedToken);
                if (storedUserInfo) {
                    setUserInfo(JSON.parse(storedUserInfo));
                }
            }
        } catch (e) {
            console.log(`checkStoredToken error ${e}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 딥링크 처리
    const handleDeepLink = useCallback(async (url: string) => {
        console.log('[AuthContext] handleDeepLink called with:', url);
        try {
            const parsed = Linking.parse(url);
            console.log('[AuthContext] Parsed URL:', JSON.stringify(parsed));

            // 토큰 추출 시도 (여러 형식 지원)
            let token: string | null = null;

            // 1. haroo://login?token=xxx 형태
            if (parsed.queryParams?.token) {
                token = parsed.queryParams.token as string;
                console.log('[AuthContext] Token found in queryParams');
            }

            // 2. URL에서 직접 token 파라미터 추출 (fallback)
            if (!token) {
                const tokenMatch = url.match(/[?&]token=([^&]+)/);
                if (tokenMatch) {
                    token = decodeURIComponent(tokenMatch[1]);
                    console.log('[AuthContext] Token found via regex');
                }
            }

            if (token) {
                console.log('[AuthContext] Logging in with token...');
                await login(token);
                console.log('[AuthContext] Login complete!');
            } else {
                console.log('[AuthContext] No token found in URL');
            }
        } catch (error) {
            console.error('[AuthContext] Deep link handling error:', error);
        }
    }, [login]);

    // 초기화 및 딥링크 리스너 설정
    useEffect(() => {
        checkStoredToken();

        // 앱이 딥링크로 열렸는지 확인
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink(url);
            }
        });

        // 딥링크 리스너 등록 (앱이 이미 열려있을 때)
        const subscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        return () => {
            subscription.remove();
        };
    }, [checkStoredToken, handleDeepLink]);

    // Axios interceptor 설정
    useEffect(() => {
        setupAxiosInterceptors(logout);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, accessToken, userInfo }}>
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
