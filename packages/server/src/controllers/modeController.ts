import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import MessageMode from '../models/MessageMode';

// 유틸: 유저가 이미 활성 상태의 모드(PENDING or ACTIVE)가 있는지 확인
const hasActiveMode = async (userId: string) => {
    const mode = await MessageMode.findOne({
        $or: [{ initiator: userId }, { recipient: userId }],
        status: { $in: ['PENDING', 'ACTIVE'] },
    });
    return !!mode;
};

// @desc    Request a message mode (Start connection)
// @route   POST /modes/request
// @access  Private
// @body    targetHashId, durationDays
export const requestMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { targetHashId, durationDays } = req.body;
        const initiator = req.user;

        if (!targetHashId || !durationDays) {
            res.status(400);
            throw new Error('Target Hash ID and durationDays are required');
        }

        if (![1, 3].includes(durationDays)) {
            res.status(400);
            throw new Error('Invalid durationDays. Must be 1 or 3.');
        }

        // 1. 대상 유저 찾기
        const recipient = await User.findOne({ hashId: targetHashId });
        if (!recipient) {
            res.status(404);
            throw new Error('User not found');
        }

        // 2. 나 자신에게 요청 불가
        if (initiator._id.toString() === recipient._id.toString()) {
            res.status(400);
            throw new Error('Cannot request mode to yourself');
        }

        // 3. 중복/상태 체크: 나 혹은 상대방이 이미 다른 모드 진행중인지
        // "사용자 당 동시에 1개의 메시지 모드만"
        if (await hasActiveMode(initiator._id.toString())) {
            res.status(400);
            throw new Error('You already have an active or pending mode');
        }

        if (await hasActiveMode(recipient._id.toString())) {
            res.status(400);
            throw new Error('The recipient is currently busy with another mode');
        }

        // 4. 모드 생성 (PENDING)
        const newMode = await MessageMode.create({
            initiator: initiator._id,
            recipient: recipient._id,
            durationDays,
            status: 'PENDING',
        });

        res.status(201).json(newMode);
    } catch (error) {
        next(error);
    }
};

// @desc    Accept a message mode request
// @route   POST /modes/accept/:id
// @access  Private
export const acceptMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const modeId = req.params.id;
        const userId = req.user._id;

        const mode = await MessageMode.findById(modeId);

        if (!mode) {
            res.status(404);
            throw new Error('Mode request not found');
        }

        // 요청 받은 당사자만 수락 가능
        if (mode.recipient.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Not authorized to accept this request');
        }

        if (mode.status !== 'PENDING') {
            res.status(400);
            throw new Error('Mode is not in pending state');
        }

        // 3. 중복 상태 재확인 (그 사이 다른 모드가 생겼을 수도 있음)
        if (await hasActiveMode(userId.toString())) {
            res.status(400);
            throw new Error('You already have an active mode');
        }

        // initiator 상태도 확인 필요 (상대방이 그 사이 딴 짓을 했을 수도...)
        // 엄격하게 하려면 여기서 initiator status도 체크해야 함.
        // 일단 패스하거나 추후 추가.

        // 상태 변경
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + mode.durationDays);

        mode.status = 'ACTIVE';
        mode.startDate = startDate;
        mode.endDate = endDate;

        await mode.save();

        res.json(mode);
    } catch (error) {
        next(error);
    }
};

// @desc    Get current mode status
// @route   GET /modes/current
// @access  Private
export const getCurrentMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        const mode = await MessageMode.findOne({
            $or: [{ initiator: userId }, { recipient: userId }],
            status: { $in: ['PENDING', 'ACTIVE'] },
        })
            .populate('initiator', 'hashId settings')
            .populate('recipient', 'hashId settings');

        res.json(mode || null); // 없으면 null 반환
    } catch (error) {
        next(error);
    }
};
