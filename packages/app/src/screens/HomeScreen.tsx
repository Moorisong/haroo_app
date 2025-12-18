import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Animated,
    Easing,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { Connection, User } from '../types';
import { getCurrentMode, getUserProfile, acceptMode, rejectMode, blockRequest, getTodayReceivedMessage, ReceivedMessage } from '../services/api';
import { MESSAGES } from '../constants/messages';

import { BubbleBackground } from '../components/BubbleBackground';
import { UserIdCard } from '../components/UserIdCard';
import { PrimaryButton } from '../components/PrimaryButton';

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [connection, setConnection] = useState<Connection | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [receivedMessage, setReceivedMessage] = useState<ReceivedMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = React.useRef(new Animated.Value(0)).current;

    // Local state for receiver message card
    const [isMessageClosed, setIsMessageClosed] = useState(false);

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
            Animated.delay(1200),
            Animated.timing(toastOpacity, {
                toValue: 0,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
        ]).start(() => setShowToast(false));
    };

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [connectionData, userData, messageData] = await Promise.all([
                getCurrentMode(),
                getUserProfile(),
                getTodayReceivedMessage(),
            ]);
            setConnection(connectionData);
            setUser(userData);
            setReceivedMessage(messageData.message);
        } catch (err) {
            setError('정보를 불러오는 데 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleCopyId = async () => {
        if (!user?.hashId) return;
        await Clipboard.setStringAsync(user.hashId);
        Alert.alert('', 'ID가 복사되었어요.');
    };

    const handleRequestMode = () => navigation.navigate('Request');
    const handleSendMessage = () => navigation.navigate('Send');

    const handleAccept = async (id: string) => {
        try {
            await acceptMode(id);
            // Show Toast as per spec
            showToastMsg(MESSAGES.PENDING_RECEIVER.TOAST.ACCEPT_COMPLETE);
            await fetchData();
        } catch (err) {
            Alert.alert('수락 실패', '요청을 수락하는 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectMode(id);
            // Alert removed as per request
            await fetchData();
        } catch (err) {
            Alert.alert('거절 실패', '요청을 거절하는 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    const handleBlockRequest = async (id: string) => {
        try {
            await blockRequest(id);
            // Show Toast and refresh
            showToastMsg('차단했어요');
            await fetchData();
        } catch (err) {
            Alert.alert('차단 실패', '요청을 차단하는 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    const getDaysRemaining = () => {
        if (!connection?.endDate) return 0;
        const today = new Date();
        const endDate = new Date(connection.endDate);
        const diffTime = Math.max(endDate.getTime() - today.getTime(), 0);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={COLORS.accent} />;
        }

        if (error) {
            return <Text style={styles.errorText}>{error}</Text>;
        }

        // 1. Determine Identity (Sender vs Receiver)
        let isReceiver = false;
        if (connection && connection.initiator) {
            const initiatorId = typeof connection.initiator === 'string'
                ? connection.initiator
                : (connection.initiator as any)?._id || (connection.initiator as any)?.id;

            // user._id 또는 user.id와 initiator 비교
            const currentUserId = user?._id || user?.id;

            // user.id matches initiator -> Sender
            // user.id does NOT match initiator -> Receiver
            if (initiatorId) {
                isReceiver = currentUserId !== initiatorId.toString();
            }

            console.log('[HomeScreen] currentUserId:', currentUserId, 'initiatorId:', initiatorId, 'isReceiver:', isReceiver);
        }
        // If no connection, default to Sender view (NoneStateContent) so user can initiate request
        // isReceiver remains false

        // 2. Receiver View
        if (isReceiver) {
            // Pending Request
            if (connection?.status === 'PENDING') {
                return (
                    <PendingReceiverContent
                        connection={connection}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onBlock={handleBlockRequest}
                    />
                );
            }

            // Receiver in ACTIVE state -> Show same UI, but hide send button
            return (
                <ActiveStateContent
                    daysRemaining={getDaysRemaining()}
                    canSendToday={false}
                    onSendMessage={handleSendMessage}
                    hasNewMessage={receivedMessage !== null}
                    onViewMessage={() => navigation.navigate('Receive')}
                    isReceiver={true}
                />
            );
        }

        // 3. Sender View (Existing Logic)
        const status = connection?.status || 'NONE';

        if (status === 'PENDING') {
            return <PendingSenderContent />;
        }

        if (status === 'ACTIVE_PERIOD') {
            return (
                <ActiveStateContent
                    daysRemaining={getDaysRemaining()}
                    canSendToday={connection?.canSendToday ?? false}
                    onSendMessage={handleSendMessage}
                    hasNewMessage={receivedMessage !== null}
                    onViewMessage={() => navigation.navigate('Receive')}
                    isReceiver={false}
                />
            );
        }

        if (status === 'EXPIRED' || status === 'REJECTED') {
            return <ExpiredStateContent onRequest={handleRequestMode} />;
        }

        return <NoneStateContent onRequest={handleRequestMode} />;
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {user && (
                        <View style={styles.header}>
                            <UserIdCard
                                userId={user.hashId}
                                onCopy={handleCopyId}
                            />
                            <TouchableOpacity
                                style={styles.settingsButton}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Feather name="settings" size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.content}>
                        {renderContent()}
                    </View>
                </ScrollView>
                {/* Toast Message */}
                {showToast && (
                    <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </Animated.View>
                )}
            </SafeAreaView>
        </View>
    );
};

// ==================== 상태별 컴포넌트 ====================

const NoneStateContent: React.FC<{ onRequest: () => void }> = ({ onRequest }) => (
    <View style={styles.stateContainer}>
        <View style={styles.centerContent}>
            <View style={styles.mainTextContainer}>
                <Text style={styles.mainText}>오늘, 마음을 전할{'\n'}사람이 있나요?</Text>
            </View>
        </View>
        <View style={styles.buttonContainer}>
            <PrimaryButton title="메시지 모드 신청하기" onPress={onRequest} />
        </View>
    </View>
);


const PendingSenderContent: React.FC = () => {
    const [activeDot, setActiveDot] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDot((prev) => (prev + 1) % 3);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.stateContainer}>
            <View style={styles.centerContent}>
                <View style={styles.mainTextContainer}>
                    <Text style={styles.mainText}>상대의 수락을{'\n'}기다리고 있어요.</Text>
                </View>
                <Text style={styles.subText}>
                    메시지 모드가 활성화되면{'\n'}하루에 한 번 메시지를 보낼 수 있어요.
                </Text>
                <View style={styles.waitingIndicator}>
                    <View style={[styles.dot, activeDot === 0 && styles.dotActive]} />
                    <View style={[styles.dot, activeDot === 1 && styles.dotActive]} />
                    <View style={[styles.dot, activeDot === 2 && styles.dotActive]} />
                </View>
            </View>
        </View>
    );
};


interface PendingReceiverProps {
    connection: Connection;
    onAccept: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
    onBlock: (id: string) => Promise<void>;
}

const PendingReceiverContent: React.FC<PendingReceiverProps> = ({ connection, onAccept, onReject, onBlock }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAcceptPress = async () => {
        setIsProcessing(true);
        await onAccept(connection._id);
        setIsProcessing(false);
    };

    const handleRejectPress = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm('거절하시겠습니까?\n상대방에게 알림이 가지 않습니다.')) {
                setIsProcessing(true);
                await onReject(connection._id);
                setIsProcessing(false);
            }
        } else {
            Alert.alert(
                '거절하시겠습니까?',
                '상대방에게 알림이 가지 않습니다.',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '거절하기',
                        style: 'destructive',
                        onPress: async () => {
                            setIsProcessing(true);
                            await onReject(connection._id);
                            setIsProcessing(false);
                        }
                    }
                ]
            );
        }
    };

    const handleBlockPress = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm('차단하시겠습니까?\n이 발신자는 더 이상 신청이나 메시지를 보낼 수 없습니다.')) {
                setIsProcessing(true);
                await onBlock(connection._id);
                setIsProcessing(false);
            }
        } else {
            Alert.alert(
                '차단하시겠습니까?',
                '이 발신자는 더 이상 신청이나 메시지를 보낼 수 없습니다.',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '차단하기',
                        style: 'destructive',
                        onPress: async () => {
                            setIsProcessing(true);
                            await onBlock(connection._id);
                            setIsProcessing(false);
                        }
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.stateContainer}>
            <View style={styles.centerContent}>
                <View style={styles.mainTextContainer}>
                    <Text style={styles.mainText}>{MESSAGES.PENDING_RECEIVER.TITLE}</Text>
                </View>
                <Text style={styles.subText}>
                    {MESSAGES.PENDING_RECEIVER.SUB}
                </Text>
                {connection.durationDays && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeText}>
                            {connection.durationDays}일 동안 하루 1회 메시지를 받게 됩니다
                        </Text>
                    </View>
                )}
            </View>
            <View style={[styles.buttonContainer, { marginBottom: SPACING.xxl + 20 }]}>
                <PrimaryButton
                    title={isProcessing ? "처리 중..." : MESSAGES.PENDING_RECEIVER.BUTTON.ACCEPT}
                    onPress={handleAcceptPress}
                    disabled={isProcessing}
                />

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleRejectPress}
                    disabled={isProcessing}
                >
                    <Text style={styles.secondaryButtonText}>{MESSAGES.PENDING_RECEIVER.BUTTON.REJECT}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.blockTextButton}
                    onPress={handleBlockPress}
                    disabled={isProcessing}
                >
                    <Text style={styles.blockTextLabel}>{MESSAGES.PENDING_RECEIVER.BUTTON.BLOCK}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

interface ActiveStateContentProps {
    daysRemaining: number;
    canSendToday: boolean;
    onSendMessage: () => void;
    hasNewMessage?: boolean;
    onViewMessage?: () => void;
    isReceiver?: boolean;
}

const ActiveStateContent: React.FC<ActiveStateContentProps> = ({
    daysRemaining,
    canSendToday,
    onSendMessage,
    hasNewMessage,
    onViewMessage,
    isReceiver = false
}) => {
    // 애니메이션 값
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (hasNewMessage) {
            // 부드러운 펄스 애니메이션
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.03,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // 반짝이 애니메이션
            Animated.loop(
                Animated.sequence([
                    Animated.timing(sparkleAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(sparkleAnim, {
                        toValue: 0,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [hasNewMessage, pulseAnim, sparkleAnim]);

    return (
        <View style={styles.stateContainer}>
            <View style={styles.centerContent}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>메시지 모드 진행 중</Text>
                </View>
                <Text style={styles.dDay}>D-{daysRemaining}</Text>

                {/* 새 메시지 알림 with 애니메이션 */}
                {hasNewMessage && (
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity style={styles.newMessageBadge} onPress={onViewMessage}>
                            <Animated.Text style={[styles.newMessageSparkle, { opacity: sparkleAnim }]}>📩</Animated.Text>
                            <Text style={styles.newMessageText}>오늘의 메시지가 도착했어요</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* 발신자에게만 전송 상태 표시 */}
                {!isReceiver && (
                    <Text style={styles.sendStatus}>
                        {canSendToday ? '오늘 메시지 전송 가능' : '오늘 메시지를 이미 보냈어요'}
                    </Text>
                )}
            </View>
            {/* 발신자에게만 보내기 버튼 표시 */}
            {!isReceiver && (
                <View style={styles.buttonContainer}>
                    <PrimaryButton
                        title="오늘의 메시지 보내기"
                        onPress={onSendMessage}
                        disabled={!canSendToday}
                    />
                </View>
            )}
        </View>
    );
};

const ExpiredStateContent: React.FC<{ onRequest: () => void }> = ({ onRequest }) => (
    <View style={styles.stateContainer}>
        <View style={styles.centerContent}>
            <View style={styles.mainTextContainer}>
                <Text style={styles.mainText}>메시지 모드가{'\n'}종료되었어요.</Text>
            </View>
        </View>
        <View style={styles.buttonContainer}>
            <PrimaryButton title="다시 신청하기" onPress={onRequest} />
        </View>
    </View>
);

// ==================== 스타일 ====================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFCF8' },
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xxl + 10,
        gap: SPACING.sm,
    },
    settingsButton: {
        padding: SPACING.sm,
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 14,
    },
    content: { flex: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    stateContainer: { flex: 1, justifyContent: 'space-between' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -60 },
    mainTextContainer: { alignItems: 'center', marginBottom: SPACING.lg },
    mainText: { fontSize: 28, color: COLORS.textPrimary, fontWeight: 'bold', fontFamily: FONTS.serif, textAlign: 'center', lineHeight: 42 },
    subText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
    durationBadge: {
        backgroundColor: 'rgba(160, 128, 96, 0.1)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        marginTop: SPACING.lg,
    },
    durationBadgeText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.accent,
        fontFamily: FONTS.medium,
        textAlign: 'center',
    },
    buttonContainer: { width: '100%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.xxl },
    waitingIndicator: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentMuted },
    dotActive: { backgroundColor: COLORS.accent },
    statusBadge: { backgroundColor: COLORS.accentLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 16, marginBottom: SPACING.md },
    statusBadgeText: { fontSize: FONT_SIZES.xs, color: COLORS.accent, fontWeight: '500' },
    dDay: { fontSize: FONT_SIZES.xxl, color: COLORS.textPrimary, fontWeight: '600', marginBottom: SPACING.sm },
    sendStatus: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    newMessageBadge: {
        backgroundColor: COLORS.successLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        marginVertical: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    newMessageText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.success,
        fontWeight: '500',
    },
    newMessageSparkle: {
        fontSize: 14,
        marginHorizontal: 4,
    },
    errorText: { color: COLORS.danger, textAlign: 'center' },
    secondaryButton: {
        width: '100%',
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.sm,
        backgroundColor: '#F5F5F5', // Light gray background
        borderRadius: 16,
    },
    secondaryButtonText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textPrimary,
        fontFamily: FONTS.medium,
    },
    textButton: {
        width: '100%',
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.sm,
        backgroundColor: COLORS.dangerLight,
        borderRadius: 16,
    },
    textButtonLabel: {
        fontSize: FONT_SIZES.md,
        color: COLORS.danger,
        fontFamily: FONTS.medium,
    },
    blockTextButton: {
        width: '100%',
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    blockTextLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textTertiary,
        textDecorationLine: 'underline',
    },
    toast: {
        position: 'absolute',
        bottom: 100,
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
    // Message Card Styles
    messageCardContainer: {
        width: '100%',
        paddingHorizontal: SPACING.lg,
    },
    messageCard: {
        backgroundColor: 'transparent',
        borderRadius: 20,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    messageTime: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
    },
    closeButton: {
        padding: 4,
    },
    messageBody: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.textPrimary,
        fontFamily: FONTS.medium,
        lineHeight: 28,
    },
});

interface ReceiverHomeProps {
    message: ReceivedMessage | null;
    onCloseMessage: () => void;
}

const ReceiverHomeContent: React.FC<ReceiverHomeProps> = ({ message, onCloseMessage }) => {
    if (!message) {
        return <View style={{ flex: 1 }} />; // Complete empty state
    }

    if (!message) {
        return <View style={{ flex: 1 }} />; // Complete empty state
    }

    const date = new Date(message.sentAt); // message.receivedAt -> message.sentAt
    const timeString = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
        <View style={styles.stateContainer}>
            <View style={styles.centerContent}>
                <View style={styles.messageCardContainer}>
                    <View style={styles.messageCard}>
                        <View style={styles.messageHeader}>
                            <Text style={styles.messageTime}>{timeString}</Text>
                            <TouchableOpacity onPress={onCloseMessage} style={styles.closeButton}>
                                <Feather name="x" size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.messageBody} numberOfLines={3}>
                            {message.content}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};