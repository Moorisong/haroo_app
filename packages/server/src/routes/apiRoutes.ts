import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import * as traceController from '../controllers/traceController';
import * as adminController from '../controllers/adminController';

const router = express.Router();

// --- Messages ---
router.get('/messages', protect, traceController.getMessages);
router.post('/messages', protect, traceController.createMessage);
router.get('/messages/statistics', protect, async (req, res) => {
    // User specific stats? Spec says just stats.
    res.json({ messageCount: 0 }); // Mock
});
router.get('/messages/payment-ratio', protect, async (req, res) => {
    res.json({ freeCount: 1, paidCount: 0 }); // Mock
});
router.get('/messages/:id', protect, traceController.getMessage);
router.post('/messages/:id/like', protect, traceController.likeMessage);
router.delete('/messages/:id/like', protect, traceController.unlikeMessage);
router.delete('/messages/:id', protect, traceController.deleteMessage);
router.post('/messages/:id/report', protect, traceController.reportMessage);
router.post('/messages/:id/remove', protect, adminController.removeMessageForce); // Admin only? Spec says "운영자 전용" just below it, but endpoint is public? Assuming admin middleware needed later.

// --- Location ---
router.get('/location/current', protect, traceController.getLocationStatus);

// --- Time ---
router.get('/time', (req, res) => {
    res.json({ timeState: 'WITHIN_LIFETIME' }); // Mock
});

// --- Payment (Mock) ---
router.post('/payment/mock', protect, traceController.mockPayment);

// --- Test Tools ---
router.post('/test-tools/seed-messages', protect, traceController.seedMessages);

// --- Sync ---
router.post('/sync', protect, (req, res) => {
    res.json({ status: 'SYNCED' });
});

// --- Admin ---
// TODO: Add admin protection middleware
router.get('/admin/users', protect, adminController.getAdminUsers);
router.get('/admin/messages', protect, adminController.getAdminMessages);
router.post('/admin/messages/:id/remove', protect, adminController.removeMessageForce);
router.get('/admin/statistics/messages', protect, adminController.getAdminStatsMessages);
router.get('/admin/statistics/payment', protect, adminController.getAdminStatsPayment);
router.get('/admin/statistics/users', protect, adminController.getAdminStatsUsers);

// --- Users (Trace specific) ---
import User from '../models/User';
import { getToday } from '../utils/testMode';

router.get('/users/me', protect, async (req, res) => {
    const user = (req as any).user;
    const now = getToday();

    // Debug logging
    console.log('[/api/users/me] Debug:', {
        now: now.toISOString(),
        tracePassExpiresAt: user.tracePassExpiresAt,
        lastTraceAt: user.lastTraceAt,
        traceDailyCount: user.traceDailyCount
    });

    // Calculate writePermission
    const hasValidPass = user.tracePassExpiresAt && new Date(user.tracePassExpiresAt) > now;
    const cooldownMs = 2 * 60 * 60 * 1000; // 2 Hours

    console.log('[/api/users/me] hasValidPass:', hasValidPass);

    let writePermission = 'FREE_AVAILABLE';
    let nextAvailableAt = null;

    if (hasValidPass) {
        // Paid user - check cooldown
        if (user.lastTraceAt) {
            const diff = now.getTime() - user.lastTraceAt.getTime();
            if (diff < cooldownMs) {
                writePermission = 'DENIED_COOLDOWN';
                nextAvailableAt = new Date(user.lastTraceAt.getTime() + cooldownMs);
            } else {
                writePermission = 'PAID_AVAILABLE';
            }
        } else {
            writePermission = 'PAID_AVAILABLE';
        }
    } else {
        // Free user - check daily limit
        const lastDate = user.lastTraceAt ? user.lastTraceAt.getDate() : -1;
        const todayDate = now.getDate();

        let dailyCount = user.traceDailyCount || 0;
        if (lastDate !== todayDate) {
            dailyCount = 0; // New day, reset
        }

        if (dailyCount >= 1) {
            writePermission = 'FREE_USED';
        } else {
            writePermission = 'FREE_AVAILABLE';
        }
    }

    res.json({
        userStatus: user.status,
        writePermission,
        nextAvailableAt,
        tracePassExpiresAt: user.tracePassExpiresAt,
        reportInfluence: user.reportInfluence || 1.0
    });
});

router.get('/users/count', async (req, res) => {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
});

router.get('/users/new', async (req, res) => {
    const newUsersToday = await User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    res.json({ newUsersToday });
});

router.get('/users/:id/status', protect, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
        userStatus: user.status,
        writePermission: 'FREE_AVAILABLE',
        reportInfluence: user.reportInfluence
    });
});

export default router;
