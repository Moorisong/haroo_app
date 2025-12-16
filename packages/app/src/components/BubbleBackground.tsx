import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export const BubbleBackground = () => (
    <View style={StyleSheet.absoluteFill}>
        <View style={styles.bubbleContainer}>
            {/* 배경 베이스 색상 */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FDFCF8' }]} />

            {/* 큰 버블들 */}
            <View style={[styles.bubble, {
                top: -100, left: -50, width: 400, height: 400,
                backgroundColor: '#F5EBE0',
                borderRadius: 200
            }]} />
            <View style={[styles.bubble, {
                top: 200, right: -100, width: 300, height: 300,
                backgroundColor: '#E8DED5',
                borderRadius: 150
            }]} />
            <View style={[styles.bubble, {
                bottom: -50, left: 50, width: 250, height: 250,
                backgroundColor: '#F0E6DD',
                borderRadius: 125
            }]} />

            {/* 전체 블러 처리로 몽환적인 느낌 연출 */}
            <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="light" />
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
