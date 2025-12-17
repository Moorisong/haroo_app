import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';

import { BubbleBackground } from '../components/BubbleBackground';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

// Kakao Auth Endpoints
const discovery = {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

export const LandingScreen: React.FC = () => {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const redirectUri = AuthSession.makeRedirectUri({
        // For usage in bare and standalone
        native: 'harooapp://auth',
        // For development workflow
        useProxy: true,
    });

    

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY || '',
            scopes: [],
            redirectUri,
        },
        discovery
    );

    useEffect(() => {
        const handleAuthResponse = async () => {
            if (response?.type === 'success') {
                setIsLoading(true);
                try {
                    const { code } = response.params;
                    // 1. Exchange code for access token
                    const tokenResponse = await axios.post(
                        discovery.tokenEndpoint,
                        null,
                        {
                            params: {
                                grant_type: 'authorization_code',
                                client_id: process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY,
                                redirect_uri: redirectUri,
                                code: code,
                                code_verifier: request.codeVerifier, // ADDED THIS LINE
                            },
                        }
                    );

                    const { access_token } = tokenResponse.data;

                    // 2. Send access token to our backend
                    const backendResponse = await api.post('/auth/kakao', {
                        token: access_token,
                    });

                    const { token: serverToken, user } = backendResponse.data;
                    
                    // 3. Login to the app
                    await login(serverToken, user);

                } catch (error: any) {
                    console.error('Authentication failed:', error.response?.data || error.message);
                    Alert.alert('로그인 실패', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
                } finally {
                    setIsLoading(false);
                }
            } else if (response?.type === 'error') {
                Alert.alert('로그인 실패', response.params.error_description || '알 수 없는 오류가 발생했습니다.');
            }
        };

        handleAuthResponse();
    }, [response]);

    const handleKakaoLogin = () => {
        if (request) {
            promptAsync();
        } else {
            Alert.alert('오류', '로그인 요청을 생성할 수 없습니다. 앱 설정을 확인해주세요.');
        }
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />
            <View style={styles.content}>
                <Image
                    source={require('../../assets/haroo_logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>오늘, 단 한줄의 마음</Text>
                    <Text style={styles.subText}>당신의 진심을 전하세요</Text>
                </View>
                <View style={styles.buttonContainer}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={COLORS.accent} />
                    ) : (
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: '#FEE500' }]}
                            onPress={handleKakaoLogin}
                            disabled={!request}
                        >
                            <Text style={styles.loginButtonText}>카카오로 시작하기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFCF8',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.4,
        height: undefined,
        aspectRatio: 1,
        marginBottom: SPACING.xxl,
    },
    textContainer: {
        alignItems: 'center',
        gap: 8,
    },
    mainText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    subText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 60,
        width: '80%',
        height: 50, // To prevent layout shift when ActivityIndicator shows
        justifyContent: 'center',
    },
    loginButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: '#000000',
    },
});