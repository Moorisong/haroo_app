import express from 'express';
import { kakaoLogin, refreshToken } from '../controllers/authController';

const router = express.Router();

// POST /auth/kakao
router.post('/kakao', kakaoLogin);
// POST /auth/refresh
router.post('/refresh', refreshToken);

export default router;
