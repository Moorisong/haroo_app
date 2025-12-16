import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import MessageMode from '../models/MessageMode';
import mongoose from 'mongoose';

// @desc    Send a message (Daily limit: 1)
// @route   POST /messages
// @access  Private
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content, modeId } = req.body;
        const senderId = req.user._id;

        if (!content || !modeId) {
            res.status(400);
            throw new Error('Content and modeId are required');
        }

        // 1. 모드 검증
        const mode = await MessageMode.findById(modeId);
        if (!mode) {
            res.status(404);
            throw new Error('Message Mode not found');
        }

        // 2. 권한 검증 (참여자인가?)
        const isParticipant =
            mode.initiator.toString() === senderId.toString() ||
            mode.recipient.toString() === senderId.toString();

        if (!isParticipant) {
            res.status(403);
            throw new Error('Not authorized to send message to this mode');
        }

        // 3. 모드 활성 상태 검증
        if (mode.status !== 'ACTIVE_PERIOD') {
            res.status(400);
            throw new Error('Message Mode is not active');
        }

        // 4. 기간 만료 검증 (여기서 잡거나 별도 배치로 잡거나. 안전을 위해 이중 장치)
        if (mode.endDate && new Date() > mode.endDate) {
            res.status(400);
            throw new Error('Message Mode has expired');
        }

        // 5. 하루 1회 제한 확인 (오늘 날짜 00:00:00 ~ 23:59:59)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existMessage = await Message.findOne({
            modeId: mode._id,
            sender: senderId,
            sentAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        if (existMessage) {
            res.status(400);
            throw new Error('You have already sent a message today');
        }

        // 6. 메시지 생성
        const message = await Message.create({
            modeId: mode._id,
            sender: senderId,
            content,
            isRead: false,
        });

        // TODO: Push Notification Trigger (Future Work)

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};

// @desc    Get message received today
// @route   GET /messages/received/today
// @access  Private
export const getTodayMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        // 1. 현재 활성 모드 찾기
        const activeMode = await MessageMode.findOne({
            $or: [{ initiator: userId }, { recipient: userId }],
            status: 'ACTIVE_PERIOD',
        });

        if (!activeMode) {
            // 활성 모드가 없으면 오늘 받은 메시지도 없음
            res.json({ message: null });
            return;
        }

        // 2. 상대방 ID 찾기
        const partnerId =
            activeMode.initiator.toString() === userId.toString()
                ? activeMode.recipient
                : activeMode.initiator;

        // 3. 오늘 날짜 범위
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 4. 상대방이 보낸 오늘 메시지 찾기
        const message = await Message.findOne({
            modeId: activeMode._id,
            sender: partnerId,
            sentAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        // 5. 메시지가 있으면 읽음 처리 (상세 조회 시 읽음으로 간주)
        if (message && !message.isRead) {
            message.isRead = true;
            await message.save();
        }

        res.json({ message });
    } catch (error) {
        next(error);
    }
};
