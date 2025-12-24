/**
 * Billing Controller
 * Google Play 결제 검증 및 메시지 모드 활성화
 */

import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import MessageMode from '../models/MessageMode';
import User from '../models/User';
import { sendPushNotification, PUSH_MESSAGES } from '../services/pushService';
import { getToday } from '../utils/testMode';

// Google Play Developer API 클라이언트
let androidPublisher: any = null;

// 패키지 이름 (app.config.js의 android.package와 일치해야 함)
const PACKAGE_NAME = 'com.haroo.app';

/**
 * Google Play API 클라이언트 초기화
 */
const initGooglePlayClient = async () => {
    if (androidPublisher) return androidPublisher;

    try {
        // 서비스 계정 키 파일 경로 또는 환경변수에서 가져오기
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            console.error('[Billing] GOOGLE_SERVICE_ACCOUNT_KEY not configured');
            return null;
        }

        const credentials = JSON.parse(serviceAccountKey);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });

        androidPublisher = google.androidpublisher({
            version: 'v3',
            auth,
        });

        console.log('[Billing] Google Play API client initialized');
        return androidPublisher;
    } catch (error) {
        console.error('[Billing] Failed to init Google Play client:', error);
        return null;
    }
};

/**
 * 상품 ID로 기간(일) 반환
 */
const getDurationFromProductId = (productId: string): number => {
    switch (productId) {
        case 'message_mode_1day':
            return 1;
        case 'message_mode_3day':
            return 3;
        default:
            return 0;
    }
};

/**
 * 활성 모드 존재 여부 확인
 */
const hasActiveMode = async (userId: string, excludeModeId?: string) => {
    const query: any = {
        $or: [{ initiator: userId }, { recipient: userId }],
        status: { $in: ['PENDING', 'ACTIVE_PERIOD'] },
    };
    if (excludeModeId) {
        query._id = { $ne: excludeModeId };
    }
    const mode = await MessageMode.findOne(query);
    return !!mode;
};

/**
 * 구매 토큰 검증 및 메시지 모드 활성화
 * POST /billing/verify
 */
export const verifyPurchase = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, purchaseToken, recipientHashId, durationDays } = req.body;
        const initiator = req.user;

        // 필수 파라미터 검증
        if (!productId || !purchaseToken || !recipientHashId) {
            res.status(400);
            throw new Error('productId, purchaseToken, recipientHashId are required');
        }

        // 기간 검증
        const expectedDuration = getDurationFromProductId(productId);
        if (expectedDuration === 0) {
            res.status(400);
            throw new Error('Invalid productId');
        }

        if (durationDays && durationDays !== expectedDuration) {
            res.status(400);
            throw new Error('durationDays does not match productId');
        }

        // 수신자 조회
        const recipient = await User.findOne({ hashId: recipientHashId });
        if (!recipient) {
            res.status(404);
            throw new Error('Recipient not found');
        }

        // 자기 자신에게 신청 불가
        if (initiator._id.toString() === recipient._id.toString()) {
            res.status(400);
            throw new Error('Cannot request mode to yourself');
        }

        // 차단 여부 확인
        if (initiator.blockedUsers && initiator.blockedUsers.includes(recipientHashId)) {
            res.status(403);
            throw new Error('You have blocked this user');
        }
        if (recipient.blockedUsers && recipient.blockedUsers.includes(initiator.hashId)) {
            res.status(403);
            throw new Error('You are blocked by this user');
        }

        // 활성 모드 체크
        if (await hasActiveMode(initiator._id.toString())) {
            res.status(400);
            throw new Error('You already have an active or pending mode');
        }
        if (await hasActiveMode(recipient._id.toString())) {
            res.status(400);
            throw new Error('The recipient is currently busy with another mode');
        }

        // Google Play 구매 검증 (프로덕션 환경에서만)
        const isTestMode = process.env.APP_MODE === 'TEST';

        if (!isTestMode) {
            const client = await initGooglePlayClient();

            if (!client) {
                res.status(500);
                throw new Error('Google Play API not configured');
            }

            try {
                const response = await client.purchases.products.get({
                    packageName: PACKAGE_NAME,
                    productId: productId,
                    token: purchaseToken,
                });

                const purchaseState = response.data.purchaseState;

                // purchaseState: 0 = 구매됨, 1 = 취소됨, 2 = 보류 중
                if (purchaseState !== 0) {
                    res.status(400);
                    throw new Error('Purchase is not valid');
                }

                // 구매 확인 (acknowledge)
                if (!response.data.acknowledgementState) {
                    await client.purchases.products.acknowledge({
                        packageName: PACKAGE_NAME,
                        productId: productId,
                        token: purchaseToken,
                    });
                }

                console.log('[Billing] Purchase verified:', response.data);
            } catch (apiError: any) {
                console.error('[Billing] Google Play API error:', apiError);
                res.status(400);
                throw new Error('Failed to verify purchase with Google Play');
            }
        } else {
            console.log('[Billing] TEST MODE - Skipping Google Play verification');
        }

        // 메시지 모드 생성 (결제 완료 → PENDING 상태)
        const now = getToday();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 후 만료

        const newMode = await MessageMode.create({
            initiator: initiator._id,
            recipient: recipient._id,
            durationDays: expectedDuration,
            status: 'PENDING',
            requestedAt: now,
            expiresAt: expiresAt,
        });

        console.log('[Billing] Message mode created:', newMode._id);

        // 수신자에게 푸시 알림
        sendPushNotification(
            recipient._id.toString(),
            PUSH_MESSAGES.MODE_REQUESTED.title,
            PUSH_MESSAGES.MODE_REQUESTED.body,
            { type: 'MODE_REQUESTED', modeId: newMode._id.toString() }
        );

        res.status(201).json({
            success: true,
            modeId: newMode._id,
            status: newMode.status,
            message: 'Purchase verified and mode created',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 결제 취소 처리
 * POST /billing/cancel
 */
export const handlePurchaseCancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { modeId, reason } = req.body;
        const userId = req.user._id;

        if (!modeId) {
            res.status(400);
            throw new Error('modeId is required');
        }

        const mode = await MessageMode.findById(modeId);

        if (!mode) {
            res.status(404);
            throw new Error('Mode not found');
        }

        // 신청자만 취소 가능
        if (mode.initiator.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Not authorized to cancel this mode');
        }

        // PENDING 상태만 취소 가능
        if (mode.status !== 'PENDING') {
            res.status(400);
            throw new Error('Only pending modes can be cancelled');
        }

        // 상태 변경
        mode.status = 'CANCELED';
        await mode.save();

        console.log('[Billing] Mode cancelled:', modeId, 'Reason:', reason);

        res.json({
            success: true,
            message: 'Mode cancelled successfully',
        });
    } catch (error) {
        next(error);
    }
};
