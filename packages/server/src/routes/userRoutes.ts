import express from 'express';
import { getUserProfile, updateUserSettings, blockUser, unblockUser, getBlockedUsers, registerFcmToken } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.patch('/settings', protect, updateUserSettings);
router.get('/blocked', protect, getBlockedUsers);
router.post('/block', protect, blockUser);
router.delete('/block/:targetHashId', protect, unblockUser);
router.post('/fcm-token', protect, registerFcmToken);

export default router;
