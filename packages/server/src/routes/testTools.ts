import express, { Request, Response } from 'express';
import { advanceDay, advanceHours, resetDate, getOffset, isTestMode, getToday } from '../utils/testMode';
import User from '../models/User';
import MessageMode from '../models/MessageMode';
import Message from '../models/Message';
import { protect } from '../middlewares/authMiddleware';
import { sendModeAcceptedPush, sendModeRejectedPush, sendPushNotification, PUSH_MESSAGES, sendModeRequestedPush } from '../services/pushService';
import { runCleanup } from '../schedulers/messageCleanupScheduler';
import PushLog from '../models/PushLog';

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

router.post('/advance-day', async (req: Request, res: Response) => {
    const { days } = req.body;
    advanceDay(days || 1);

    // [FIX] Manually trigger cleanup to expire modes/messages immediately
    await runCleanup();

    res.json({ message: `Advanced ${days || 1} day(s)`, currentOffset: getOffset(), currentTestDate: getToday() });
});

router.post('/advance-hours', async (req: Request, res: Response) => {
    const { hours } = req.body;
    advanceHours(hours || 12);

    // Trigger cleanup to check reminder and expiry
    await runCleanup();

    res.json({ message: `Advanced ${hours || 12} hour(s)`, currentOffset: getOffset(), currentTestDate: getToday() });
});



// ... existing code ...

// Reset for Main Content (MessageMode)
router.post('/reset-main', async (req: Request, res: Response) => {
    resetDate();

    // Reset test data
    const TEST_USER_ID = 'TEST_RECEIVER';
    const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

    if (testUser) {
        const modes = await MessageMode.find({
            $or: [{ recipient: testUser._id }, { initiator: testUser._id }]
        });

        const modeIds = modes.map(m => m._id);

        await Message.deleteMany({ modeId: { $in: modeIds } });
        await MessageMode.deleteMany({ _id: { $in: modeIds } });

        // Delete Push Logs for test user
        await PushLog.deleteMany({ userId: testUser._id.toString() });
    }

    res.json({ message: '메인 콘텐츠 테스트 상태 초기화 완료', currentOffset: getOffset(), currentTestDate: getToday() });
});

// Reset for Trace (한줄)
router.post('/reset-trace', protect, async (req: Request, res: Response) => {
    resetDate();

    const user = req.user;
    if (user) {
        // Reset Trace-related user fields
        user.tracePassExpiresAt = null;
        user.lastTraceAt = null;
        user.traceDailyCount = 0;
        await user.save();
    }

    res.json({ message: '한줄 테스트 상태 초기화 완료', currentOffset: getOffset(), currentTestDate: getToday() });
});

// ... existing code ...

router.get('/push-logs', protect, async (req: Request, res: Response) => {
    try {
        const TEST_USER_ID = 'TEST_RECEIVER';
        const testUser = await User.findOne({ kakaoId: TEST_USER_ID });

        if (!testUser) {
            return res.status(404).json({ error: 'Test user not found.' });
        }

        // Get latest push log for EITHER test receiver OR current user
        // This allows viewing "Accepted" pushes (sent to me) and "Received" pushes (sent to test user)
        const latestPush = await PushLog.findOne({
            userId: { $in: [testUser._id.toString(), req.user._id.toString()] }
        }).sort({ triggeredAt: -1 });

        if (!latestPush) {
            return res.json({ log: null });
        }

        res.json({
            title: latestPush.title,
            body: latestPush.body,
            triggeredAt: latestPush.triggeredAt
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to get push logs', details: error });
    }
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

        // [FIX] Also delete old Push Logs to ensure fresh simulation logs
        await PushLog.deleteMany({
            userId: { $in: [user._id, testUser._id] }
        });

        // Create PENDING connection with expiry for testing
        const now = getToday();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

        const newMode = await MessageMode.create({
            initiator: user._id,
            recipient: testUser._id,
            durationDays: 1, // Default, can be updated later
            status: 'PENDING',
            requestedAt: now,
            expiresAt: expiresAt,
        });

        // [Verified] Trigger Push: Simulate "Mode Requested" -> Notify Test User (Recipient)
        await sendModeRequestedPush(testUser._id.toString());

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



        // ... existing code ...

        await mode.save();

        // [Verified] Trigger Push: Simulate "Receiver Accepted" -> Notify Me (Initiator)
        // If I am initiator, send to me.
        // If I am recipient (rare in test flow), send to initiator (Test User?).
        // Usually Test User is Recipient. So I am Initiator.
        if (mode.initiator.toString() === user._id.toString()) {
            await sendModeAcceptedPush(user._id.toString());
        }

        res.json({ message: 'Force activated connection', mode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to force activate', details: error });
    }
});

router.post('/force-expire', protect, async (req: Request, res: Response) => {
    try {
        const user = req.user;
        // ... (existing code to find mode) ...
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

        // [Verified] Trigger Push: Simulate "System Expired" -> Notify Me
        // Send generic expiry push to current user
        await sendPushNotification(
            user._id.toString(),
            PUSH_MESSAGES.MODE_EXPIRED.title,
            PUSH_MESSAGES.MODE_EXPIRED.body,
            { type: 'MODE_EXPIRED' }
        );

        res.json({ message: 'Force expired connection', mode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to force expire', details: error });
    }
});

router.post('/force-reject', protect, async (req: Request, res: Response) => {
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
            ],
            status: 'PENDING'
        });

        if (!mode) {
            return res.status(404).json({ error: 'No PENDING connection found with test user' });
        }

        mode.status = 'REJECTED';
        await mode.save();

        // Trigger Push: Simulate "Receiver Rejected" -> Notify Initiator
        await sendModeRejectedPush(mode.initiator.toString());

        res.json({ message: 'Force rejected connection', mode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to force reject', details: error });
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
