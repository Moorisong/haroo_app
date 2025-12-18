import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// @desc    Get user profile
// @route   GET /users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.user is set by authMiddleware
        const user = req.user;

        if (user) {
            res.json({
                _id: user._id,
                hashId: user.hashId,
                status: user.status,
                settings: user.settings,
                blockedUsers: user.blockedUsers,
                createdAt: user.createdAt,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user settings
// @route   PATCH /users/settings
// @access  Private
export const updateUserSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.settings = {
                ...user.settings,
                ...req.body,
            };

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                hashId: updatedUser.hashId,
                status: updatedUser.status,
                settings: updatedUser.settings,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Block a user
// @route   POST /users/block
// @access  Private
export const blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { targetHashId } = req.body;

        // 1. 유효성 검사
        if (!targetHashId) {
            res.status(400);
            throw new Error('targetHashId is required');
        }

        // 2. 현재 사용자 조회
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // 3. 자기 자신 차단 방지
        if (user.hashId === targetHashId) {
            res.status(400);
            throw new Error('Cannot block yourself');
        }

        // 4. 이미 차단된 사용자인지 확인
        if (user.blockedUsers.includes(targetHashId)) {
            res.json({ message: 'User already blocked', blockedUsers: user.blockedUsers });
            return;
        }

        // 5. blockedUsers 배열에 추가
        user.blockedUsers.push(targetHashId);
        await user.save();

        res.json({
            message: 'User blocked successfully',
            blockedUsers: user.blockedUsers,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register FCM token for push notifications
// @route   POST /users/fcm-token
// @access  Private
export const registerFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            res.status(400);
            throw new Error('fcmToken is required');
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.fcmToken = fcmToken;
        await user.save();

        res.json({ message: 'FCM token registered successfully' });
    } catch (error) {
        next(error);
    }
};
