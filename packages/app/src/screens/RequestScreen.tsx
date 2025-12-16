import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { BubbleBackground } from '../components/BubbleBackground';
import { requestMode } from '../services/api';
import { AxiosError } from 'axios';

export const RequestScreen: React.FC = () => {
    const navigation = useNavigation();

    const [targetId, setTargetId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequest = async () => {
        if (!targetId.trim()) {
            Alert.alert('알림', '상대방의 ID를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestMode({
                targetUserId: targetId.trim(),
            });

            Alert.alert('신청 완료', `${targetId.trim()}님에게 메시지 모드를 신청했습니다.`, [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || '알 수 없는 오류가 발생했습니다.';
            Alert.alert('신청 실패', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>메시지 모드 신청</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={styles.content}>
                        {/* 상단 안내 */}
                        <View style={styles.section}>
                            <Text style={styles.title}>상대방의 ID를{'\n'}입력해 주세요.</Text>
                            <Text style={styles.subTitle}>
                                상대방에게는{'\n'}내 ID를 공유해야 신청을 받을 수 있어요.
                            </Text>
                        </View>

                        {/* ID 입력 및 신청 버튼 */}
                        <View style={styles.inputSection}>
                            <TextInput
                                style={styles.input}
                                placeholder="상대방 ID를 입력하세요"
                                placeholderTextColor={COLORS.textTertiary}
                                value={targetId}
                                onChangeText={setTargetId}
                                autoCapitalize="none"
                            />
                            <PrimaryButton
                                title={isSubmitting ? "신청 중..." : "메시지 모드 신청하기"}
                                onPress={handleRequest}
                                disabled={isSubmitting}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFCF8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: SPACING.md,
    },
    backButton: {
        padding: 4,
        marginRight: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    scrollContent: {
        flexGrow: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
        justifyContent: 'center', // Center content vertically
    },
    section: {
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 22,
        fontFamily: FONTS.serif,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        lineHeight: 32,
    },
    subTitle: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    inputSection: {
        gap: SPACING.lg,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
    },
});