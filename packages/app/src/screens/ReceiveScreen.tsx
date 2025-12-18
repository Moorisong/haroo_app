import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';
import { getTodayReceivedMessage, markMessageAsRead, getUserProfile, ReceivedMessage, blockUser } from '../services/api';
import { MESSAGES } from '../constants/messages';

export const ReceiveScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [message, setMessage] = useState<ReceivedMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    // 애니메이션 값
    const floatAnim = useRef(new Animated.Value(0)).current;
    const sparkle1 = useRef(new Animated.Value(0)).current;
    const sparkle2 = useRef(new Animated.Value(0)).current;
    const sparkle3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 부드러운 부유 애니메이션
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 반짝이 애니메이션들 (각각 다른 타이밍)
        const createSparkle = (anim: Animated.Value, delay: number) => {
            setTimeout(() => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true }),
                    ])
                ).start();
            }, delay);
        };

        createSparkle(sparkle1, 0);
        createSparkle(sparkle2, 500);
        createSparkle(sparkle3, 1000);
    }, [floatAnim, sparkle1, sparkle2, sparkle3]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [messageResponse, profileResponse] = await Promise.all([
                getTodayReceivedMessage(),
                getUserProfile(),
            ]);

            setMessage(messageResponse.message);

            if (messageResponse.message) {
                const messageSenderValues = messageResponse.message.sender;
                const senderHashId = typeof messageSenderValues === 'string'
                    ? messageSenderValues
                    : messageSenderValues.hashId;

                if (profileResponse.blockedUsers?.includes(senderHashId)) {
                    setIsBlocked(true);
                }

                if (!messageResponse.message.isRead) {
                    try {
                        await markMessageAsRead(messageResponse.message._id);
                        setMessage(prev => prev ? { ...prev, isRead: true } : null);
                    } catch (readError) {
                        console.error('Failed to mark message as read:', readError);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? '오후' : '오전';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${month}월 ${day}일 ${period} ${displayHours}:${minutes}`;
    };

    const handleBlock = () => {
        if (!message) return;

        const senderHashId = typeof message.sender === 'string' ? message.sender : message.sender.hashId;

        if (Platform.OS === 'web') {
            const confirmed = window.confirm('이 사용자를 차단하시겠습니까?\n더 이상 메시지를 받을 수 없게 됩니다.');
            if (confirmed) {
                blockUser(senderHashId)
                    .then(() => setIsBlocked(true))
                    .catch(() => alert('차단에 실패했습니다.'));
            }
        } else {
            Alert.alert(
                '차단 하시겠습니까?',
                '이 사용자는 더 이상 메시지를 보낼 수 없게 됩니다.',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '차단하기',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await blockUser(senderHashId);
                                setIsBlocked(true);
                            } catch (error) {
                                console.error(error);
                                Alert.alert('오류', '차단에 실패했습니다.');
                            }
                        }
                    }
                ]
            );
        }
    };

    // 로딩 중
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <BubbleBackground />
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    // 메시지가 없는 경우
    if (!message) {
        return (
            <View style={styles.container}>
                <BubbleBackground />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrapper}>
                        <Feather name="inbox" size={32} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>받은 메시지가 없어요</Text>
                    <Text style={styles.emptySubtitle}>오늘 도착한 메시지가 여기에 표시됩니다</Text>
                </View>
            </View>
        );
    }

    const floatTranslate = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
    });

    return (
        <View style={styles.container}>
            <BubbleBackground />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* 메인 컨텐츠 */}
            <View style={styles.mainContent}>
                {/* 메시지 영역 with 애니메이션 */}
                <Animated.View style={[
                    styles.messageSection,
                    { transform: [{ translateY: floatTranslate }] }
                ]}>
                    {/* 반짝이 효과 */}
                    <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkle1 }]}>
                        <Text style={[styles.sparkleIcon, { color: '#FFB74D' }]}>✦</Text>
                    </Animated.View>
                    <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: sparkle2 }]}>
                        <Text style={[styles.sparkleIcon, { color: '#F48FB1' }]}>✦</Text>
                    </Animated.View>
                    <Animated.View style={[styles.sparkle, styles.sparkle3, { opacity: sparkle3 }]}>
                        <Text style={[styles.sparkleIcon, { color: '#81D4FA' }]}>✦</Text>
                    </Animated.View>

                    <Text style={styles.messageText}>{message.content}</Text>
                </Animated.View>

                {/* 메타 정보 */}
                <View style={styles.metaSection}>
                    <Text style={styles.dateText}>{formatDate(message.sentAt)}</Text>
                    <View style={styles.infoBadge}>
                        <Text style={styles.infoText}>
                            {typeof message.sender === 'object' && message.sender.nickname
                                ? `${message.sender.nickname}님께서 보내셨습니다`
                                : '누군가로부터 온 메시지'}
                        </Text>
                    </View>
                </View>

                {/* 차단 버튼 - 메인 컨텐츠 아래에 위치 */}
                <View style={styles.blockSection}>
                    {!isBlocked ? (
                        <TouchableOpacity style={styles.blockLink} onPress={handleBlock}>
                            <Text style={styles.blockLinkText}>이 발신자 차단하기</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.blockedBadge}>
                            <Feather name="slash" size={14} color={COLORS.textTertiary} />
                            <Text style={styles.blockedText}>{MESSAGES.RECEIVE.BLOCKED_USER.TITLE}</Text>
                        </View>
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 48,
        paddingBottom: SPACING.sm,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },

    // Main Content
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    messageSection: {
        marginBottom: SPACING.xl,
        position: 'relative',
    },
    messageText: {
        fontSize: 24,
        fontFamily: FONTS.serif,
        fontWeight: '600',
        color: COLORS.textPrimary,
        lineHeight: 36,
        textAlign: 'center',
    },

    // 반짝이 효과
    sparkle: {
        position: 'absolute',
    },
    sparkle1: {
        top: -20,
        left: 20,
    },
    sparkle2: {
        top: -10,
        right: 30,
    },
    sparkle3: {
        bottom: -15,
        right: 50,
    },
    sparkleIcon: {
        fontSize: 16,
        color: COLORS.accentLight,
    },

    // Meta Info
    metaSection: {
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xxl,
    },
    dateText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },
    infoBadge: {
        backgroundColor: 'rgba(160, 128, 96, 0.08)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 16,
        marginTop: SPACING.sm,
    },
    infoText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.accent,
    },

    // Block Section (컨텐츠 아래)
    blockSection: {
        alignItems: 'center',
        marginTop: SPACING.xxl,
    },
    blockLink: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
        borderRadius: 20,
        backgroundColor: 'rgba(244, 67, 54, 0.05)',
    },
    blockLinkText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        color: '#E57373',
    },
    blockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 20,
    },
    blockedText: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },
});
