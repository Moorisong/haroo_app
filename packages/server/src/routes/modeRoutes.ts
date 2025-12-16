import express from 'express';
import { requestMode, acceptMode, getCurrentMode } from '../controllers/modeController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/request', protect, requestMode);
router.post('/accept/:id', protect, acceptMode);
router.get('/current', protect, getCurrentMode);

export default router;
