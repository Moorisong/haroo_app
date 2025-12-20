import React, { useState, useCallback, useMemo } from 'react';
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
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';

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

// Mock 타입 정의
interface TraceMessage {
    id: string;
    content: string;
    toneTag: string;
    likeCount: number;
    isLiked: boolean;
    createdAt: Date;
}

// Mock 데이터 (나중에 API로 교체) - 빈 상태 테스트용
const MOCK_MESSAGES: TraceMessage[] = [];

const PAGE_SIZE = 10;

// 빈 지역 문구 목록
const EMPTY_MESSAGES = [
    "아직 이곳에 남겨진 말이 없어요.",
    "지금은 조용한 장소예요.",
    "누군가의 말을 기다리고 있어요.",
];

// 신고 사유 목록
const REPORT_REASONS = ['욕설/비방', '특정인 저격', '허위 정보', '불쾌하거나 위험함', '기타'];

export const TraceScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [messages, setMessages] = useState<TraceMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // 신고 모달 상태
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportTargetId, setReportTargetId] = useState<string | null>(null);

    // 빈 상태 문구 (랜덤, 컴포넌트 마운트 시 고정)
    const randomEmptyMessage = useMemo(
        () => EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)],
        []
    );

    // 데이터 로드
    useFocusEffect(
        useCallback(() => {
            const loadMessages = async () => {
                setIsLoading(true);
                // TODO: 실제 API 호출로 교체
                await new Promise(resolve => setTimeout(resolve, 500));
                setMessages(MOCK_MESSAGES);
                setIsLoading(false);
            };
            loadMessages();
        }, [])
    );

    // 페이지네이션 계산
    const totalPages = Math.ceil(messages.length / PAGE_SIZE);
    const paginatedMessages = messages.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // 좋아요 토글
    const handleLike = (messageId: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    isLiked: !msg.isLiked,
                    likeCount: msg.isLiked ? msg.likeCount - 1 : msg.likeCount + 1,
                };
            }
            return msg;
        }));
        // TODO: API 호출
    };

    // 신고 모달 열기
    const handleReport = (messageId: string) => {
        setReportTargetId(messageId);
        setReportModalVisible(true);
    };

    // 신고 제출
    const submitReport = (reason: string) => {
        // TODO: API 호출
        console.log('Report:', { messageId: reportTargetId, reason });
        setReportModalVisible(false);
        setReportTargetId(null);
        // 토스트 또는 알림 표시 가능
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
                    <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
                </View>

                {/* 내용 */}
                <Text style={styles.messageContent}>{item.content}</Text>

                {/* 액션 버튼 */}
                <View style={styles.messageActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLike(item.id)}
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

                    <TouchableOpacity
                        style={[styles.actionButton, { marginLeft: -SPACING.xs }]}
                        onPress={() => handleReport(item.id)}
                    >
                        <Feather name="flag" size={14} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // 빈 상태 렌더
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={48} color={COLORS.accentMuted} />
            <Text style={styles.emptyText}>{randomEmptyMessage}</Text>
        </View>
    );

    // 페이지네이션 컨트롤
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                >
                    <Feather name="chevron-left" size={18} color={currentPage === 1 ? COLORS.textTertiary : COLORS.textPrimary} />
                    <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>이전</Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>{currentPage} / {totalPages}</Text>

                <TouchableOpacity
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                >
                    <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>다음</Text>
                    <Feather name="chevron-right" size={18} color={currentPage === totalPages ? COLORS.textTertiary : COLORS.textPrimary} />
                </TouchableOpacity>
            </View>
        );
    };

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
                        data={paginatedMessages}
                        renderItem={renderMessageItem}
                        keyExtractor={item => item.id}
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
});
