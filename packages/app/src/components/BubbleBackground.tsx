import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const BubbleBackground = () => (
    <View style={StyleSheet.absoluteFill}>
        <View style={styles.bubbleContainer}>
            {/* 베이스 그라데이션 배경 */}
            <LinearGradient
                colors={['#FEFDFB', '#FBF8F4', '#F9F5EF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* 부드러운 버블 그라데이션들 - 더 연한 색상 */}
            <View style={[styles.bubble, {
                top: -80, left: -80, width: 320, height: 320,
                backgroundColor: 'rgba(245, 235, 224, 0.4)',
                borderRadius: 160
            }]} />
            <View style={[styles.bubble, {
                top: 150, right: -60, width: 240, height: 240,
                backgroundColor: 'rgba(232, 222, 213, 0.35)',
                borderRadius: 120
            }]} />
            <View style={[styles.bubble, {
                bottom: 100, left: -40, width: 200, height: 200,
                backgroundColor: 'rgba(240, 230, 221, 0.3)',
                borderRadius: 100
            }]} />
            <View style={[styles.bubble, {
                bottom: -60, right: 20, width: 180, height: 180,
                backgroundColor: 'rgba(248, 242, 236, 0.4)',
                borderRadius: 90
            }]} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    bubbleContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    bubble: {
        position: 'absolute',
    },
});
