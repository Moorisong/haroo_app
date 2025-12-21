import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Trace from '../models/Trace';
import TraceReport from '../models/TraceReport';
import User from '../models/User';
import { getToday } from '../utils/testMode';

// --- Helper Functions ---

// 0.001도 approx 111m
const GRID_SIZE = 0.001;

const getGridIndex = (lat: number, lng: number) => {
    return {
        x: Math.floor(lat / GRID_SIZE),
        y: Math.floor(lng / GRID_SIZE)
    };
};

// --- Controllers ---

/**
 * GET /api/messages
 * Get messages in current grid (Trace)
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng, page = 1, pageSize = 20 } = req.query;

        if (!lat || !lng) {
            res.status(400).json({ message: 'Location (lat, lng) is required' });
            return;
        }

        const grid = getGridIndex(Number(lat), Number(lng));
        const limit = Number(pageSize);
        const skip = (Number(page) - 1) * limit;

        // Query
        const query = {
            'grid.x': grid.x,
            'grid.y': grid.y,
            status: 'ACTIVE',
            expiresAt: { $gt: getToday() } // Not expired
        };


        console.time('DB_QUERY');
        const messages = await Trace.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-authorIp'); // Hide IP
        console.timeEnd('DB_QUERY');

        // Check if user liked (if we track likes per user - implementation simplified for now)
        // For real "isLiked", we need a separate Like model or array. 
        // For this task, we will return boolean false or handle simplified.
        // Spec says: LIKE_STATUS. 
        // Let's assume we don't track *who* liked for now to keep it simple or use local storage on client?
        // Actually, preventing double likes usually requires server tracking.
        // I will implement a simple "likedBy" array in Trace if needed, but for scale better separate.
        // Spec: "좋아요는 노출 정렬에 사용 가능하나 영향은 제한적".

        // Let's stick to the model I created. `likeCount` only. 
        // To return `isLiked`, we would need to know the user. 
        // Trace model doesn't have `likedBy`. I will add it if necessary or just return count.
        // The spec implies per-user status. I will skip `isLiked` logic for now or return false.

        const userId = (req as any).user?._id;

        const messagesWithLikeStatus = messages.map(msg => {
            const msgObj = msg.toObject();
            return {
                ...msgObj,
                isLiked: userId ? msg.likedBy?.some((id: any) => id.toString() === userId.toString()) : false,
                isMine: userId ? (msg.authorId && msg.authorId.toString() === userId.toString()) : false
            };
        });

        res.json({
            messages: messagesWithLikeStatus,
            gridStatus: messages.length > 0 ? 'HAS_MESSAGES' : 'EMPTY',
            page: Number(page),
            count: messages.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/messages/:id
 */
export const getMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const message = await Trace.findById(id);

        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/messages
 * Create a new message
 */
export const createMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user is set by auth middleware
        const userId = (req as any).user?._id;
        const { content, toneTag, lat, lng } = req.body;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // 1. Check User Permission
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // 2. Check Permission Logic
        // Status: 'FREE' (1/day) vs 'PAID_PASS' (Unlimited/2h)
        const now = getToday();
        const hasValidPass = user.tracePassExpiresAt && user.tracePassExpiresAt > now;
        const cooldownMs = 2 * 60 * 60 * 1000; // 2 Hours

        if (hasValidPass) {
            // [Paid User] Check 2 hours cooldown
            if (user.lastTraceAt) {
                const lastTraceTime = new Date(user.lastTraceAt).getTime();
                const diff = now.getTime() - lastTraceTime;

                // Sanity check: if lastTraceAt is in the future (from test tools), ignore cooldown
                if (diff >= 0 && diff < cooldownMs) {
                    res.status(403).json({
                        message: 'Cooldown active',
                        writePermission: 'DENIED_COOLDOWN',
                        nextAvailableAt: new Date(lastTraceTime + cooldownMs)
                    });
                    return;
                }
            }
        } else {
            // [Free User] Check Daily Limit (1 per day)
            // Reset daily count if it's a new day? (Actually simple logic: traceDailyCount)
            // We need to ensure traceDailyCount is reset daily. 
            // For now, let's assume a scheduled job resets it or we check date.
            // Simplified "Check Date" logic:

            const lastDate = user.lastTraceAt ? user.lastTraceAt.getDate() : -1;
            const todayDate = now.getDate();

            if (lastDate !== todayDate) {
                // New day, reset logic implicitly/explicitly
                user.traceDailyCount = 0;
            }

            if (user.traceDailyCount && user.traceDailyCount >= 1) {
                res.status(403).json({
                    message: 'Daily limit reached',
                    writePermission: 'FREE_USED'
                });
                return;
            }
        }

        // For v1, simplified creation
        const grid = getGridIndex(Number(lat), Number(lng));
        const expiresAt = new Date(getToday().getTime() + 72 * 60 * 60 * 1000); // 72 hours

        const newTrace = new Trace({
            content,
            toneTag,
            location: { lat, lng },
            grid,
            status: 'ACTIVE',
            authorId: userId,
            expiresAt,
            createdAt: getToday() // Use test-aware time for consistent sorting
        });

        await newTrace.save();

        // Update user stats
        user.lastTraceAt = getToday();
        user.traceDailyCount = (user.traceDailyCount || 0) + 1;
        await user.save();

        res.status(201).json({
            message: 'Trace created',
            data: newTrace,
            writePermission: 'COOLDOWN' // Now on cooldown
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/messages/:id/like
 */
export const likeMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check if already liked to prevent double counting
        const trace = await Trace.findOne({ _id: id, likedBy: userId });

        let resultTrace;
        if (trace) {
            // Already liked
            resultTrace = trace;
        } else {
            // Not liked yet
            resultTrace = await Trace.findByIdAndUpdate(
                id,
                {
                    $addToSet: { likedBy: userId },
                    $inc: { likeCount: 1 }
                },
                { new: true }
            );
        }

        res.json({ likeStatus: 'LIKED', likeCount: resultTrace?.likeCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * DELETE /api/messages/:id/like
 */
export const unlikeMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Only decrement if user is in likedBy
        const trace = await Trace.findOneAndUpdate(
            { _id: id, likedBy: userId },
            {
                $pull: { likedBy: userId },
                $inc: { likeCount: -1 }
            },
            { new: true }
        );

        // If trace is null, it means either not found OR not liked by user.
        // We should fetch latest count anyway.
        const currentTrace = trace || await Trace.findById(id);

        res.json({ likeStatus: 'NOT_LIKED', likeCount: currentTrace?.likeCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/messages/:id/report
 */
export const reportMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { id } = req.params;
        const { reason } = req.body;

        // Prevent duplicate report
        const existingReport = await TraceReport.findOne({ traceId: id, reporterId: userId });
        if (existingReport) {
            res.status(400).json({ message: 'Already reported' });
            return;
        }

        // Create report
        await TraceReport.create({
            traceId: id,
            reporterId: userId,
            reason
        });

        // Update trace score
        // Fetch reporter influence
        const reporter = await User.findById(userId);
        const influence = reporter?.reportInfluence || 1.0;

        const trace = await Trace.findById(id);
        if (trace) {
            trace.reportScore += influence;
            // Hide if score > threshold (e.g. 3.0)
            if (trace.reportScore >= 3.0) {
                trace.status = 'HIDDEN';
            }
            await trace.save();
        }

        res.json({ reportStatus: 'ALREADY_REPORTED' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/location/current
 */
export const getLocationStatus = async (req: Request, res: Response): Promise<void> => {
    const { lat, lng } = req.query;
    // Check restricted areas etc. (Simplified)
    res.json({
        locationStatus: 'AVAILABLE',
        gridStatus: 'HAS_MESSAGES' // Mock
    });
};

/**
 * POST /api/payment/mock
 * Mock payment for testing/dev
 */
export const mockPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { type } = req.body; // 'single' (24h) or 'threeDay' (48h)

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const now = getToday();
        // If already has valid pass, extend it? Or from now?
        // Let's simplified: From NOW. 
        let durationMs = 0;
        if (type === 'single') {
            durationMs = 24 * 60 * 60 * 1000;
        } else if (type === 'threeDay') { // Actually 2 days now
            durationMs = 48 * 60 * 60 * 1000;
        }

        user.tracePassExpiresAt = new Date(now.getTime() + durationMs);

        // [UX Improvement] Reset cooldown so user can write immediately after payment
        // Set lastTraceAt to 3 hours ago
        user.lastTraceAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);

        await user.save();

        res.json({
            message: 'Payment simulated',
            tracePassExpiresAt: user.tracePassExpiresAt
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * DELETE /api/messages/:id
 * Delete a message (Author only)
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const message = await Trace.findById(id);
        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }

        if (!message.authorId) {
            res.status(500).json({ message: 'Data integrity error: Author missing' });
            return;
        }

        if (message.authorId.toString() !== userId.toString()) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        message.status = 'REMOVED';
        await message.save();

        res.json({ message: 'Message deleted' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/test-tools/seed-messages
 * Create 5 dummy messages for testing (Report etc.)
 */
export const seedMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng } = req.body;
        const dummyAuthorId = new mongoose.Types.ObjectId(); // Random ID

        const messages = [];
        const now = getToday();
        for (let i = 1; i <= 5; i++) {
            const grid = getGridIndex(Number(lat), Number(lng));
            const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
            // Set createdAt to now with slight offset (seconds) so they appear at top, newest first
            const createdAt = new Date(now.getTime() - (i - 1) * 1000);

            messages.push({
                content: `테스트 메시지입니다 #${i}\n신고 기능을 테스트해보세요.`,
                toneTag: 'other',
                location: { lat: Number(lat), lng: Number(lng) },
                grid,
                status: 'ACTIVE',
                authorId: dummyAuthorId,
                expiresAt,
                createdAt
            });
        }

        await Trace.insertMany(messages);

        res.json({ message: '5 dummy messages created', authorId: dummyAuthorId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
