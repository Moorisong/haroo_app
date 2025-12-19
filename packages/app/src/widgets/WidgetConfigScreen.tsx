import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { WidgetConfigurationScreenProps } from 'react-native-android-widget';

// 위젯 설정 타입
export interface WidgetConfig {
    theme: 'light' | 'dark' | 'warm';
    opacity: number; // 0.5 ~ 1.0
    fontSize: 'small' | 'medium' | 'large';
    showEmoji: boolean;
    badgeColor: 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'red' | 'teal' | 'indigo';
    fontColor: 'dark' | 'gray' | 'brown' | 'navy' | 'forest' | 'plum' | 'white';
}

// 배지 색상 정의 (8가지)
export const BADGE_COLORS = {
    purple: '#7C3AED',
    blue: '#3B82F6',
    green: '#10B981',
    pink: '#EC4899',
    orange: '#F59E0B',
    red: '#EF4444',
    teal: '#14B8A6',
    indigo: '#6366F1',
};

// 폰트 색상 정의 (7가지 - 다양한 색상 계열)
export const FONT_COLORS = {
    dark: '#1F2937',
    gray: '#6B7280',
    brown: '#92400E',
    navy: '#1E40AF',
    forest: '#166534',
    plum: '#7E22CE',
    white: '#FFFFFF',
};

// 기본 설정
export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
    theme: 'warm',
    opacity: 1.0,
    fontSize: 'medium',
    showEmoji: true,
    badgeColor: 'purple',
    fontColor: 'dark',
};

// 설정 저장 키
const WIDGET_CONFIG_KEY = 'haroo_widget_config';

// 설정 저장
export async function saveWidgetConfig(config: WidgetConfig): Promise<void> {
    await AsyncStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(config));
}

// 설정 로드
export async function loadWidgetConfig(): Promise<WidgetConfig> {
    try {
        const stored = await AsyncStorage.getItem(WIDGET_CONFIG_KEY);
        if (stored) {
            return { ...DEFAULT_WIDGET_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to load widget config:', e);
    }
    return DEFAULT_WIDGET_CONFIG;
}

// 테마 색상 정의
export const THEME_COLORS = {
    light: {
        background: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#FF6B6B',
        accentLight: '#FFE5E5',
    },
    dark: {
        background: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        accent: '#FF8A8A',
        accentLight: '#3D2929',
    },
    warm: {
        background: '#FFF9F5',
        text: '#2D2D2D',
        textSecondary: '#666666',
        accent: '#FF6B6B',
        accentLight: '#FFE5E5',
    },
};

// 폰트 크기 정의
export const FONT_SIZES = {
    small: { title: 10, message: 11, hint: 9 },
    medium: { title: 12, message: 13, hint: 10 },
    large: { title: 14, message: 15, hint: 11 },
};

export function WidgetConfigScreen({ widgetInfo, setResult, renderWidget }: WidgetConfigurationScreenProps) {
    const [config, setConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG);

    useEffect(() => {
        loadWidgetConfig().then(setConfig);
    }, []);

    const handleSave = async () => {
        await saveWidgetConfig(config);

        // 위젯 즉시 업데이트 - widgetTaskHandler를 통해 새 설정으로 렌더링
        try {
            const { widgetTaskHandler } = await import('./widget-task-handler');
            await widgetTaskHandler({
                widgetInfo,
                widgetAction: 'WIDGET_UPDATE',
                clickAction: undefined,
                clickActionData: undefined,
                renderWidget,
            });
        } catch (e) {
            console.error('Failed to update widget:', e);
        }

        setResult('ok');
    };

    const handleCancel = () => {
        setResult('cancel');
    };

    const themeOptions: { key: WidgetConfig['theme']; label: string; emoji: string }[] = [
        { key: 'light', label: '라이트', emoji: '☀️' },
        { key: 'dark', label: '다크', emoji: '🌙' },
        { key: 'warm', label: '따뜻한', emoji: '🧡' },
    ];

    const fontSizeOptions: { key: WidgetConfig['fontSize']; label: string }[] = [
        { key: 'small', label: '작게' },
        { key: 'medium', label: '보통' },
        { key: 'large', label: '크게' },
    ];

    const opacityOptions = [
        { value: 0.5, label: '50%' },
        { value: 0.7, label: '70%' },
        { value: 0.85, label: '85%' },
        { value: 1.0, label: '100%' },
    ];

    const badgeColorOptions: { key: WidgetConfig['badgeColor']; label: string; color: string }[] = [
        { key: 'purple', label: '보라', color: '#7C3AED' },
        { key: 'blue', label: '파랑', color: '#3B82F6' },
        { key: 'green', label: '초록', color: '#10B981' },
        { key: 'pink', label: '분홍', color: '#EC4899' },
        { key: 'orange', label: '주황', color: '#F59E0B' },
        { key: 'red', label: '빨강', color: '#EF4444' },
        { key: 'teal', label: '청록', color: '#14B8A6' },
        { key: 'indigo', label: '남색', color: '#6366F1' },
    ];

    const fontColorOptions: { key: WidgetConfig['fontColor']; label: string; color: string }[] = [
        { key: 'dark', label: '진한', color: '#1F2937' },
        { key: 'gray', label: '회색', color: '#6B7280' },
        { key: 'brown', label: '갈색', color: '#92400E' },
        { key: 'navy', label: '파랑', color: '#1E40AF' },
        { key: 'forest', label: '초록', color: '#166534' },
        { key: 'plum', label: '보라', color: '#7E22CE' },
        { key: 'white', label: '흰색', color: '#FFFFFF' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                    <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>위젯 설정</Text>
                <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                    <Feather name="check" size={24} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* 테마 선택 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎨 테마</Text>
                    <View style={styles.optionRow}>
                        {themeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.optionButton,
                                    config.theme === option.key && styles.optionButtonSelected,
                                ]}
                                onPress={() => setConfig({ ...config, theme: option.key })}
                            >
                                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                <Text style={[
                                    styles.optionLabel,
                                    config.theme === option.key && styles.optionLabelSelected,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 투명도 선택 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💎 투명도</Text>
                    <View style={styles.optionRow}>
                        {opacityOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionButton,
                                    config.opacity === option.value && styles.optionButtonSelected,
                                ]}
                                onPress={() => setConfig({ ...config, opacity: option.value })}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    config.opacity === option.value && styles.optionLabelSelected,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 글자 크기 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔤 글자 크기</Text>
                    <View style={styles.optionRow}>
                        {fontSizeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.optionButton,
                                    config.fontSize === option.key && styles.optionButtonSelected,
                                ]}
                                onPress={() => setConfig({ ...config, fontSize: option.key })}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    config.fontSize === option.key && styles.optionLabelSelected,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 배지 색상 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏷️ 하루 배지 색상</Text>
                    <View style={styles.optionRow}>
                        {badgeColorOptions.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.optionButton,
                                    config.badgeColor === option.key && styles.optionButtonSelected,
                                ]}
                                onPress={() => setConfig({ ...config, badgeColor: option.key })}
                            >
                                <View style={[styles.colorCircle, { backgroundColor: option.color }]} />
                                <Text style={[
                                    styles.optionLabel,
                                    config.badgeColor === option.key && styles.optionLabelSelected,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 글자 색상 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✏️ 글자 색상</Text>
                    <View style={styles.optionRow}>
                        {fontColorOptions.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.optionButton,
                                    config.fontColor === option.key && styles.optionButtonSelected,
                                ]}
                                onPress={() => setConfig({ ...config, fontColor: option.key })}
                            >
                                <View style={[styles.colorCircle, { backgroundColor: option.color }]} />
                                <Text style={[
                                    styles.optionLabel,
                                    config.fontColor === option.key && styles.optionLabelSelected,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 이모지 표시 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✨ 이모지 표시</Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                config.showEmoji && styles.optionButtonSelected,
                            ]}
                            onPress={() => setConfig({ ...config, showEmoji: true })}
                        >
                            <Text style={styles.optionEmoji}>😊</Text>
                            <Text style={[
                                styles.optionLabel,
                                config.showEmoji && styles.optionLabelSelected,
                            ]}>
                                켜기
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                !config.showEmoji && styles.optionButtonSelected,
                            ]}
                            onPress={() => setConfig({ ...config, showEmoji: false })}
                        >
                            <Text style={styles.optionEmoji}>🚫</Text>
                            <Text style={[
                                styles.optionLabel,
                                !config.showEmoji && styles.optionLabelSelected,
                            ]}>
                                끄기
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 미리보기 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👀 미리보기</Text>
                    <View style={[
                        styles.preview,
                        {
                            backgroundColor: THEME_COLORS[config.theme].background,
                            opacity: config.opacity,
                        }
                    ]}>
                        <View style={styles.previewHeader}>
                            <View style={[styles.previewBadge, { backgroundColor: BADGE_COLORS[config.badgeColor] }]}>
                                <Text style={styles.previewBadgeText}>하루</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            {config.showEmoji && (
                                <View style={[styles.previewEmojiBox, { backgroundColor: THEME_COLORS[config.theme].accentLight }]}>
                                    <Text style={{ fontSize: 16 }}>💛</Text>
                                </View>
                            )}
                            <Text style={[
                                styles.previewMessage,
                                {
                                    color: FONT_COLORS[config.fontColor],
                                    fontSize: FONT_SIZES[config.fontSize].message,
                                    flex: 1,
                                }
                            ]}>
                                오늘의 메시지 미리보기
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 하단 여백 */}
                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFCF8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
        alignItems: 'center',
    },
    optionButtonSelected: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFF5F5',
        borderWidth: 2,
    },
    optionEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    optionLabel: {
        fontSize: 12,
        color: '#666',
    },
    optionLabelSelected: {
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    colorCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginBottom: 4,
    },
    preview: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    previewTitle: {
        fontWeight: 'bold',
    },
    previewBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    previewBadgeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    previewEmojiBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    previewMessage: {
        lineHeight: 20,
    },
});
