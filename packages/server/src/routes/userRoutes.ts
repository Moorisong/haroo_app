import express from 'express';
import { getUserProfile, updateUserSettings, blockUser, registerFcmToken } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.patch('/settings', protect, updateUserSettings);
router.post('/block', protect, blockUser);
router.post('/fcm-token', protect, registerFcmToken);

export default router;
