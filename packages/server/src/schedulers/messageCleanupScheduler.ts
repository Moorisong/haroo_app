// 메시지 정리 작업 스케줄러
// 서버 시작 시 자동으로 등록됨

import cron from 'node-cron';
import Message from '../models/Message';
import { getToday } from '../utils/testMode';

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
