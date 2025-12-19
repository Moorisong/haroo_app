// 메시지 정리 작업 스케줄러
// 서버 시작 시 자동으로 등록됨

import cron from 'node-cron';
import Message from '../models/Message';
import MessageMode from '../models/MessageMode';
import { getToday } from '../utils/testMode';
import { sendPushNotification, PUSH_MESSAGES } from '../services/pushService';

// 7일을 밀리초로 계산
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// 메시지 정리 작업 실행
const runCleanup = async () => {
    try {
        const now = getToday(); // Use test-aware date
        console.log(`[${now.toISOString()}] 메시지 정리 작업 시작`);

        const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

        // 1. 만료된 ACTIVE 메시지 → EXPIRED 상태로 변경
        const expireResult = await Message.updateMany(
            {
                status: 'ACTIVE',
                expiresAt: { $lt: now }, // 현재 시간보다 이전 = 만료됨
            },
            {
                $set: { status: 'EXPIRED' },
            }
        );

        console.log(`[EXPIRE] ${expireResult.modifiedCount}개 메시지 만료 처리됨`);

        // 2. EXPIRED 상태 + 7일 경과 메시지 삭제
        const deleteResult = await Message.deleteMany({
            status: 'EXPIRED',
            expiresAt: { $lt: sevenDaysAgo }, // 만료 후 7일 경과
        });

        console.log(`[DELETE] ${deleteResult.deletedCount}개 메시지 삭제됨`);

        // 3. 만료된 모드 처리 (MessageMode)
        // ACTIVE_PERIOD 상태이면서 endDate가 지난 모드 찾기
        const expiredModes = await MessageMode.find({
            status: 'ACTIVE_PERIOD',
            endDate: { $lt: now },
        });

        if (expiredModes.length > 0) {
            console.log(`[EXPIRE] ${expiredModes.length}개 모드 만료 처리 시작`);

            for (const mode of expiredModes) {
                // 상태 변경
                mode.status = 'EXPIRED';
                await mode.save();

                // 양쪽 유저에게 푸시 알림 전송
                // Promise.allSettled로 한 쪽 실패해도 다른 쪽은 보내도록 시도
                await Promise.allSettled([
                    sendPushNotification(
                        mode.initiator.toString(),
                        PUSH_MESSAGES.MODE_EXPIRED.title,
                        PUSH_MESSAGES.MODE_EXPIRED.body,
                        { type: 'MODE_EXPIRED' }
                    ),
                    sendPushNotification(
                        mode.recipient.toString(),
                        PUSH_MESSAGES.MODE_EXPIRED.title,
                        PUSH_MESSAGES.MODE_EXPIRED.body,
                        { type: 'MODE_EXPIRED' }
                    )
                ]);
            }
            console.log(`[EXPIRE] 모드 만료 처리 완료`);
        }

        // 4. PENDING 리마인드 푸시 (12시간 경과, reminderSent === false)
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        const reminderCandidates = await MessageMode.find({
            status: 'PENDING',
            reminderSent: { $ne: true },
            requestedAt: { $lt: twelveHoursAgo }, // 12시간 경과
            expiresAt: { $gt: now }, // 아직 만료 안 됨
        });

        if (reminderCandidates.length > 0) {
            console.log(`[REMINDER] ${reminderCandidates.length}개 신청에 리마인드 푸시 전송`);

            for (const mode of reminderCandidates) {
                // 수신자에게 리마인드 푸시 전송
                await sendPushNotification(
                    mode.recipient.toString(),
                    '아직 선택하지 않은 마음이 있어요',
                    '하루가 지나면 이 요청은 사라져요',
                    { type: 'PENDING_REMINDER' }
                );

                // 전송 기록
                mode.reminderSent = true;
                mode.reminderSentAt = now;
                await mode.save();
            }
            console.log(`[REMINDER] 리마인드 푸시 전송 완료`);
        }

        // 5. PENDING 상태의 오래된 신청 자동 만료 (24시간 경과)
        // 수신자에게 알림 없음 (무응답 = 자연 종료)
        const expiredPendingModes = await MessageMode.find({
            status: 'PENDING',
            expiresAt: { $lt: now },
        });

        if (expiredPendingModes.length > 0) {
            console.log(`[PENDING EXPIRE] ${expiredPendingModes.length}개 신청 만료 처리 시작`);

            for (const mode of expiredPendingModes) {
                mode.status = 'EXPIRED';
                await mode.save();

                // 신청자에게만 알림 (수신자에게는 알림 없음 - 명세 준수)
                await sendPushNotification(
                    mode.initiator.toString(),
                    '메시지 모드 신청이 만료되었어요',
                    '응답이 없어 자동으로 종료되었습니다.',
                    { type: 'PENDING_EXPIRED' }
                );
            }
            console.log(`[PENDING EXPIRE] 신청 만료 처리 완료`);
        }

        console.log(`[${new Date().toISOString()}] 메시지 정리 작업 완료`);
    } catch (error) {
        console.error('메시지 정리 작업 오류:', error);
    }
};

// 스케줄러 초기화 (매일 새벽 4시 KST = UTC 19:00 전날)
export const initMessageCleanupScheduler = () => {
    // cron 표현식: '0 4 * * *' = 매일 04:00 (서버 시간 기준)
    // 서버가 KST 기준이면 그대로, UTC 기준이면 '0 19 * * *' 사용
    cron.schedule('0 4 * * *', () => {
        console.log('[CRON] 매일 새벽 4시 메시지 정리 작업 실행');
        runCleanup();
    }, {
        timezone: 'Asia/Seoul', // KST 타임존
    });

    console.log('✅ 메시지 정리 스케줄러 등록 완료 (매일 04:00 KST)');
};

// 수동 실행용 export
export { runCleanup };
