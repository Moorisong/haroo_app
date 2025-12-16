import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ScrollView,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { ConnectionStatus } from '../types';
import { UserIdCard } from '../components/UserIdCard';
import { PrimaryButton } from '../components/PrimaryButton';
import * as Clipboard from 'expo-clipboard';
import { BubbleBackground } from '../components/BubbleBackground';

// Props
interface HomeScreenProps {
    onRequest: () => void;
    onSend: () => void;
}

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC<HomeScreenProps> = ({ onRequest, onSend }) => {
    // 테스트용 상태 - 실제로는 서버에서 받아옴
    const [status, setStatus] = useState<ConnectionStatus>('NONE');
    const [userId] = useState('haru_x9f3a2');
    const [daysRemaining] = useState(5);
    const [canSendToday] = useState(true);

    const handleCopyId = async () => {
        await Clipboard.setStringAsync(userId);
        Alert.alert('', 'ID가 복사되었어요.');
    };

    const handleRequestMode = () => {
        onRequest();
    };

    const handleSendMessage = () => {
        onSend();
    };

    // 상태 변경 테스트 버튼 (개발용)
    const cycleStatus = () => {
        const states: ConnectionStatus[] = ['NONE', 'PENDING', 'ACTIVE_PERIOD', 'EXPIRED'];
        const currentIndex = states.indexOf(status);
        const nextIndex = (currentIndex + 1) % states.length;
        setStatus(states[nextIndex]);
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                {/* 개발용: 상태 변경 (상단 고정) */}
                <View style={styles.devTools}>
                    <Text style={styles.devLabel}>현재: {status}</Text>
                    <PrimaryButton title="상태 변경" onPress={cycleStatus} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* 상단 ID 영역: 우측 정렬 */}
                    <View style={styles.header}>
                        <UserIdCard
                            userId={userId}
                            onCopy={handleCopyId}
                            variant="simple"
                        />
                    </View>

                    {/* 메인 콘텐츠 */}
                    <View style={styles.content}>
                        {status === 'NONE' && (
                            <NoneStateContent onRequest={handleRequestMode} />
                        )}
                        {status === 'PENDING' && (
                            <PendingStateContent />
                        )}
                        {status === 'ACTIVE_PERIOD' && (
                            <ActiveStateContent
                                daysRemaining={daysRemaining}
                                canSendToday={canSendToday}
                                onSendMessage={handleSendMessage}
                            />
                        )}
                        {status === 'EXPIRED' && (
                            <ExpiredStateContent onRequest={handleRequestMode} />
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

// ==================== NONE 상태 ====================
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

// ==================== PENDING 상태 ====================
const PendingStateContent: React.FC = () => (
    <View style={styles.stateContainer}>
        <View style={styles.centerContent}>
            <View style={styles.mainTextContainer}>
                <Text style={styles.mainText}>상대의 수락을{'\n'}기다리고 있어요.</Text>
            </View>
            <Text style={styles.subText}>
                메시지 모드가 활성화되면{'\n'}하루에 한 번 메시지를 보낼 수 있어요.
            </Text>
            <View style={styles.waitingIndicator}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
            </View>
        </View>
    </View>
);

// ==================== ACTIVE_PERIOD 상태 ====================
interface ActiveStateContentProps {
    daysRemaining: number;
    canSendToday: boolean;
    onSendMessage: () => void;
}

const ActiveStateContent: React.FC<ActiveStateContentProps> = ({
    daysRemaining,
    canSendToday,
    onSendMessage,
}) => (
    <View style={styles.stateContainer}>
        <View style={styles.centerContent}>
            <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>메시지 모드 진행 중</Text>
            </View>
            <Text style={styles.dDay}>D-{daysRemaining}</Text>
            <Text style={styles.sendStatus}>
                {canSendToday ? '오늘 메시지 전송 가능' : '오늘 메시지를 이미 보냈어요'}
            </Text>
        </View>
        <View style={styles.buttonContainer}>
            <PrimaryButton
                title="오늘의 메시지 보내기"
                onPress={onSendMessage}
                disabled={!canSendToday}
            />
        </View>
    </View>
);

// ==================== EXPIRED 상태 ====================
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
    container: {
        flex: 1,
        backgroundColor: '#FDFCF8', // 기본 배경색
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    // 배경 버블
    bubbleContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    bubble: {
        position: 'absolute',
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        alignItems: 'flex-end', // 우측 정렬
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl, // 하단 여백 추가
    },
    stateContainer: {
        flex: 1,
        justifyContent: 'space-between', // 상하 분산 배치
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainTextContainer: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    mainText: {
        fontSize: 26,
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontFamily: FONTS.serif,
        textAlign: 'center',
        lineHeight: 40, // 줄바꿈 간격 조정
    },
    subText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: SPACING.sm, // 버튼 좌우 여백 약간 조정
        marginBottom: SPACING.xl, // 하단에서 조금 띄우기
    },
    // PENDING 상태
    waitingIndicator: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.xl,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accentMuted,
    },
    dotActive: {
        backgroundColor: COLORS.accent,
    },
    // ACTIVE_PERIOD 상태
    statusBadge: {
        backgroundColor: COLORS.accentLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    statusBadgeText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.accent,
        fontWeight: '500',
    },
    dDay: {
        fontSize: FONT_SIZES.xxl,
        color: COLORS.textPrimary,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    sendStatus: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    // 개발용
    devTools: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.8)', // 배경색 추가 (텍스트 가독성)
    },
    devLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textTertiary,
    },
});
