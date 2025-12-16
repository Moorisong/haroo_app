import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';

interface ReceiveScreenProps {
    onBack: () => void;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onBack }) => {
    // 테스트용 메시지 데이터
    const [message] = useState("오늘 하루는 어땠나요? 잠시 하늘을 올려다보는 여유를 가졌으면 좋겠어요. 당신의 하루가 평안하기를 바랍니다.");
    const [isBlocked, setIsBlocked] = useState(false);

    const handleBlock = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('이 사용자를 차단하시겠습니까?\n더 이상 메시지를 받을 수 없게 됩니다.');
            if (confirmed) {
                setIsBlocked(true);
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
        Alert.alert('설정', '알림 표시 방식 설정 화면으로 이동합니다.');
        // TODO: Navigate to settings
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>받은 메시지</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>

                    {/* 메시지 표시 카드 */}
                    <View style={styles.messageCard}>
                        <Text style={styles.messageText}>{message}</Text>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateText}>2024.12.16 오후 2:30</Text>
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
                                    이 사용자는 더 이상{'\n'}메시지를 보낼 수 없어요.
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
