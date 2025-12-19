import express from 'express';
import { requestMode, acceptMode, rejectMode, blockMode, getCurrentMode } from '../controllers/modeController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/request', protect, requestMode);
router.post('/accept/:id', protect, acceptMode);
router.post('/reject/:id', protect, rejectMode);
router.post('/block/:id', protect, blockMode);
router.get('/current', protect, getCurrentMode);

export default router;
