import { Request, Response } from 'express';
import User from '../models/User';
import Trace from '../models/Trace';

/**
 * GET /api/admin/users
 */
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find({})
            .select('hashId nickname status traceDailyCount reportInfluence createdAt')
            .sort({ createdAt: -1 })
            .limit(100); // Pagination needed later
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/admin/messages
 */
export const getAdminMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        const limit = Number(pageSize);
        const skip = (Number(page) - 1) * limit;

        const messages = await Trace.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/admin/messages/:id/remove
 */
export const removeMessageForce = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const trace = await Trace.findByIdAndUpdate(
            id,
            { status: 'REMOVED' },
            { new: true }
        );
        res.json(trace);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/admin/statistics/messages
 */
export const getAdminStatsMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        // Simple count for now
        const total = await Trace.countDocuments();
        const today = await Trace.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        res.json({ total, today });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/admin/statistics/payment
 */
export const getAdminStatsPayment = async (req: Request, res: Response): Promise<void> => {
    // Mock data since no payment yet
    res.json({ freeCount: 100, paidCount: 0 });
};

/**
 * GET /api/admin/statistics/users
 */
export const getAdminStatsUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments();
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        res.json({ totalUsers, newUsersToday });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
