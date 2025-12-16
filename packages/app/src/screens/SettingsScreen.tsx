import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';

interface SettingsScreenProps {
    onBack: () => void;
}

type DisplayMode = 'WIDGET' | 'NOTIFICATION';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
    // 실제로는 저장된 설정을 불러와야 함
    const [displayMode, setDisplayMode] = useState<DisplayMode>('NOTIFICATION');

    return (
        <View style={styles.container}>
            <BubbleBackground />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>설정</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>

                    {/* 표시 방식 선택 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>표시 방식 선택</Text>
                        <Text style={styles.description}>
                            메시지는 선택한 방식으로만 표시돼요.
                        </Text>

                        <View style={styles.optionsContainer}>
                            <OptionCard
                                label="홈 화면 위젯"
                                icon="layout"
                                selected={displayMode === 'WIDGET'}
                                onPress={() => setDisplayMode('WIDGET')}
                            />
                            <OptionCard
                                label="알림바 고정"
                                icon="bell"
                                selected={displayMode === 'NOTIFICATION'}
                                onPress={() => setDisplayMode('NOTIFICATION')}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
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
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    description: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
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
});
