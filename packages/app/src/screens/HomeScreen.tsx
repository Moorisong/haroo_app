import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { Connection, User } from '../types';
import { getCurrentMode, getUserProfile, acceptMode } from '../services/api';

import { BubbleBackground } from '../components/BubbleBackground';
import { UserIdCard } from '../components/UserIdCard';
import { PrimaryButton } from '../components/PrimaryButton';

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [connection, setConnection] = useState<Connection | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [connectionData, userData] = await Promise.all([
                getCurrentMode(),
                getUserProfile(),
            ]);
            setConnection(connectionData);
            setUser(userData);
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
            Alert.alert('수락 완료', '메시지 모드가 활성화되었습니다.');
            await fetchData(); // Re-fetch data to update UI to ACTIVE_PERIOD
        } catch (err) {
            Alert.alert('수락 실패', '요청을 수락하는 중 오류가 발생했습니다.');
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
            return <ActivityIndicator size="large" color={COLORS.primary} style={styles.centerContent} />;
        }

        if (error || !user) { // Removed !connection from this condition
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{error || '데이터를 불러올 수 없습니다.'}</Text>
                </View>
            );
        }

        // If connection is null, default to 'NONE' status
        const status = connection?.status || 'NONE';

        if (status === 'PENDING') {
            const isReceiver = user.id !== connection.requesterId;
            if (isReceiver) {
                return <PendingReceiverContent connection={connection} onAccept={handleAccept} />;
            }
            return <PendingSenderContent />;
        }

        switch (status) {
            case 'NONE':
                return <NoneStateContent onRequest={handleRequestMode} />;
            case 'ACTIVE_PERIOD':
                return (
                    <ActiveStateContent
                        daysRemaining={getDaysRemaining()}
                        canSendToday={connection.canSendToday ?? false}
                        onSendMessage={handleSendMessage}
                    />
                );
            case 'EXPIRED':
            case 'REJECTED':
                return <ExpiredStateContent onRequest={handleRequestMode} />;
            default:
                return <NoneStateContent onRequest={handleRequestMode} />;
        }
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
                                variant="simple"
                            />
                        </View>
                    )}
                    <View style={styles.content}>
                        {renderContent()}
                    </View>
                </ScrollView>
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

const PendingSenderContent: React.FC = () => (
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

const PendingReceiverContent: React.FC<{ connection: Connection; onAccept: (id: string) => Promise<void> }> = ({ connection, onAccept }) => {
    const [isAccepting, setIsAccepting] = useState(false);

    const handlePress = async () => {
        setIsAccepting(true);
        await onAccept(connection.id);
        setIsAccepting(false);
    };

    return (
        <View style={styles.stateContainer}>
            <View style={styles.centerContent}>
                <View style={styles.mainTextContainer}>
                    <Text style={styles.mainText}>메시지 모드 요청이{'\n'}도착했어요.</Text>
                </View>
                <Text style={styles.subText}>
                    수락하면 상대방과{'\n'}메시지 모드가 활성화돼요.
                </Text>
            </View>
            <View style={styles.buttonContainer}>
                <PrimaryButton
                    title={isAccepting ? "수락하는 중..." : "요청 수락하기"}
                    onPress={handlePress}
                    disabled={isAccepting}
                />
            </View>
        </View>
    );
};

interface ActiveStateContentProps {
    daysRemaining: number;
    canSendToday: boolean;
    onSendMessage: () => void;
}

const ActiveStateContent: React.FC<ActiveStateContentProps> = ({ daysRemaining, canSendToday, onSendMessage }) => (
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
    header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, alignItems: 'flex-end' },
    content: { flex: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    stateContainer: { flex: 1, justifyContent: 'space-between' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainTextContainer: { alignItems: 'center', marginBottom: SPACING.lg },
    mainText: { fontSize: 26, color: COLORS.textPrimary, fontWeight: 'bold', fontFamily: FONTS.serif, textAlign: 'center', lineHeight: 40 },
    subText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
    buttonContainer: { width: '100%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.xl },
    waitingIndicator: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentMuted },
    dotActive: { backgroundColor: COLORS.accent },
    statusBadge: { backgroundColor: COLORS.accentLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 16, marginBottom: SPACING.md },
    statusBadgeText: { fontSize: FONT_SIZES.xs, color: COLORS.accent, fontWeight: '500' },
    dDay: { fontSize: FONT_SIZES.xxl, color: COLORS.textPrimary, fontWeight: '600', marginBottom: SPACING.sm },
    sendStatus: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    errorText: { color: COLORS.danger, textAlign: 'center' }
});