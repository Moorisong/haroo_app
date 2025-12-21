import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Animated,
    Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';
import traceService from '../services/traceService';

// 톤 태그 목록
const TONE_TAGS = [
    { id: 'happy', emoji: '😊', label: '행복' },
    { id: 'fear', emoji: '😨', label: '공포' },
    { id: 'anger', emoji: '😡', label: '분노' },
    { id: 'monologue', emoji: '😶', label: '혼잣말' },
    { id: 'review', emoji: '📝', label: '후기' },
    { id: 'comfort', emoji: '🤍', label: '위로' },
    { id: 'other', emoji: '🪶', label: '기타' },
];

const MAX_LENGTH = 60;

import LocationService, { LocationState } from '../services/LocationService';

// 작성 권한 상태 타입 (Service에서 가져옴 - or reuse string)
// Note: Service return type is string union.

export const TraceWriteScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [content, setContent] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // 작성 권한 상태
    const [writePermission, setWritePermission] = useState<string>('FREE_AVAILABLE');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);

    // Location State
    const [locationState, setLocationState] = useState<LocationState | null>(null);

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // 진입 시 작성 권한 체크 (화면 focus 시마다 실행)
    useFocusEffect(
        React.useCallback(() => {
            checkWritePermission();
        }, [])
    );

    const checkWritePermission = async () => {
        try {
            // 위치 확인 (없으면 권한 요청)
            const loc = await LocationService.getCurrentLocation();
            setLocationState(loc);

            if (loc.errorMsg === 'PERMISSION_DENIED') {
                LocationService.showPermissionAlert();
                navigation.goBack();
                return;
            }

            if (!loc.isInKorea) {
                LocationService.showCountryRestrictionAlert();
                navigation.goBack();
                return;
            }

            const status = await traceService.getUserStatus();
            setWritePermission(status.writePermission);

            if (status.writePermission === 'FREE_USED') {
                setShowPaymentModal(true);
            } else if (status.writePermission === 'DENIED_COOLDOWN') {
                // Use server-provided nextAvailableAt for accurate cooldown timer
                if (status.nextAvailableAt) {
                    setCooldownEndTime(new Date(status.nextAvailableAt));
                } else {
                    // Fallback: 2 hours from now
                    setCooldownEndTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
                }
            }
        } catch (error) {
            console.error('Permission check failed:', error);
        }
    };

    const showToastMsg = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        Animated.sequence([
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 200,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
            Animated.delay(1500),
            Animated.timing(toastOpacity, {
                toValue: 0,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
        ]).start(() => setShowToast(false));
    };

    const handleSubmit = async () => {
        // 톤 태그 선택 확인
        if (!selectedTag) {
            showToastMsg('어떤 이야기인지 선택해주세요.');
            return;
        }

        // 내용 입력 확인
        if (!content.trim()) {
            showToastMsg('한 줄을 작성해주세요.');
            return;
        }

        // 위치 정보 확인
        if (!locationState || !locationState.isInKorea) {
            showToastMsg('위치 정보를 확인할 수 없어요.');
            return;
        }

        try {
            await traceService.createMessage(content, selectedTag, locationState.lat, locationState.lng);
            showToastMsg('한 줄이 남겨졌어요.');
            setTimeout(() => {
                // Refresh list on back?
                // Ideally navigation params or global event.
                navigation.goBack();
            }, 1000);
        } catch (error) {
            console.error('Create message failed:', error);
            showToastMsg('작성에 실패했어요.');
        }
    };

    const handlePayment = async (option: 'single' | 'threeDay') => {
        try {
            await traceService.mockPayment(option);
            setShowPaymentModal(false);
            setWritePermission('PAID_AVAILABLE');
            showToastMsg('결제가 완료되었습니다.');

            // Refund checkWritePermission implicitly later or by user action
            // Or force refresh logic?
            setWritePermission('PAID_AVAILABLE'); // Optimistic update
        } catch (error) {
            console.error(error);
            showToastMsg('결제 처리에 실패했습니다.');
        }
    };

    const formatCooldownTime = () => {
        if (!cooldownEndTime) return '';
        const diff = cooldownEndTime.getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}시간 ${minutes}분`;
    };

    // 쿨다운 상태 화면
    if (writePermission === 'DENIED_COOLDOWN') {
        return (
            <View style={styles.container}>
                <BubbleBackground />
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Feather name="x" size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>한 줄 남기기</Text>
                        <View style={styles.headerRight} />
                    </View>

                    <View style={styles.cooldownContainer}>
                        <Feather name="clock" size={48} color={COLORS.accentMuted} />
                        <Text style={styles.cooldownTitle}>잠시 쉬어가는 시간</Text>
                        <Text style={styles.cooldownDescription}>
                            다음 한 줄을 남기려면{'\n'}{formatCooldownTime()} 후에 다시 방문해주세요.
                        </Text>
                        <TouchableOpacity
                            style={styles.cooldownButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.cooldownButtonText}>돌아가기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BubbleBackground />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Feather name="x" size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>한 줄 남기기</Text>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            <Text style={[
                                styles.submitButtonText,
                                (!selectedTag || !content.trim()) && styles.submitButtonTextDisabled
                            ]}>
                                완료
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* 톤 태그 선택 */}
                        <Text style={styles.sectionLabel}>어떤 이야기인가요?</Text>
                        <View style={styles.tagContainer}>
                            {TONE_TAGS.map((tag) => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.tagButton,
                                        selectedTag === tag.id && styles.tagButtonSelected,
                                    ]}
                                    onPress={() => setSelectedTag(tag.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                                    <Text style={[
                                        styles.tagLabel,
                                        selectedTag === tag.id && styles.tagLabelSelected,
                                    ]}>
                                        {tag.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 텍스트 입력 */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="지금, 여기서 떠오르는 한 줄을 남겨보세요."
                                placeholderTextColor={COLORS.textTertiary}
                                value={content}
                                onChangeText={setContent}
                                maxLength={MAX_LENGTH}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>
                                {content.length}/{MAX_LENGTH}
                            </Text>
                        </View>
                        <Text style={styles.helperText}>
                            * 한 줄은 2시간마다 작성할 수 있어요.
                        </Text>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Toast Message */}
                {showToast && (
                    <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </Animated.View>
                )}
            </SafeAreaView>

            {/* 결제 모달 */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowPaymentModal(false);
                    navigation.goBack();
                }}
            >
                <TouchableWithoutFeedback onPress={() => {
                    setShowPaymentModal(false);
                    navigation.goBack();
                }}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.paymentModalContent}>
                                <Text style={styles.paymentTitle}>오늘의 무료 작성을 다 사용했어요</Text>
                                <Text style={styles.paymentDescription}>
                                    추가로 한 줄을 남기려면{'\n'}결제가 필요해요.
                                </Text>

                                <TouchableOpacity
                                    style={styles.paymentOption}
                                    onPress={() => handlePayment('single')}
                                >
                                    <Text style={styles.paymentOptionTitle}>1일 자유이용권</Text>
                                    <Text style={styles.paymentPrice}>₩500</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.paymentOption}
                                    onPress={() => handlePayment('threeDay')}
                                >
                                    <Text style={styles.paymentOptionTitle}>2일 자유이용권</Text>
                                    <Text style={styles.paymentPrice}>₩1,000</Text>
                                </TouchableOpacity>

                                <Text style={styles.paymentNote}>
                                    * 한 줄은 2시간마다 작성할 수 있어요.
                                </Text>

                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setShowPaymentModal(false);
                                        navigation.goBack();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>다음에 할게요</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFCF8',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xxl,
        paddingBottom: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
        marginLeft: -SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.serif,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    headerRight: {
        width: 38,
    },
    submitButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    submitButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.accent,
    },
    submitButtonTextDisabled: {
        color: COLORS.textTertiary,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        marginTop: SPACING.md,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    tagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tagButtonSelected: {
        backgroundColor: 'rgba(160, 128, 96, 0.12)',
        borderColor: COLORS.accent,
    },
    tagEmoji: {
        fontSize: 16,
    },
    tagLabel: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    tagLabelSelected: {
        color: COLORS.accent,
        fontFamily: FONTS.medium,
    },
    inputContainer: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 16,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 150,
    },
    textInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 24,
        minHeight: 100,
    },
    charCount: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
        textAlign: 'right',
        marginTop: SPACING.sm,
    },
    toast: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    toastText: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#fff',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: 20,
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        overflow: 'hidden',
    },
    // 쿨다운 화면
    cooldownContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingBottom: 150, // 조금 더 위쪽으로 배치
    },
    cooldownTitle: {
        fontSize: FONT_SIZES.xl,
        fontFamily: FONTS.serif,
        color: COLORS.textPrimary,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    cooldownDescription: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    cooldownButton: {
        backgroundColor: COLORS.buttonPrimary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: 16,
    },
    cooldownButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.buttonText,
    },
    // 결제 모달
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '85%',
        maxWidth: 340,
        padding: SPACING.lg,
    },
    paymentTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    paymentDescription: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.lg,
    },
    paymentOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(160, 128, 96, 0.08)',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(160, 128, 96, 0.15)',
    },
    paymentOptionTitle: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    paymentOptionDesc: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    paymentPrice: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.medium,
        color: COLORS.accent,
    },
    cancelButton: {
        marginTop: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 12,
    },
    cancelButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    helperText: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
        marginTop: SPACING.md,
        marginLeft: SPACING.xs,
    },
    paymentNote: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginTop: SPACING.md,
    },
});
