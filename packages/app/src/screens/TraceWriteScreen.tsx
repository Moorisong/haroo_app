import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, FONT_SIZES, SPACING, FONTS } from '../constants/theme';
import { BubbleBackground } from '../components/BubbleBackground';

// 톤 태그 목록
const TONE_TAGS = [
    { id: 'happy', emoji: '😊', label: '행복' },
    { id: 'fear', emoji: '😨', label: '공포' },
    { id: 'anger', emoji: '😡', label: '분노' },
    { id: 'monologue', emoji: '😶', label: '혼잣말' },
    { id: 'review', emoji: '📝', label: '후기' },
    { id: 'comfort', emoji: '🤍', label: '위로' },
    { id: 'other', emoji: '🪶', label: '기타' },
];

const MAX_LENGTH = 60;

export const TraceWriteScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [content, setContent] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = useRef(new Animated.Value(0)).current;

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

    const handleSubmit = () => {
        // 톤 태그 선택 확인
        if (!selectedTag) {
            showToastMsg('어떤 이야기인지 선택해주세요.');
            return;
        }

        // 내용 입력 확인
        if (!content.trim()) {
            showToastMsg('한 줄을 작성해주세요.');
            return;
        }

        // TODO: API 호출
        console.log('Submit:', { content, tag: selectedTag });
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <BubbleBackground />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Feather name="x" size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>한 줄 남기기</Text>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            <Text style={[
                                styles.submitButtonText,
                                (!selectedTag || !content.trim()) && styles.submitButtonTextDisabled
                            ]}>
                                완료
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* 톤 태그 선택 */}
                        <Text style={styles.sectionLabel}>어떤 이야기인가요?</Text>
                        <View style={styles.tagContainer}>
                            {TONE_TAGS.map((tag) => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.tagButton,
                                        selectedTag === tag.id && styles.tagButtonSelected,
                                    ]}
                                    onPress={() => setSelectedTag(tag.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                                    <Text style={[
                                        styles.tagLabel,
                                        selectedTag === tag.id && styles.tagLabelSelected,
                                    ]}>
                                        {tag.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 텍스트 입력 */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="지금, 여기서 떠오르는 한 줄을 남겨보세요."
                                placeholderTextColor={COLORS.textTertiary}
                                value={content}
                                onChangeText={setContent}
                                maxLength={MAX_LENGTH}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>
                                {content.length}/{MAX_LENGTH}
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Toast Message */}
                {showToast && (
                    <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </Animated.View>
                )}
            </SafeAreaView>
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
    submitButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    submitButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.medium,
        color: COLORS.accent,
    },
    submitButtonTextDisabled: {
        color: COLORS.textTertiary,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        marginTop: SPACING.md,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    tagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tagButtonSelected: {
        backgroundColor: 'rgba(160, 128, 96, 0.12)',
        borderColor: COLORS.accent,
    },
    tagEmoji: {
        fontSize: 16,
    },
    tagLabel: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    tagLabelSelected: {
        color: COLORS.accent,
        fontFamily: FONTS.medium,
    },
    inputContainer: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 16,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 150,
    },
    textInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 24,
        minHeight: 100,
    },
    charCount: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textTertiary,
        textAlign: 'right',
        marginTop: SPACING.sm,
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
});
