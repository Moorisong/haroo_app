// 샘플 메시지 데이터 추가 스크립트
// 실행: npx ts-node scripts/seedMessage.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import Message from '../src/models/Message';
import MessageMode from '../src/models/MessageMode';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/haroo';

const seedMessage = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        // 현재 ACTIVE_PERIOD 상태인 모드 찾기
        const activeMode = await MessageMode.findOne({ status: 'ACTIVE_PERIOD' });

        if (!activeMode) {
            console.log('활성화된 메시지 모드가 없습니다. 먼저 모드를 활성화해주세요.');
            process.exit(1);
        }

        console.log('Active Mode found:', activeMode._id);

        // 샘플 메시지 생성 (initiator가 보낸 메시지)
        const sampleMessage = await Message.create({
            modeId: activeMode._id,
            sender: activeMode.initiator,
            content: '오늘 하루도 수고했어요 💕',
            isRead: false,
            sentAt: new Date(),
        });

        console.log('샘플 메시지가 추가되었습니다:', sampleMessage);

        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedMessage();
