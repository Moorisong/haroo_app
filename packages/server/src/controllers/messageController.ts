import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import MessageMode from '../models/MessageMode';
import { sendMessageReceivedPush } from '../services/pushService';

// 24시간을 밀리초로 계산
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

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

        // 6. 메시지 생성 (expiresAt = sentAt + 24시간)
        const sentAt = new Date();
        const expiresAt = new Date(sentAt.getTime() + TWENTY_FOUR_HOURS_MS);

        const message = await Message.create({
            modeId: mode._id,
            sender: senderId,
            content,
            isRead: false,
            status: 'ACTIVE',
            sentAt,
            expiresAt,
        });

        // 7. 수신자에게 푸시 알림 전송
        const recipientId = mode.initiator.toString() === senderId.toString()
            ? mode.recipient.toString()
            : mode.initiator.toString();
        sendMessageReceivedPush(recipientId);

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};

// @desc    Get active message (ACTIVE + not expired)
// @route   GET /messages/received/today
// @access  Private
export const getTodayMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        // 1. 현재 활성 모드 찾기
        const activeMode = await MessageMode.findOne({
            $or: [{ initiator: userId }, { recipient: userId }],
            status: 'ACTIVE_PERIOD',
        });

        if (!activeMode) {
            // 활성 모드가 없으면 받을 메시지도 없음
            res.json({ message: null });
            return;
        }

        // 2. 상대방 ID 찾기
        const partnerId =
            activeMode.initiator.toString() === userId.toString()
                ? activeMode.recipient
                : activeMode.initiator;

        // 3. ACTIVE 상태 + 만료되지 않은 메시지 찾기 (가장 최근)
        const message = await Message.findOne({
            modeId: activeMode._id,
            sender: partnerId,
            status: 'ACTIVE',
            expiresAt: { $gt: now }, // 아직 만료되지 않음
        })
            .populate('sender', 'hashId nickname') // sender의 hashId와 nickname 포함
            .sort({ sentAt: -1 }); // 가장 최근 메시지

        res.json({ message });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a message as read
// @route   POST /messages/:id/read
// @access  Private
export const markMessageAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const messageId = req.params.id;
        const userId = req.user._id;

        // 1. 메시지 찾기
        const message = await Message.findById(messageId);
        if (!message) {
            res.status(404);
            throw new Error('Message not found');
        }

        // 2. 해당 메시지의 모드 찾기
        const mode = await MessageMode.findById(message.modeId);
        if (!mode) {
            res.status(404);
            throw new Error('Message Mode not found');
        }

        // 3. 권한 검증 (수신자만 읽음 처리 가능)
        // 메시지 sender가 아닌 사람 = 수신자
        const isReceiver = message.sender.toString() !== userId.toString();
        const isParticipant =
            mode.initiator.toString() === userId.toString() ||
            mode.recipient.toString() === userId.toString();

        if (!isParticipant || !isReceiver) {
            res.status(403);
            throw new Error('Not authorized to mark this message as read');
        }

        // 4. 이미 읽은 메시지인 경우
        if (message.isRead) {
            res.json({ message: 'Message already read', data: message });
            return;
        }

        // 5. 읽음 처리
        message.isRead = true;
        await message.save();

        res.json({ message: 'Message marked as read', data: message });
    } catch (error) {
        next(error);
    }
};
