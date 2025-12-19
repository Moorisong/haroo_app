import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
    Alert,
    Animated,
    Easing,
    Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';
import { UserIdCard } from '../components/UserIdCard';
import { getUserProfile, updateUserSettings, getBlockedUsers, unblockUser, BlockedUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';
import { APP_CONSTANTS } from '../constants/app';

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { logout } = useAuth();

    const [userId, setUserId] = useState('');
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('저장되었습니다');
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // 데이터 조회
    const fetchData = useCallback(async () => {
        try {
            const [profile, blockedResponse] = await Promise.all([
                getUserProfile(),
                getBlockedUsers(),
            ]);
            setUserId(profile.hashId || '');
            setBlockedUsers(blockedResponse.blockedUsers || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleCopyId = async () => {
        if (!userId) return;
        await Clipboard.setStringAsync(userId);
        Alert.alert('복사 완료', 'ID가 클립보드에 복사되었습니다.');
    };

    // 토스트 표시 함수
    const showToastMessage = (message: string = '저장되었습니다') => {
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

    // 차단 해제 핸들러
    const handleUnblock = (user: BlockedUser) => {
        const displayName = user.nickname || user.hashId;

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${displayName}님의 차단을 해제할까요?`);
            if (confirmed) {
                unblockUser(user.hashId)
                    .then(() => {
                        setBlockedUsers(prev => prev.filter(u => u.hashId !== user.hashId));
                        showToastMessage('차단이 해제되었어요.');
                    })
                    .catch(() => alert('차단 해제에 실패했습니다.'));
            }
        } else {
            Alert.alert(
                '차단 해제',
                `${displayName}님의 차단을 해제할까요?`,
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '해제',
                        onPress: async () => {
                            try {
                                await unblockUser(user.hashId);
                                setBlockedUsers(prev => prev.filter(u => u.hashId !== user.hashId));
                                showToastMessage('차단이 해제되었어요.');
                            } catch (error) {
                                console.error(error);
                                Alert.alert('오류', '차단 해제에 실패했습니다.');
                            }
                        }
                    }
                ]
            );
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
                <Text style={styles.headerTitle}>설정</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>

                    {/* 내 정보 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>내 정보</Text>
                        <View style={styles.myInfoContainer}>
                            <Text style={styles.myInfoLabel}>내 ID</Text>
                            <UserIdCard userId={userId} onCopy={handleCopyId} />
                        </View>
                        <Text style={styles.description}>
                            상대방이 이 ID를 통해 나에게 메시지 모드를 신청할 수 있어요.
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* 메시지 모드 신청 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>메시지 모드</Text>
                        <Text style={styles.description}>
                            상대방에게 메시지를 보내고 싶다면 신청해 보세요.
                        </Text>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Request')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionContent}>
                                <Feather
                                    name="send"
                                    size={24}
                                    color={COLORS.accent}
                                    style={styles.optionIcon}
                                />
                                <Text style={styles.actionLabel}>메시지 모드 신청하기</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* 차단한 사용자 섹션 - 목록이 있을 때만 표시 */}
                    {blockedUsers.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>차단한 사용자</Text>
                                <View style={styles.blockedList}>
                                    {blockedUsers.map((user) => (
                                        <View key={user.hashId} style={styles.blockedItem}>
                                            <View style={styles.blockedUserInfo}>
                                                <Text style={styles.blockedUserName}>
                                                    {user.nickname || user.hashId}
                                                </Text>
                                                {user.nickname && (
                                                    <Text style={styles.blockedUserId}>
                                                        {user.hashId}
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                style={styles.unblockButton}
                                                onPress={() => handleUnblock(user)}
                                            >
                                                <Text style={styles.unblockButtonText}>해제</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    {/* [TEST MODE] Developer Menu */}
                    {Constants.expoConfig?.extra?.APP_MODE === 'TEST' && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Developer</Text>
                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => navigation.navigate('TestTools')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.optionContent}>
                                        <Feather
                                            name="tool"
                                            size={24}
                                            color="#607D8B"
                                            style={styles.optionIcon}
                                        />
                                        <Text style={styles.actionLabel}>Test Tools</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* 정보 섹션 */}
                    <View style={styles.divider} />
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>정보</Text>

                        <TouchableOpacity
                            style={styles.infoItem}
                            onPress={() => Linking.openURL(APP_CONSTANTS.TERMS_URL)}
                        >
                            <View style={styles.infoItemLeft}>
                                <Feather name="file-text" size={20} color={COLORS.textSecondary} />
                                <Text style={styles.infoItemLabel}>이용약관</Text>
                            </View>
                            <Feather name="external-link" size={16} color={COLORS.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.infoItem}
                            onPress={() => Linking.openURL(APP_CONSTANTS.PRIVACY_URL)}
                        >
                            <View style={styles.infoItemLeft}>
                                <Feather name="shield" size={20} color={COLORS.textSecondary} />
                                <Text style={styles.infoItemLabel}>개인정보처리방침</Text>
                            </View>
                            <Feather name="external-link" size={16} color={COLORS.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.infoItem}
                            onPress={async () => {
                                await Clipboard.setStringAsync(APP_CONSTANTS.CONTACT_EMAIL);
                                showToastMessage('이메일 주소가 복사되었어요.');
                            }}
                        >
                            <View style={styles.infoItemLeft}>
                                <Feather name="mail" size={20} color={COLORS.textSecondary} />
                                <Text style={styles.infoItemLabel}>문의하기</Text>
                            </View>
                            <View style={styles.infoItemRight}>
                                <Text style={styles.infoItemValue}>{APP_CONSTANTS.CONTACT_EMAIL}</Text>
                                <Feather name="copy" size={14} color={COLORS.textTertiary} style={{ marginLeft: 6 }} />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.infoItem}>
                            <View style={styles.infoItemLeft}>
                                <Feather name="info" size={20} color={COLORS.textSecondary} />
                                <Text style={styles.infoItemLabel}>앱 버전</Text>
                            </View>
                            <Text style={styles.infoItemValue}>{Constants.expoConfig?.version || '1.0.0'}</Text>
                        </View>
                    </View>

                    {/* 로그아웃 버튼 - 맨 아래 눈에 안띄게 */}
                    <View style={styles.logoutSection}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={logout}
                        >
                            <Text style={styles.logoutText}>로그아웃</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* 토스트 메시지 */}
            {showToast && (
                <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}
        </View>
    );
};

// 옵션 카드 컴포넌트
const OptionCard: React.FC<{
    label: string;
    icon: keyof typeof Feather.glyphMap;
    selected: boolean;
    onPress: () => void
}> = ({ label, icon, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.optionCard, selected && styles.optionCardSelected]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={styles.optionContent}>
            <Feather
                name={icon}
                size={24}
                color={selected ? COLORS.accent : COLORS.textSecondary}
                style={styles.optionIcon}
            />
            <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {label}
            </Text>
        </View>
        <View style={styles.radio}>
            {selected && <View style={styles.radioInner} />}
        </View>
    </TouchableOpacity>
);

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
    section: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    description: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    optionsContainer: {
        gap: SPACING.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: SPACING.md,
    },
    optionCardSelected: {
        backgroundColor: '#FFFBF5',
        borderColor: COLORS.accent,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        marginRight: SPACING.md,
    },
    optionLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    optionLabelSelected: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.divider,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.accent,
    },
    myInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12, // 16 -> 12로 축소
        padding: SPACING.md,
        // paddingVertical 제거하여 기본 padding만 적용
        marginBottom: SPACING.xs, // sm -> xs로 축소
    },
    myInfoLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: SPACING.md,
    },
    actionLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginBottom: SPACING.xl,
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
    // 차단 사용자 스타일
    blockedList: {
        gap: SPACING.sm,
    },
    blockedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
    },
    blockedUserInfo: {
        flex: 1,
    },
    blockedUserName: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    blockedUserId: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    unblockButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    unblockButtonText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    // 로그아웃 스타일
    logoutSection: {
        marginTop: SPACING.xxl,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        alignItems: 'center',
    },
    logoutButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    logoutText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },
    // 정보 섹션 스타일
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    infoItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    infoItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItemLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
    },
    infoItemValue: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
    },
});
