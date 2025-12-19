import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    onPress,
    disabled = false,
    style,
}) => {
    return (
        <View style={[styles.outerContainer, disabled && styles.outerContainerDisabled, style]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    disabled && styles.buttonDisabled,
                ]}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.8}
            >
                <Text style={[styles.text, disabled && styles.textDisabled]}>
                    {title}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.accentLight,
        padding: 4, // 테두리와 버튼 사이의 간격
    },
    outerContainerDisabled: {
        borderColor: COLORS.buttonDisabled,
    },
    button: {
        backgroundColor: COLORS.buttonPrimary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 10, // 안쪽 버튼 radius
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: COLORS.buttonDisabled,
    },
    text: {
        color: COLORS.buttonText,
        fontSize: FONT_SIZES.md,
        fontWeight: '500',
    },
    textDisabled: {
        color: COLORS.buttonTextDisabled,
    },
});
