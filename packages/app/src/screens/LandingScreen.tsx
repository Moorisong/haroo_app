import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Text, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { BubbleBackground } from '../components/BubbleBackground';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { APP_CONSTANTS } from '../constants/app';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// 환경변수에서 값 가져오기 (REST API 키 사용)
const KAKAO_CLIENT_ID = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const SERVER_REDIRECT_URI = process.env.EXPO_PUBLIC_SERVER_REDIRECT_URI || 'https://server.haroo.site/auth/kakao';

console.log('[LandingScreen] KAKAO_CLIENT_ID:', KAKAO_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('[LandingScreen] SERVER_REDIRECT_URI:', SERVER_REDIRECT_URI);

export const LandingScreen: React.FC = () => {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleKakaoLogin = async () => {
        console.log('[LandingScreen] handleKakaoLogin called');
        console.log('[LandingScreen] KAKAO_CLIENT_ID:', KAKAO_CLIENT_ID);

        if (!KAKAO_CLIENT_ID) {
            Alert.alert('오류', 'Kakao Client ID가 설정되지 않았습니다.');
            return;
        }

        setIsLoading(true);
        try {
            // 카카오 OAuth 인증 URL 생성
            const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(SERVER_REDIRECT_URI)}&response_type=code`;

            console.log('[LandingScreen] Opening URL:', kakaoAuthUrl);

            // openAuthSessionAsync 사용 - OAuth 플로우에 최적화됨
            const result = await WebBrowser.openAuthSessionAsync(
                kakaoAuthUrl,
                SERVER_REDIRECT_URI  // 서버 redirect URI를 returnUrl로 사용
            );

            console.log('[LandingScreen] WebBrowser result:', JSON.stringify(result));

            // 결과 처리
            if (result.type === 'success' && result.url) {
                // URL에서 토큰 추출 시도
                const url = result.url;
                console.log('[LandingScreen] Success URL:', url);

                // haroo://login?token=xxx 또는 exp://xxx/--/login?token=xxx 형식
                const tokenMatch = url.match(/[?&]token=([^&]+)/);
                if (tokenMatch) {
                    const token = decodeURIComponent(tokenMatch[1]);
                    console.log('[LandingScreen] Token extracted, logging in...');
                    await login(token);
                }
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
                console.log('[LandingScreen] Auth cancelled or dismissed');
            }
        } catch (error) {
            console.error('[LandingScreen] Kakao login error:', error);
            Alert.alert('로그인 실패', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
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
                        >
                            <Text style={styles.loginButtonText}>카카오로 시작하기</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.consentContainer}>
                    <Text style={styles.consentText}>
                        계속 진행하면{' '}
                        <Text
                            style={styles.consentLink}
                            onPress={() => Linking.openURL(APP_CONSTANTS.TERMS_URL)}
                        >
                            이용약관
                        </Text>
                        {' '}및{' '}
                        <Text
                            style={styles.consentLink}
                            onPress={() => Linking.openURL(APP_CONSTANTS.PRIVACY_URL)}
                        >
                            개인정보처리방침
                        </Text>
                        에 동의한 것으로 간주합니다.
                    </Text>
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
    consentContainer: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    consentText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
    consentLink: {
        color: COLORS.accent,
        textDecorationLine: 'underline',
    },
});