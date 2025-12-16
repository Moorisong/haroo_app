import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
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

    const [targetHashId, setTargetHashId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleRequest = async () => {
        setStatusMessage(null); // Clear previous messages
        if (!targetHashId.trim()) {
            setStatusMessage({ type: 'error', text: '상대방의 ID를 입력해주세요.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await requestMode({
                targetHashId: targetHashId.trim(),
            });

            setStatusMessage({ type: 'success', text: `${targetHashId.trim()}님에게 메시지 모드를 신청했습니다.` });
            // Optionally navigate after a short delay for user to read message
            setTimeout(() => {
                navigation.goBack();
            }, 2000);

        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message;
            let displayMessage = errorMessage || '알 수 없는 오류가 발생했습니다.';

            if (errorMessage === 'You already have an active or pending mode') {
                displayMessage = '현재 다른 메시지 모드가 진행 중이에요.\n한 번에 하나의 메시지 모드만 사용할 수 있어요.';
            } else if (errorMessage === 'The recipient is currently busy with another mode') {
                displayMessage = '이 사용자는 이미 다른 메시지 모드를 사용 중이에요.';
            } else if (errorMessage === 'User not found') {
                displayMessage = '해당 ID를 찾을 수 없어요.';
            } else if (errorMessage === 'Cannot request mode to yourself') {
                displayMessage = '내 ID에는 메시지 모드를 신청할 수 없어요.';
            }
            // Add more specific error messages as needed based on backend responses

            setStatusMessage({ type: 'error', text: displayMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIdChange = (text: string) => {
        setTargetHashId(text);
        if (statusMessage) {
            setStatusMessage(null); // Clear message when user starts typing again
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

                        {/* ID 입력 */}
                        <View style={styles.inputSection}>
                            <TextInput
                                style={styles.input}
                                placeholder="상대방 ID를 입력하세요"
                                placeholderTextColor={COLORS.textTertiary}
                                value={targetHashId}
                                onChangeText={handleIdChange}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Status Message Display */}
                        {statusMessage && (
                            <View style={[styles.messageContainer, statusMessage.type === 'error' ? styles.errorMessageContainer : styles.successMessageContainer]}>
                                <Text style={[styles.messageText, statusMessage.type === 'error' ? styles.errorMessageText : styles.successMessageText]}>
                                    {statusMessage.text}
                                </Text>
                            </View>
                        )}

                        {/* 신청 버튼 */}
                        <PrimaryButton
                            title={isSubmitting ? "신청 중..." : "메시지 모드 신청하기"}
                            onPress={handleRequest}
                            disabled={isSubmitting}
                        />
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
        marginBottom: SPACING.lg, // Add margin below input section
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
    messageContainer: {
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successMessageContainer: {
        backgroundColor: COLORS.successLight,
        borderWidth: 0, // Remove border
    },
    errorMessageContainer: {
        backgroundColor: COLORS.dangerLight,
        borderWidth: 0, // Remove border
    },
    messageText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium, // Assuming FONTS.medium is NanumSquare or similar. If NanumSquare is desired, it needs to be loaded and defined in theme.ts
        textAlign: 'center',
        lineHeight: FONT_SIZES.md * 1.4,
    },
    successMessageText: {
        color: COLORS.textPrimary, // Match "상대방의 ID를 입력해주세요" color
    },
    errorMessageText: {
        color: COLORS.textPrimary, // Match "상대방의 ID를 입력해주세요" color
    },
});