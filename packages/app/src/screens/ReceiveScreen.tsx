import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
    ActivityIndicator,
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
    const [displayMode, setDisplayMode] = useState<'WIDGET' | 'NOTIFICATION'>('NOTIFICATION');

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [messageResponse, profileResponse] = await Promise.all([
                getTodayReceivedMessage(),
                getUserProfile(),
            ]);

            setMessage(messageResponse.message);
            setDisplayMode(profileResponse.settings?.displayMode || 'NOTIFICATION');

            // 메시지가 있고 아직 읽지 않은 경우 읽음 처리
            if (messageResponse.message) {
                const messageSenderValues = messageResponse.message.sender;
                const senderHashId = typeof messageSenderValues === 'string'
                    ? messageSenderValues
                    : messageSenderValues.hashId;

                // 차단 여부 확인
                if (profileResponse.blockedUsers?.includes(senderHashId)) {
                    setIsBlocked(true);
                }

                if (!messageResponse.message.isRead) {
                    try {
                        await markMessageAsRead(messageResponse.message._id);
                        // 로컬 상태도 업데이트
                        setMessage(prev => prev ? { ...prev, isRead: true } : null);
                    } catch (readError) {
                        console.error('Failed to mark message as read:', readError);
                        // 읽음 처리 실패해도 메시지는 정상 표시
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 화면 진입 시 데이터 조회 (화면이 focus될 때마다)
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? '오후' : '오전';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${year}.${month}.${day} ${period} ${displayHours}:${minutes}`;
    };

    const handleBlock = () => {
        if (!message) return;

        const senderHashId = typeof message.sender === 'string' ? message.sender : message.sender.hashId;

        if (Platform.OS === 'web') {
            const confirmed = window.confirm('이 사용자를 차단하시겠습니까?\n더 이상 메시지를 받을 수 없게 됩니다.');
            if (confirmed) {
                blockUser(senderHashId)
                    .then(() => {
                        setIsBlocked(true);
                    })
                    .catch(() => {
                        alert('차단에 실패했습니다.');
                    });
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

    const handleSettings = () => {
        navigation.navigate('Settings');
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

                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>받은 메시지</Text>
                </View>

                <View style={[styles.content, styles.centerContent]}>
                    <Feather name="inbox" size={48} color={COLORS.textTertiary} />
                    <Text style={styles.emptyText}>오늘 받은 메시지가 없어요</Text>
                </View>
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
                <Text style={styles.headerTitle}>받은 메시지</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>

                    {/* 메시지 표시 카드 - 이중 박스 구조 */}
                    <View style={styles.messageCardOuter}>
                        <View style={styles.messageCardInner}>
                            <Text style={styles.messageText}>{message.content}</Text>
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateText}>{formatDate(message.sentAt)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 고정 안내 문구 */}
                    <View style={styles.noticeContainer}>
                        <Text style={styles.noticeText}>
                            이 메시지는 읽기만 가능합니다.{'\n'}
                            <Text style={styles.noticeBold}>답장은 요구하지 않아요.</Text>
                        </Text>
                    </View>

                    {/* 메시지 표시 방식 안내 */}
                    <TouchableOpacity
                        style={styles.settingLink}
                        onPress={handleSettings}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.settingText}>
                            현재 표시 방식:{'\n'}
                            <Text style={styles.settingBold}>
                                {displayMode === 'WIDGET' ? '홈 화면 위젯' : '알림바 고정'}
                            </Text>
                        </Text>
                        <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                    </TouchableOpacity>

                    {/* 차단 버튼 영역 */}
                    <View style={styles.blockSection}>
                        {!isBlocked ? (
                            <TouchableOpacity
                                style={styles.blockButton}
                                onPress={handleBlock}
                            >
                                <Text style={styles.blockButtonText}>이 발신자 차단하기</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.blockedContainer}>
                                <Feather name="slash" size={20} color={COLORS.textSecondary} style={{ marginBottom: 8 }} />
                                <Text style={styles.blockedText}>
                                    {MESSAGES.RECEIVE.BLOCKED_USER.TITLE}
                                </Text>
                            </View>
                        )}
                    </View>

                </View>
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
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
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    messageCardOuter: {
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: COLORS.accentLight,
        padding: 6,
        marginBottom: SPACING.xl,
    },
    messageCardInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 18,
        padding: SPACING.xl,
    },
    messageText: {
        fontSize: FONT_SIZES.lg, // 16px
        fontFamily: FONTS.medium, // 고딕체
        color: COLORS.textPrimary,
        lineHeight: 24, // 행간 축소
        marginBottom: SPACING.sm, // 간격 축소
    },
    dateContainer: {
        alignItems: 'flex-end',
        marginTop: SPACING.md,
    },
    dateText: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },
    noticeContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    noticeText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    noticeBold: {
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    settingLink: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xxl,
    },
    settingText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    settingBold: {
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    blockSection: {
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    blockButton: {
        width: '100%',
        padding: SPACING.md,
        alignItems: 'center',
        backgroundColor: COLORS.dangerLight,
        borderRadius: 16,
    },
    blockButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.danger,
    },
    blockedContainer: {
        alignItems: 'center',
        padding: SPACING.lg,
    },
    blockedText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
