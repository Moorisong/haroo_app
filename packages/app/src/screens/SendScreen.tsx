import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { MESSAGES } from '../constants/messages';
import { PrimaryButton } from '../components/PrimaryButton';
import { BubbleBackground } from '../components/BubbleBackground';
import { sendMessage, getCurrentMode } from '../services/api';
import { AxiosError } from 'axios';
import { Connection } from '../types';

export const SendScreen: React.FC = () => {
    const navigation = useNavigation();

    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [currentMode, setCurrentMode] = useState<Connection | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentMode = async () => {
            try {
                const mode = await getCurrentMode();
                setCurrentMode(mode);
            } catch (error) {
                console.error('Failed to fetch current mode:', error);
                Alert.alert('오류', '현재 모드를 불러오는데 실패했습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCurrentMode();
    }, [navigation]);

    const checkLimit = (text: string) => {
        if (text.length <= 40) {
            setMessage(text);
        }
    };

    const handleSend = async () => {
        if (message.trim().length === 0) {
            Alert.alert('알림', '메시지를 입력해주세요.');
            return;
        }

        if (!currentMode?.id) {
            Alert.alert('오류', '활성화된 메시지 모드가 없습니다.');
            return;
        }

        setIsSending(true);
        try {
            await sendMessage({ content: message.trim(), modeId: currentMode.id });
            Alert.alert('전송 완료', '메시지가 성공적으로 전송되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            let errorMessage = axiosError.response?.data?.message || '메시지 전송에 실패했습니다.';

            if (errorMessage === 'You have already sent a message today') {
                errorMessage = `${MESSAGES.SEND.DAILY_LIMIT.TITLE}\n${MESSAGES.SEND.DAILY_LIMIT.SUB}`;
            } else if (errorMessage === 'Message Mode is not active' || errorMessage === 'Message Mode has expired') {
                errorMessage = MESSAGES.RECEIVE.EXPIRED_ACCESS.TITLE;
            } else {
                // Default fallback or mapping for 'Send fail'
                // Only prepend generic error if it's not one of the known ones above
                errorMessage = `${MESSAGES.SEND.SEND_FAIL.TITLE}\n${errorMessage}`;
            }

            Alert.alert('전송 실패', errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <BubbleBackground />
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BubbleBackground />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>메시지 작성</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={styles.content}>
                        {/* 메시지 입력 섹션 */}
                        <View style={styles.section}>
                            <Text style={styles.microCopy}>
                                한 문장이면 충분해요.{'\n'}오늘의 마음을 전해봐요.
                            </Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="메시지를 입력하세요"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={message}
                                    onChangeText={checkLimit}
                                    multiline
                                    maxLength={40}
                                />
                                <Text style={styles.counter}>{message.length} / 40</Text>
                            </View>

                            <Text style={styles.notice}>
                                이 메시지는 하루에 한 번만 보낼 수 있어요.
                            </Text>
                        </View>

                        {/* 전송 버튼 */}
                        <PrimaryButton
                            title={isSending ? '전송 중...' : '메시지 보내기'}
                            onPress={handleSend}
                            disabled={message.trim().length === 0 || isSending}
                            style={styles.sendButton}
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    section: {
        marginBottom: SPACING.xxl,
    },
    microCopy: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.serif,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
        paddingTop: SPACING.md,
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        height: 120,
        textAlignVertical: 'top',
    },
    counter: {
        position: 'absolute',
        bottom: SPACING.sm,
        right: SPACING.md,
        fontSize: FONT_SIZES.sm,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
    },
    notice: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
    sendButton: {
        marginTop: SPACING.sm,
    },
});