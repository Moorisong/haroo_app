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
import { MESSAGES } from '../constants/messages';
import { PrimaryButton } from '../components/PrimaryButton';
import { BubbleBackground } from '../components/BubbleBackground';
import { requestMode } from '../services/api';
import { AxiosError } from 'axios';

export const RequestScreen: React.FC = () => {
    const navigation = useNavigation();

    const [targetHashId, setTargetHashId] = useState('');
    const [durationDays, setDurationDays] = useState<1 | 3>(1);
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
                durationDays,
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
                displayMessage = `${MESSAGES.REQUEST_UNAVAILABLE.SELF_BUSY.TITLE}\n${MESSAGES.REQUEST_UNAVAILABLE.SELF_BUSY.SUB}`;
            } else if (errorMessage === 'The recipient is currently busy with another mode') {
                displayMessage = MESSAGES.REQUEST_UNAVAILABLE.PEER_BUSY.TITLE;
            } else if (errorMessage === 'User not found') {
                displayMessage = `${MESSAGES.ID_INPUT.NOT_FOUND.TITLE}\n${MESSAGES.ID_INPUT.NOT_FOUND.SUB}`;
            } else if (errorMessage === 'Cannot request mode to yourself') {
                displayMessage = MESSAGES.ID_INPUT.SELF.TITLE;
            } else if (errorMessage === 'You are blocked by this user') {
                displayMessage = MESSAGES.REQUEST_UNAVAILABLE.BLOCKED_BY_PEER.TITLE;
            } else if (errorMessage === 'You have blocked this user') {
                displayMessage = '차단한 사용자에게는\n메시지 모드를 신청할 수 없어요.\n설정에서 차단을 해제하면 다시 신청할 수 있어요.';
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

                        {/* 기간 선택 */}
                        <View style={styles.durationSection}>
                            <Text style={styles.sectionLabel}>기간 선택</Text>
                            <View style={styles.durationOptions}>
                                {([1, 3] as const).map((days) => (
                                    <TouchableOpacity
                                        key={days}
                                        style={[
                                            styles.durationOption,
                                            durationDays === days && styles.durationOptionSelected
                                        ]}
                                        onPress={() => setDurationDays(days)}
                                    >
                                        <Text style={[
                                            styles.durationText,
                                            durationDays === days && styles.durationTextSelected
                                        ]}>
                                            {days}일
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.durationHint}>
                                선택한 기간 동안 하루에 한 번 메시지를 보낼 수 있어요.{'\n'}
                                상대방은 이 조건을 보고 수락 여부를 결정해요.
                            </Text>
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
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
    },
    messageContainer: {
        marginBottom: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successMessageContainer: {
        // 배경색 없음
    },
    errorMessageContainer: {
        // 배경색 없음
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
    durationSection: {
        marginBottom: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    durationOptions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    durationOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
    },
    durationOptionSelected: {
        borderColor: COLORS.accent,
        backgroundColor: '#FFFBF5',
    },
    durationText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    durationTextSelected: {
        color: COLORS.accent,
        fontFamily: FONTS.bold,
    },
    durationHint: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
});