import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';

interface UserIdCardProps {
    userId: string;
    onCopy: () => void;
}

export const UserIdCard: React.FC<UserIdCardProps> = ({
    userId,
    onCopy,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.idLabel}>ID: {userId}</Text>
            <TouchableOpacity onPress={onCopy} style={styles.copyButton}>
                <Feather name="copy" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // 반투명 배경
        borderRadius: 12,
    },
    idLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    copyButton: {
        padding: 4,
    },
});
