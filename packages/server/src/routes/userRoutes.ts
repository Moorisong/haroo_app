import express from 'express';
import { getUserProfile, updateUserSettings } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.patch('/settings', protect, updateUserSettings);

export default router;
