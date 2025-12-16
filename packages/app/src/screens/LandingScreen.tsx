import React from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { BubbleBackground } from '../components/BubbleBackground';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

export const LandingScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <BubbleBackground />
            <View style={styles.content}>
                {/* 로고 이미지 */}
                <Image
                    source={require('../../assets/haroo_logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* 문구 추가 */}
                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>오늘, 단 한줄의 마음</Text>
                    <Text style={styles.subText}>당신의 진심을 전하세요</Text>
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
        width: width * 0.4, // 화면 너비의 40%
        height: undefined,
        aspectRatio: 1,
        marginBottom: SPACING.xxl, // 텍스트와 여백 넓게 (48)
    },
    textContainer: {
        alignItems: 'center',
        gap: 8, // 두 줄 사이 간격
    },
    mainText: {
        fontFamily: FONTS.bold, // 나눔고딕 Bold
        fontSize: 18,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    subText: {
        fontFamily: FONTS.regular, // 나눔고딕 Regular
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
