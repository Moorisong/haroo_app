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
