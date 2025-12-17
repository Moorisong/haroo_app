import express from 'express';
import { getUserProfile, updateUserSettings, blockUser } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.patch('/settings', protect, updateUserSettings);
router.post('/block', protect, blockUser);

export default router;
