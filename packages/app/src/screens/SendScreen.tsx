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
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { BubbleBackground } from '../components/BubbleBackground';
import { sendMessage } from '../services/api';
import { AxiosError } from 'axios';

type PriceOption = 500 | 1000;
type DurationOption = 1 | 3;

export const SendScreen: React.FC = () => {
    const navigation = useNavigation();

    const [message, setMessage] = useState('');
    const [selectedPrice, setSelectedPrice] = useState<PriceOption>(500);
    const [isSending, setIsSending] = useState(false);

    const checkLimit = (text: string) => {
        if (text.length <= 40) {
            setMessage(text);
        }
    };

    const handleSend = async () => {
        if (message.trim().length === 0) {
            Alert.alert('알림', '메시지를 입력해주세요.');
            return;
        }

        const duration: DurationOption = selectedPrice === 500 ? 1 : 3;

        setIsSending(true);
        try {
            await sendMessage({ message: message.trim(), duration });
            Alert.alert('전송 완료', '메시지가 성공적으로 전송되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message || '메시지 전송에 실패했습니다.';
            Alert.alert('전송 실패', errorMessage);
        } finally {
            setIsSending(false);
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
                <Text style={styles.headerTitle}>메시지 작성</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={styles.content}>
                        {/* 메시지 입력 섹션 */}
                        <View style={styles.section}>
                            <Text style={styles.microCopy}>
                                한 문장이면 충분해요.{'\n'}오늘의 마음을 전해봐요.
                            </Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="메시지를 입력하세요"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={message}
                                    onChangeText={checkLimit}
                                    multiline
                                    maxLength={40}
                                />
                                <Text style={styles.counter}>{message.length} / 40</Text>
                            </View>

                            <Text style={styles.notice}>
                                이 메시지는 하루에 한 번만 보낼 수 있어요.
                            </Text>
                        </View>

                        {/* 가격 선택 섹션 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>마음의 무게를 선택해주세요.</Text>

                            <View style={styles.optionContainer}>
                                <PriceOptionCard
                                    price={500}
                                    label="1일"
                                    description="오늘 떠오른 마음"
                                    selected={selectedPrice === 500}
                                    onPress={() => setSelectedPrice(500)}
                                />
                                <PriceOptionCard
                                    price={1000}
                                    label="3일"
                                    description="조금 더 깊은 마음, 이어지는 시간"
                                    selected={selectedPrice === 1000}
                                    onPress={() => setSelectedPrice(1000)}
                                />
                            </View>

                            <Text style={styles.philosophyDescription}>
                                선택한 기간 동안 메시지 모드가 활성화됩니다.{'\n'}짧게 또는 조금 더 길게, 마음을 전하는 시간을 선택하세요.
                            </Text>
                        </View>

                        {/* 결제 버튼 */}
                        <PrimaryButton
                            title={isSending ? '전송 중...' : `${selectedPrice.toLocaleString()}원으로 보내기`}
                            onPress={handleSend}
                            disabled={message.trim().length === 0 || isSending}
                            style={styles.payButton}
                        />
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
};

// 가격 선택 카드 컴포넌트
const PriceOptionCard: React.FC<{
    price: number;
    label: string;
    description: string;
    selected: boolean;
    onPress: () => void
}> = ({ price, label, description, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.optionCard, selected && styles.optionCardSelected]}
        onPress={onPress}
        activeOpacity={0.9}
    >
        <View style={styles.optionHeader}>
            <View style={styles.optionRadio}>
                {selected && <View style={styles.optionRadioInner} />}
            </View>
            <Text style={[styles.optionPrice, selected && styles.optionTextSelected]}>
                {price.toLocaleString()}원
            </Text>
            <View style={styles.optionBadge}>
                <Text style={styles.optionBadgeText}>{label}</Text>
            </View>
        </View>
        <Text style={[styles.optionDescription, selected && styles.optionTextSelected]}>
            {description}
        </Text>
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
        marginBottom: SPACING.xxl,
    },
    microCopy: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.serif,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
        paddingTop: SPACING.md,
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        height: 120,
        textAlignVertical: 'top',
    },
    counter: {
        position: 'absolute',
        bottom: SPACING.sm,
        right: SPACING.md,
        fontSize: FONT_SIZES.sm,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
    },
    notice: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    optionContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    optionCard: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
    },
    optionCardSelected: {
        backgroundColor: '#FFFBF5',
        borderColor: COLORS.accent,
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    optionRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.divider,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.accent,
    },
    optionPrice: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
        marginRight: SPACING.sm,
    },
    optionBadge: {
        backgroundColor: COLORS.accentLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    optionBadgeText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textPrimary,
        fontFamily: FONTS.bold,
    },
    optionDescription: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textTertiary,
        fontFamily: FONTS.regular,
        paddingLeft: 28,
    },
    optionTextSelected: {
        color: COLORS.textPrimary,
        borderColor: COLORS.accent,
    },
    philosophyDescription: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    payButton: {
        marginTop: SPACING.sm,
    },
});