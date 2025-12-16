import express from 'express';
import { sendMessage, getTodayMessage } from '../controllers/messageController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/received/today', protect, getTodayMessage);

export default router;
