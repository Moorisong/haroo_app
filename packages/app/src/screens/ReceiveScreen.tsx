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
import { getTodayReceivedMessage, ReceivedMessage } from '../services/api';

export const ReceiveScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [message, setMessage] = useState<ReceivedMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    const fetchMessage = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getTodayReceivedMessage();
            setMessage(response.message);
        } catch (error) {
            console.error('Failed to fetch message:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 화면 진입 시 메시지 조회 (화면이 focus될 때마다)
    useFocusEffect(
        useCallback(() => {
            fetchMessage();
        }, [fetchMessage])
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
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('이 사용자를 차단하시겠습니까?\n더 이상 메시지를 받을 수 없게 됩니다.');
            if (confirmed) {
                setIsBlocked(true);
                // TODO: 실제 차단 API 연동
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
                        onPress: () => {
                            setIsBlocked(true);
                            // TODO: 실제 차단 API 연동
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

                    {/* 메시지 표시 카드 */}
                    <View style={styles.messageCard}>
                        <Text style={styles.messageText}>{message.content}</Text>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateText}>{formatDate(message.sentAt)}</Text>
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
                            <Text style={styles.settingBold}>알림바 고정</Text>
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
                                    차단한 사용자로부터 더 이상{'\n'}메시지를 받을 수 없어요.
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
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    messageCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: SPACING.xl,
        marginBottom: SPACING.xl,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    messageText: {
        fontSize: FONT_SIZES.xl, // 18px
        fontFamily: FONTS.serif, // 명조체
        color: COLORS.textPrimary,
        lineHeight: 30, // 가독성 좋은 행간
        marginBottom: SPACING.lg,
    },
    dateContainer: {
        alignItems: 'flex-end',
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
        padding: SPACING.sm,
    },
    blockButtonText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: '#E07878', // Red for block action
        textDecorationLine: 'underline',
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
