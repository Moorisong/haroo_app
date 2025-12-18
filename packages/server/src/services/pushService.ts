import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import User from '../models/User';

// Firebase Admin SDK 초기화
const configDir = path.join(__dirname, '../../config');
const files = fs.readdirSync(configDir);
const serviceAccountFile = files.find(f => f.includes('firebase-adminsdk'));

if (serviceAccountFile) {
    const serviceAccountPath = path.join(configDir, serviceAccountFile);
    const serviceAccount = require(serviceAccountPath);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    console.log('✅ Firebase Admin SDK initialized');
} else {
    console.warn('⚠️ Firebase Admin SDK key not found. Push notifications disabled.');
}

// 푸시 알림 메시지 상수
export const PUSH_MESSAGES = {
    MODE_REQUESTED: {
        title: '누군가 마음을 전하고 싶어 해요',
        body: '허락하면 하루에 한 번 메시지를 받을 수 있어요.',
    },
    MODE_ACCEPTED: {
        title: '메시지 수신이 허락되었어요',
        body: '오늘부터 하루에 한 번 메시지를 보낼 수 있어요.',
    },
    MODE_REJECTED: {
        title: '메시지 모드 신청이 거절되었어요',
        body: '상대의 선택을 존중해 주세요.',
    },
    MESSAGE_RECEIVED: {
        title: '오늘의 메시지가 도착했어요',
        body: '', // 미리보기 없음
    },
    MODE_EXPIRED: {
        title: '메시지 모드가 종료되었어요',
        body: '필요하다면 다시 신청할 수 있어요.',
    },
};

// 푸시 알림 전송 함수
export const sendPushNotification = async (
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> => {
    try {
        const user = await User.findById(userId);
        if (!user?.fcmToken) {
            console.log(`No FCM token for user ${userId}`);
            return false;
        }

        const message: admin.messaging.Message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            token: user.fcmToken,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'haroo_default',
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log(`✅ Push sent to ${userId}: ${response}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send push to ${userId}:`, error);
        return false;
    }
};

// 특정 이벤트용 헬퍼 함수들
export const sendModeRequestedPush = (recipientId: string) =>
    sendPushNotification(
        recipientId,
        PUSH_MESSAGES.MODE_REQUESTED.title,
        PUSH_MESSAGES.MODE_REQUESTED.body,
        { type: 'MODE_REQUESTED' }
    );

export const sendModeAcceptedPush = (initiatorId: string) =>
    sendPushNotification(
        initiatorId,
        PUSH_MESSAGES.MODE_ACCEPTED.title,
        PUSH_MESSAGES.MODE_ACCEPTED.body,
        { type: 'MODE_ACCEPTED' }
    );

export const sendModeRejectedPush = (initiatorId: string) =>
    sendPushNotification(
        initiatorId,
        PUSH_MESSAGES.MODE_REJECTED.title,
        PUSH_MESSAGES.MODE_REJECTED.body,
        { type: 'MODE_REJECTED' }
    );

export const sendMessageReceivedPush = (recipientId: string) =>
    sendPushNotification(
        recipientId,
        PUSH_MESSAGES.MESSAGE_RECEIVED.title,
        PUSH_MESSAGES.MESSAGE_RECEIVED.body,
        { type: 'MESSAGE_RECEIVED' }
    );
