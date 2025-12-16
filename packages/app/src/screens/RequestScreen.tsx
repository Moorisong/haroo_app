import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { BubbleBackground } from '../components/BubbleBackground';

interface RequestScreenProps {
    onBack: () => void;
}

type Step = 'CHECK_ID' | 'SELECT_DURATION';
type CheckStatus = 'IDLE' | 'AVAILABLE' | 'UNAVAILABLE';

export const RequestScreen: React.FC<RequestScreenProps> = ({ onBack }) => {
    const [step, setStep] = useState<Step>('CHECK_ID');
    const [targetId, setTargetId] = useState('');
    const [checkStatus, setCheckStatus] = useState<CheckStatus>('IDLE');
    const [selectedDuration, setSelectedDuration] = useState<1 | 7 | null>(null);

    const handleCheckId = () => {
        if (!targetId.trim()) {
            Alert.alert('알림', '상대방의 ID를 입력해주세요.');
            return;
        }
        // TODO: 실제 API 연동
        // 테스트를 위해 'fail'이 포함되면 불가, 그 외에는 가능으로 처리
        if (targetId.toLowerCase().includes('fail')) {
            setCheckStatus('UNAVAILABLE');
        } else {
            setCheckStatus('AVAILABLE');
        }
    };

    const handleApply = () => {
        if (!selectedDuration) return;
        Alert.alert('신청 완료', `${targetId}님에게 ${selectedDuration}일간 메시지 모드를 신청했습니다.`, [
            { text: '확인', onPress: onBack }
        ]);
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>메시지 모드 신청</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={styles.content}>
                        {/* 상단 안내 */}
                        <View style={styles.section}>
                            <Text style={styles.title}>상대방의 ID를{'\n'}입력해 주세요.</Text>
                            <Text style={styles.subTitle}>
                                상대방에게는{'\n'}내 ID를 공유해야 신청을 받을 수 있어요.
                            </Text>
                        </View>

                        {/* Step 1. ID 입력 및 확인 */}
                        <View style={styles.inputSection}>
                            <TextInput
                                style={styles.input}
                                placeholder="상대방 ID를 입력하세요"
                                placeholderTextColor={COLORS.textTertiary}
                                value={targetId}
                                onChangeText={(text) => {
                                    setTargetId(text);
                                    setCheckStatus('IDLE'); // 입력 변경 시 상태 초기화
                                    setStep('CHECK_ID');
                                    setSelectedDuration(null); // duration reset
                                }}
                                autoCapitalize="none"
                            />
                            {checkStatus === 'IDLE' && (
                                <PrimaryButton
                                    title="확인하기"
                                    onPress={handleCheckId}
                                    style={styles.checkButton}
                                />
                            )}
                        </View>

                        {/* 상태 결과 메시지 */}
                        {checkStatus === 'AVAILABLE' && (
                            <View style={styles.statusMessageContainer}>
                                <Text style={styles.statusMessageAvailable}>
                                    이 사용자에게{'\n'}메시지 모드를 신청할 수 있어요.
                                </Text>
                            </View>
                        )}

                        {checkStatus === 'UNAVAILABLE' && (
                            <View style={styles.statusMessageContainer}>
                                <Text style={styles.statusMessageUnavailable}>
                                    지금은 메시지 모드를{'\n'}신청할 수 없는 상태예요.
                                </Text>
                            </View>
                        )}

                        {/* Step 2. 기간 선택 (AVAILABLE 상태일 때만 표시) */}
                        {checkStatus === 'AVAILABLE' && (
                            <View style={styles.stepTwoContainer}>
                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>전송할 기간을 선택해주세요.</Text>

                                <View style={styles.selectionContainer}>
                                    <SelectionButton
                                        label="1일"
                                        selected={selectedDuration === 1}
                                        onPress={() => setSelectedDuration(1)}
                                    />
                                    <SelectionButton
                                        label="7일"
                                        selected={selectedDuration === 7}
                                        onPress={() => setSelectedDuration(7)}
                                    />
                                </View>

                                <Text style={styles.description}>
                                    선택한 기간 동안{'\n'}하루에 한 번 메시지를 보낼 수 있어요.
                                </Text>

                                <PrimaryButton
                                    title="메시지 모드 신청하기"
                                    onPress={handleApply}
                                    disabled={!selectedDuration}
                                    style={styles.applyButton}
                                />
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
};

// 선택 버튼 컴포넌트 (내부 정의)
const SelectionButton: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.selectionButton, selected && styles.selectionButtonSelected]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <Text style={[styles.selectionText, selected && styles.selectionTextSelected]}>{label}</Text>
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
    keyboardAvoid: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 22,
        fontFamily: FONTS.serif, // 명조
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        lineHeight: 32,
    },
    subTitle: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    inputSection: {
        marginBottom: SPACING.lg,
        gap: SPACING.md,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
    },
    checkButton: {
        // PrimaryButton 스타일 활용
    },
    statusMessageContainer: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    statusMessageAvailable: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.bold,
        color: COLORS.accent,
        textAlign: 'center',
        lineHeight: 22,
    },
    statusMessageUnavailable: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.bold,
        color: '#E07878', // Error color (임시)
        textAlign: 'center',
        lineHeight: 22,
    },
    stepTwoContainer: {
        marginTop: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
    },
    selectionContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    selectionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
    },
    selectionButtonSelected: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accentLight,
    },
    selectionText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
    },
    selectionTextSelected: {
        color: COLORS.accent,
        fontWeight: 'bold',
    },
    description: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    applyButton: {
        marginTop: SPACING.md,
    },
});
