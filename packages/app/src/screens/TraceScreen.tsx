import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
    FlatList,
    Modal,
    Alert,
    Animated,
    Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';
import traceService, { TraceMessage } from '../services/traceService';
import LocationService, { LocationState } from '../services/LocationService';

// 톤 태그 매핑
const TONE_TAG_MAP: Record<string, { emoji: string; label: string }> = {
    happy: { emoji: '😊', label: '행복' },
    fear: { emoji: '😨', label: '공포' },
    anger: { emoji: '😡', label: '분노' },
    monologue: { emoji: '😶', label: '혼잣말' },
    review: { emoji: '📝', label: '후기' },
    comfort: { emoji: '🤍', label: '위로' },
    other: { emoji: '🪶', label: '기타' },
};

// 빈 지역 문구 목록
const EMPTY_MESSAGES = [
    "아직 이곳에 남겨진 말이 없어요.",
    "지금은 조용한 장소예요.",
    "누군가의 말을 기다리고 있어요.",
];

// 서브타이틀 문구 목록 (랜덤)
const SUBTITLE_MESSAGES = [
    { main: "지금 이 장소에 머문 사람들의 이야기", sub: "작성 후 3일이면 사라지는 짧은 말입니다." },
    { main: "이 자리를 지나간 사람들이 남긴 이야기", sub: "작성 후 3일이면 사라집니다." },
    { main: "여기, 누군가 남긴 한 줄의 흔적", sub: "작성 후 3일이면 사라져요." },
];

// 신고 사유 목록
const REPORT_REASONS = ['욕설/비방', '특정인 저격', '허위 정보', '불쾌하거나 위험함', '기타'];

export const TraceScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [messages, setMessages] = useState<TraceMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Location State
    const [locationState, setLocationState] = useState<LocationState | null>(null);

    // 신고 모달 상태
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportTargetId, setReportTargetId] = useState<string | null>(null);

    // 토스트 상태
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // 빈 상태 문구 (랜덤, 컴포넌트 마운트 시 고정)
    const randomEmptyMessage = useMemo(
        () => EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)],
        []
    );

    // 서브타이틀 문구 (랜덤, 컴포넌트 마운트 시 고정)
    const randomSubtitle = useMemo(
        () => SUBTITLE_MESSAGES[Math.floor(Math.random() * SUBTITLE_MESSAGES.length)],
        []
    );

    // 데이터 로드
    const loadMessages = useCallback(async (loc: LocationState, page: number, isRefresh = false) => {
        if (!loc.isInKorea) return;

        if (isRefresh) setIsLoading(true);
        try {
            const response = await traceService.getMessages(loc.lat, loc.lng, page);
            setMessages(prev => isRefresh ? response.messages : [...prev, ...response.messages]);
        } catch (error) {
            console.error('Failed to load traces:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 초기 진입: 위치 확인 및 로드
    const checkLocationAndLoad = useCallback(async () => {
        setIsLoading(true);
        const loc = await LocationService.getCurrentLocation();
        setLocationState(loc);

        if (loc.errorMsg === 'PERMISSION_DENIED') {
            LocationService.showPermissionAlert();
            setIsLoading(false);
            return;
        }

        if (!loc.isInKorea) {
            setIsLoading(false);
            return;
        }

        // 위치 확인 후 첫 페이지 로드
        setCurrentPage(1);
        loadMessages(loc, 1, true);
    }, [loadMessages]);

    useFocusEffect(
        useCallback(() => {
            checkLocationAndLoad();
        }, [checkLocationAndLoad])
    );

    // 좋아요 토글
    const handleLike = async (messageId: string) => {
        try {
            // Optimistic update
            const msg = messages.find(m => m._id === messageId);
            if (!msg) return;

            const isLikedRaw = (msg as any).isLiked;
            const isLiked = isLikedRaw === true;

            if (isLiked) {
                const res = await traceService.unlikeMessage(messageId);
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, likeCount: res.likeCount, isLiked: false } : m));
            } else {
                const res = await traceService.likeMessage(messageId);
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, likeCount: res.likeCount, isLiked: true } : m));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 신고 모달 열기
    const handleReport = (messageId: string) => {
        setReportTargetId(messageId);
        setReportModalVisible(true);
    };

    // 토스트 표시 함수
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

    // 신고 제출
    const submitReport = async (reason: string) => {
        if (!reportTargetId) return;

        // 모달 먼저 닫기
        setReportModalVisible(false);
        const targetId = reportTargetId;
        setReportTargetId(null);

        showToastMsg('신고 접수 중...');
        try {
            await traceService.reportMessage(targetId, reason);
            showToastMsg('신고가 접수되었어요.');
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 400 && error.response?.data?.message === 'Already reported') {
                showToastMsg('이미 신고한 글이에요.');
            } else {
                showToastMsg('신고에 실패했어요.');
            }
        }
    };

    // 삭제 (본인 글)
    const handleDelete = async (messageId: string) => {
        Alert.alert(
            '한 줄 삭제',
            '이 글을 삭제하시겠어요?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        showToastMsg('삭제 중...');
                        try {
                            await traceService.deleteMessage(messageId);
                            setMessages(prev => prev.filter(m => m._id !== messageId));
                            showToastMsg('삭제되었어요.');
                        } catch (error) {
                            console.error('Delete failed:', error);
                            showToastMsg('삭제에 실패했어요.');
                        }
                    }
                }
            ]
        );
    };

    // 시간 포맷
    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return '방금 전';
        if (hours < 24) return `${hours}시간 전`;
        return `${Math.floor(hours / 24)}일 전`;
    };

    // 메시지 아이템 렌더
    const renderMessageItem = ({ item }: { item: TraceMessage }) => {
        const tag = TONE_TAG_MAP[item.toneTag] || TONE_TAG_MAP.other;

        return (
            <View style={styles.messageCard}>
                {/* 태그 & 시간 */}
                <View style={styles.messageHeader}>
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                        <Text style={styles.tagLabel}>{tag.label}</Text>
                    </View>
                    <Text style={styles.messageTime}>{formatTime(new Date(item.createdAt))}</Text>
                </View>

                {/* 내용 */}
                <Text style={styles.messageContent}>{item.content}</Text>

                {/* 액션 버튼 */}
                <View style={styles.messageActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLike(item._id)}
                    >
                        <Feather
                            name={item.isLiked ? "heart" : "heart"}
                            size={16}
                            color={item.isLiked ? '#E57373' : COLORS.textTertiary}
                            style={item.isLiked ? { opacity: 1 } : { opacity: 0.7 }}
                        />
                        <Text style={[
                            styles.actionText,
                            item.isLiked && styles.actionTextLiked
                        ]}>
                            {item.likeCount > 0 ? item.likeCount : ''}
                        </Text>
                    </TouchableOpacity>

                    {/* 본인 글이면 삭제, 아니면 신고 */}
                    {item.isMine ? (
                        <TouchableOpacity
                            style={[styles.actionButton, { marginLeft: -SPACING.xs }]}
                            onPress={() => handleDelete(item._id)}
                        >
                            <Feather name="trash-2" size={14} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, { marginLeft: -SPACING.xs }]}
                            onPress={() => handleReport(item._id)}
                        >
                            <Feather name="flag" size={14} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    // 빈 상태 렌더 (국가 제한 포함)
    const renderEmptyState = () => {
        if (locationState && !locationState.isInKorea && !locationState.errorMsg) {
            return (
                <View style={styles.emptyContainer}>
                    <Feather name="globe" size={48} color={COLORS.accentMuted} />
                    <Text style={styles.emptyText}>{"현재 서비스는 대한민국에서만\n이용할 수 있어요."}</Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Feather name="map-pin" size={48} color={COLORS.accentMuted} />
                <Text style={styles.emptyText}>{randomEmptyMessage}</Text>
            </View>
        );
    };

    // 페이지네이션 컨트롤 (Server-side pagination: use Infinite Scroll or Load More in future)
    const renderPagination = () => null;

    return (
        <View style={styles.container}>
            <BubbleBackground />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>여기, 한 줄</Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Subtitle */}
                <View style={styles.subtitleContainer}>
                    <Text style={styles.subtitleText}>{randomSubtitle.main}</Text>
                    <Text style={styles.subtitleSubText}>{randomSubtitle.sub}</Text>
                </View>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.contentContainer}>
                        {renderEmptyState()}
                    </View>
                ) : (
                    <FlatList
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={renderPagination}
                    />
                )}

                {/* Write Button - 항상 활성화 */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.writeButton}
                        onPress={() => navigation.navigate('TraceWrite')}
                        activeOpacity={0.8}
                    >
                        <Feather name="edit-2" size={18} color={COLORS.buttonText} />
                        <Text style={styles.writeButtonText}>한 줄 남기기</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* 신고 모달 */}
            <Modal
                visible={reportModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setReportModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setReportModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>신고하기</Text>
                                <Text style={styles.modalSubtitle}>신고 사유를 선택해주세요.</Text>

                                {REPORT_REASONS.map((reason, index) => (
                                    <TouchableOpacity
                                        key={reason}
                                        style={[
                                            styles.reportReasonButton,
                                            index === REPORT_REASONS.length - 1 && styles.reportReasonButtonLast
                                        ]}
                                        onPress={() => submitReport(reason)}
                                    >
                                        <Text style={styles.reportReasonText}>{reason}</Text>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setReportModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Toast */}
            {showToast && (
                <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    emptyContainer: {
        alignItems: 'center',
        gap: SPACING.lg,
    },
    emptyText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
        textAlign: 'center',
        lineHeight: 24,
    },
    subtitleContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    subtitleText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
        textAlign: 'center',
    },
    subtitleSubText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
        textAlign: 'center',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
    },
    messageCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: 'rgba(160, 128, 96, 0.1)',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 12,
    },
    tagEmoji: {
        fontSize: 12,
    },
    tagLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.accent,
        fontFamily: FONTS.medium,
    },
    messageTime: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
    },
    messageContent: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textPrimary,
        fontFamily: FONTS.regular,
        lineHeight: 24,
        marginBottom: SPACING.sm,
    },
    messageActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.xs,
    },
    actionText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
    },
    actionTextLiked: {
        color: '#E57373',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        gap: SPACING.lg,
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    pageButtonDisabled: {},
    pageButtonText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textPrimary,
        fontFamily: FONTS.medium,
    },
    pageButtonTextDisabled: {
        color: COLORS.textTertiary,
    },
    pageIndicator: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
    bottomContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl + SPACING.lg,
    },
    writeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.buttonPrimary,
        paddingVertical: SPACING.md + 2,
        borderRadius: 16,
    },
    writeButtonText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.buttonText,
        fontFamily: FONTS.medium,
    },
    // 신고 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '85%',
        maxWidth: 340,
        padding: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    modalSubtitle: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    reportReasonButton: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    reportReasonButtonLast: {
        borderBottomWidth: 0,
    },
    reportReasonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: SPACING.md,
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
    toast: {
        position: 'absolute',
        top: '45%',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    toastText: {
        color: '#fff',
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        textAlign: 'center',
    },
});
