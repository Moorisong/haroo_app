// 메시지 만료 처리 및 삭제 배치 스크립트
// 실행: npx ts-node scripts/messageCleanup.ts
// 권장 실행 시점: 매일 새벽 4시 (KST)
//
// 동작:
// 1. ACTIVE 상태이면서 expiresAt이 현재보다 이전인 메시지 → EXPIRED로 상태 변경
// 2. EXPIRED 상태이면서 expiresAt 기준 7일 경과한 메시지 → DB에서 삭제

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import Message from '../src/models/Message';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/haroo';

// 7일을 밀리초로 계산
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const runCleanup = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');
        console.log(`[${new Date().toISOString()}] 메시지 정리 작업 시작`);

        const now = new Date();
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

        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

runCleanup();
