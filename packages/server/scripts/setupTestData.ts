// 테스트용 DB 세팅 스크립트
// 실행: npx ts-node scripts/setupTestData.ts
// 목적: 694129603b7bc6cf81ee0975 유저가 메시지를 받은 상태로 세팅

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import User, { IUser } from '../src/models/User';
import MessageMode from '../src/models/MessageMode';
import Message from '../src/models/Message';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/haroo';

// 내 계정 ID (수신자)
const MY_USER_ID = '694129603b7bc6cf81ee0975';

const setupTestData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        // 1. 내 계정 확인
        const myUser = await User.findById(MY_USER_ID);
        if (!myUser) {
            console.error('내 계정을 찾을 수 없습니다:', MY_USER_ID);
            process.exit(1);
        }
        console.log('내 계정 확인:', myUser.hashId);

        // 2. 발신자 유저 생성 (테스트용)
        let sender: IUser | null = await User.findOne({ hashId: 'TEST_SENDER' });
        if (!sender) {
            sender = await User.create({
                kakaoId: 'test_kakao_id_sender',
                hashId: 'TEST_SENDER',
                status: 'ACTIVE',
                settings: {
                    displayMode: 'NOTIFICATION',
                },
            });
            console.log('발신자 유저 생성됨:', sender._id);
        } else {
            console.log('발신자 유저 이미 존재:', sender._id);
        }

        // 3. 기존 MessageMode 삭제 (테스트용)
        await MessageMode.deleteMany({
            $or: [
                { initiator: MY_USER_ID },
                { recipient: MY_USER_ID },
                { initiator: sender._id },
                { recipient: sender._id },
            ],
        });
        console.log('기존 MessageMode 삭제됨');

        // 4. 기존 Message 삭제 (테스트용)
        await Message.deleteMany({
            $or: [
                { sender: MY_USER_ID },
                { sender: sender._id },
            ],
        });
        console.log('기존 Message 삭제됨');

        // 5. MessageMode 생성 (ACTIVE_PERIOD 상태)
        // sender가 initiator, 나(MY_USER_ID)가 recipient
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 3); // 3일 후 종료

        const activeMode = await MessageMode.create({
            initiator: sender._id,
            recipient: MY_USER_ID,
            durationDays: 3,
            status: 'ACTIVE_PERIOD',
            startDate,
            endDate,
        });
        console.log('MessageMode 생성됨:', activeMode._id);

        // 6. Message 생성 (sender가 나에게 보낸 메시지)
        const sentAt = new Date();
        const expiresAt = new Date(sentAt.getTime() + 24 * 60 * 60 * 1000); // +24시간

        const message = await Message.create({
            modeId: activeMode._id,
            sender: sender._id,
            content: '오늘 하루도 수고했어요 💕',
            isRead: false,
            status: 'ACTIVE',
            sentAt,
            expiresAt,
        });
        console.log('Message 생성됨:', message._id);

        console.log('\n========================================');
        console.log('✅ 테스트 데이터 세팅 완료!');
        console.log('========================================');
        console.log('내 계정:', MY_USER_ID);
        console.log('발신자:', sender._id);
        console.log('MessageMode ID:', activeMode._id);
        console.log('Message ID:', message._id);
        console.log('메시지 내용:', message.content);
        console.log('========================================\n');

        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

setupTestData();
