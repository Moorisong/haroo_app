import express from 'express';
import { sendMessage, getTodayMessage, markMessageAsRead } from '../controllers/messageController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/received/today', protect, getTodayMessage);
router.post('/:id/read', protect, markMessageAsRead);

export default router;
