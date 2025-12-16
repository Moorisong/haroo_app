import express from 'express';
import { kakaoLogin } from '../controllers/authController';

const router = express.Router();

// POST /auth/kakao
router.post('/kakao', kakaoLogin);

export default router;
