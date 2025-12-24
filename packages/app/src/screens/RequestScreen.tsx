import React, { useState, useEffect, useRef } from 'react';
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
import { AxiosError } from 'axios';
import {
    initBilling,
    endBilling,
    buyProduct,
    verifyPurchaseWithServer,
    completePurchase,
    setupPurchaseListeners,
    PRODUCT_IDS,
    type Purchase,
} from '../services/billing';

export const RequestScreen: React.FC = () => {
    const navigation = useNavigation();

    const [targetHashId, setTargetHashId] = useState('');
    const [durationDays, setDurationDays] = useState<1 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ref로 최신 targetHashId 유지 (리스너 클로저 문제 방지)
    const targetHashIdRef = useRef(targetHashId);
    useEffect(() => {
        targetHashIdRef.current = targetHashId;
    }, [targetHashId]);

    // IAP 초기화 및 리스너 설정
    useEffect(() => {
        initBilling();

        if (Platform.OS !== 'web') {
            setupPurchaseListeners(
                // 구매 완료 핸들러
                async (purchase: Purchase) => {
                    console.log('[RequestScreen] Purchase updated:', purchase);

                    const currentTargetHashId = targetHashIdRef.current;

                    if (purchase.purchaseToken && currentTargetHashId) {
                        // 서버에 검증 요청
                        const result = await verifyPurchaseWithServer(
                            purchase.productId,
                            purchase.purchaseToken,
                            currentTargetHashId
                        );

                        if (result.success) {
                            // 트랜잭션 완료 처리
                            await completePurchase(purchase);

                            setStatusMessage({
                                type: 'success',
                                text: `${currentTargetHashId}님에게 메시지 모드를 신청했습니다.`,
                            });

                            setTimeout(() => {
                                navigation.goBack();
                            }, 2000);
                        } else {
                            setStatusMessage({
                                type: 'error',
                                text: result.error || '결제 검증에 실패했습니다.',
                            });
                        }

                        setIsSubmitting(false);
                    }
                },
                // 구매 에러 핸들러
                (error: any) => {
                    console.log('[RequestScreen] Purchase error:', error);

                    if (error.code !== 'E_USER_CANCELLED') {
                        setStatusMessage({
                            type: 'error',
                            text: '결제 중 오류가 발생했습니다.',
                        });
                    }

                    setIsSubmitting(false);
                }
            );
        }

        return () => {
            endBilling();
        };
    }, [navigation, targetHashId]);

    const handleRequest = async () => {
        setStatusMessage(null);

        if (!targetHashId.trim()) {
            setStatusMessage({ type: 'error', text: '상대방의 ID를 입력해주세요.' });
            return;
        }

        setIsSubmitting(true);

        try {
            // 상품 ID 결정
            const productId = durationDays === 1
                ? PRODUCT_IDS.MESSAGE_MODE_1DAY
                : PRODUCT_IDS.MESSAGE_MODE_3DAY;

            // 결제 요청
            const purchaseResult = await buyProduct(productId);

            if (!purchaseResult.success) {
                setStatusMessage({
                    type: 'error',
                    text: purchaseResult.error || '결제가 취소되었습니다.',
                });
                setIsSubmitting(false);
                return;
            }

            // 웹 환경에서는 바로 서버 검증
            if (Platform.OS === 'web' && purchaseResult.purchaseToken) {
                const result = await verifyPurchaseWithServer(
                    productId,
                    purchaseResult.purchaseToken,
                    targetHashId.trim()
                );

                if (result.success) {
                    setStatusMessage({
                        type: 'success',
                        text: `${targetHashId.trim()}님에게 메시지 모드를 신청했습니다.`,
                    });

                    setTimeout(() => {
                        navigation.goBack();
                    }, 2000);
                } else {
                    setStatusMessage({
                        type: 'error',
                        text: result.error || '결제 검증에 실패했습니다.',
                    });
                }

                setIsSubmitting(false);
            }

            // Android에서는 purchaseUpdatedListener에서 처리됨

        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message;
            let displayMessage = errorMessage || '알 수 없는 오류가 발생했습니다.';

            if (errorMessage === 'You already have an active or pending mode') {
                displayMessage = `${MESSAGES.REQUEST_UNAVAILABLE.SELF_BUSY.TITLE}\n${MESSAGES.REQUEST_UNAVAILABLE.SELF_BUSY.SUB}`;
            } else if (errorMessage === 'The recipient is currently busy with another mode') {
                displayMessage = MESSAGES.REQUEST_UNAVAILABLE.PEER_BUSY.TITLE;
            } else if (errorMessage === 'User not found' || errorMessage === 'Recipient not found') {
                displayMessage = `${MESSAGES.ID_INPUT.NOT_FOUND.TITLE}\n${MESSAGES.ID_INPUT.NOT_FOUND.SUB}`;
            } else if (errorMessage === 'Cannot request mode to yourself') {
                displayMessage = MESSAGES.ID_INPUT.SELF.TITLE;
            } else if (errorMessage === 'You are blocked by this user') {
                displayMessage = MESSAGES.REQUEST_UNAVAILABLE.BLOCKED_BY_PEER.TITLE;
            } else if (errorMessage === 'You have blocked this user') {
                displayMessage = '차단한 사용자에게는\n메시지 모드를 신청할 수 없어요.\n설정에서 차단을 해제하면 다시 신청할 수 있어요.';
            }

            setStatusMessage({ type: 'error', text: displayMessage });
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
                                <TouchableOpacity
                                    style={[
                                        styles.durationOption,
                                        durationDays === 1 && styles.durationOptionSelected
                                    ]}
                                    onPress={() => setDurationDays(1)}
                                >
                                    <Text style={[
                                        styles.durationText,
                                        durationDays === 1 && styles.durationTextSelected
                                    ]}>
                                        1일
                                    </Text>
                                    <Text style={[
                                        styles.priceText,
                                        durationDays === 1 && styles.priceTextSelected
                                    ]}>
                                        500원
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.durationOption,
                                        durationDays === 3 && styles.durationOptionSelected
                                    ]}
                                    onPress={() => setDurationDays(3)}
                                >
                                    <Text style={[
                                        styles.durationText,
                                        durationDays === 3 && styles.durationTextSelected
                                    ]}>
                                        3일
                                    </Text>
                                    <Text style={[
                                        styles.priceText,
                                        durationDays === 3 && styles.priceTextSelected
                                    ]}>
                                        1,000원
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.durationHint}>
                                선택한 기간 동안 하루에 한 번 메시지를 보낼 수 있어요.{'\n'}
                                결제 완료 후 상대방에게 신청이 전송됩니다.
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
                            title={isSubmitting ? "결제 진행 중..." : `${durationDays === 1 ? '500원' : '1,000원'} 결제하고 신청하기`}
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
        paddingVertical: SPACING.lg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        gap: 4,
    },
    durationOptionSelected: {
        borderColor: COLORS.accent,
        backgroundColor: '#FFFBF5',
        borderWidth: 2,
    },
    durationText: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    durationTextSelected: {
        color: COLORS.accent,
        fontFamily: FONTS.bold,
    },
    priceText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },
    priceTextSelected: {
        color: COLORS.accent,
        fontFamily: FONTS.medium,
    },
    durationHint: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
});