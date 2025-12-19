import express, { Request, Response } from 'express';
import { advanceDay, resetDate, getOffset, isTestMode, getToday } from '../utils/testMode';
import User from '../models/User';
import MessageMode from '../models/MessageMode';
import Message from '../models/Message';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Middleware to ensure we are in TEST mode
const ensureTestMode = (req: Request, res: Response, next: express.NextFunction) => {
    if (!isTestMode) {
        return res.status(403).json({ error: 'Test mode is not enabled' });
    }
    next();
};

router.use(ensureTestMode);

router.get('/status', (req: Request, res: Response) => {
    res.json({
        isTestMode,
        currentOffset: getOffset(),
        currentTestDate: getToday(),
    });
});

router.post('/advance-day', (req: Request, res: Response) => {
    const { days } = req.body;
    advanceDay(days || 1);
    res.json({ message: `Advanced ${days || 1} day(s)`, currentOffset: getOffset(), currentTestDate: getToday() });
});

router.post('/reset', async (req: Request, res: Response) => {
    resetDate();

    // Reset test data
    const TEST_USER_ID = 'TEST_RECEIVER';
    const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

    if (testUser) {
        // Find modes involving test user (recipient: testUser means current user -> testUser)
        // We also want to delete modes where current user is involved if we want "Reset Connection"
        // But the requirement says "Reset Data and State" which implies global cleanup for test context

        const modes = await MessageMode.find({
            $or: [{ recipient: testUser._id }, { initiator: testUser._id }]
        });

        const modeIds = modes.map(m => m._id);

        // Delete messages in those modes
        await Message.deleteMany({ modeId: { $in: modeIds } });

        // Delete modes
        await MessageMode.deleteMany({ _id: { $in: modeIds } });
    }

    res.json({ message: 'Test state and data reset', currentOffset: getOffset(), currentTestDate: getToday() });
});

router.post('/create-test-user', async (req: Request, res: Response) => {
    try {
        const TEST_USER_ID = 'TEST_RECEIVER';
        let user = await User.findOne({ kakaoId: TEST_USER_ID });

        if (!user) {
            user = new User({
                kakaoId: TEST_USER_ID,
                nickname: '테스트 상대',
                fcmToken: 'TEST_PUSH_TOKEN',
                hashId: 'TEST_HASH_ID'
            });
            await user.save();
            return res.status(201).json({ message: 'Test user created', user });
        }

        res.json({ message: 'Test user already exists', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create test user', details: error });
    }
});

// --- Data Tools (Require Authentication) ---

router.post('/create-connection', protect, async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const TEST_USER_ID = 'TEST_RECEIVER';
        const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

        if (!testUser) {
            return res.status(404).json({ error: 'Test user not found. Create it first.' });
        }

        // Delete existing connection
        await MessageMode.deleteOne({
            $or: [
                { initiator: user._id, recipient: testUser._id },
                { initiator: testUser._id, recipient: user._id }
            ]
        });

        // Create PENDING connection
        const newMode = await MessageMode.create({
            initiator: user._id,
            recipient: testUser._id,
            durationDays: 1, // Default, can be updated later
            status: 'PENDING'
        });

        res.json({ message: 'Created PENDING connection', mode: newMode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create connection', details: error });
    }
});

router.post('/force-activate', protect, async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const { durationDays } = req.body; // 1 or 3
        const TEST_USER_ID = 'TEST_RECEIVER';
        const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

        if (!testUser) {
            return res.status(404).json({ error: 'Test user not found.' });
        }

        const mode = await MessageMode.findOne({
            $or: [
                { initiator: user._id, recipient: testUser._id },
                { initiator: testUser._id, recipient: user._id }
            ]
        });

        if (!mode) {
            return res.status(404).json({ error: 'No connection found with test user' });
        }

        const startDate = getToday();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (durationDays || mode.durationDays || 1));

        mode.status = 'ACTIVE_PERIOD';
        mode.startDate = startDate;
        mode.endDate = endDate;
        if (durationDays) mode.durationDays = durationDays;

        await mode.save();
        res.json({ message: 'Force activated connection', mode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to force activate', details: error });
    }
});

router.post('/force-expire', protect, async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const TEST_USER_ID = 'TEST_RECEIVER';
        const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

        if (!testUser) {
            return res.status(404).json({ error: 'Test user not found.' });
        }

        const mode = await MessageMode.findOne({
            $or: [
                { initiator: user._id, recipient: testUser._id },
                { initiator: testUser._id, recipient: user._id }
            ]
        });

        if (!mode) {
            return res.status(404).json({ error: 'No connection found with test user' });
        }

        mode.status = 'EXPIRED';
        // We don't change dates, just status
        await mode.save();
        res.json({ message: 'Force expired connection', mode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to force expire', details: error });
    }
});

router.get('/message-logs', protect, async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const TEST_USER_ID = 'TEST_RECEIVER';
        const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

        if (!testUser) {
            return res.status(404).json({ error: 'Test user not found.' });
        }

        const mode = await MessageMode.findOne({
            $or: [
                { initiator: user._id, recipient: testUser._id },
                { initiator: testUser._id, recipient: user._id }
            ]
        });

        if (!mode) {
            return res.json({ message: null, info: 'No connection with test user' });
        }

        // Get latest message sent to test user (test user is recipient)
        // Or if test user sent it (less likely in this flow, but possible)
        // Spec says "View Message Logs" -> "Receiver perspective"
        // So we want messages where receiver = testUser (sender = currentUser)

        const latestMessage = await Message.findOne({
            modeId: mode._id,
        }).sort({ sentAt: -1 });

        if (!latestMessage) {
            return res.json({ message: null });
        }

        res.json({
            messageId: latestMessage._id,
            senderId: latestMessage.sender,
            content: latestMessage.content,
            sentAt: latestMessage.sentAt,
            dayIndex: 0 // Placeholder, or calc diff
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to get logs', details: error });
    }
});

export default router;
