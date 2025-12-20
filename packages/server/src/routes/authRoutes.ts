import express from 'express';
import { kakaoLogin, kakaoCallback, kakaoAdminLogin } from '../controllers/authController';

const router = express.Router();

// POST /auth/kakao (기존 방식 - Redirect 안정화 후 제거 예정)
router.post('/kakao', kakaoLogin);
// GET /auth/kakao (Server Redirect 방식)
router.get('/kakao', kakaoCallback);
// POST /auth/kakao/admin (Web Admin Dashboard 로그인)
router.post('/kakao/admin', kakaoAdminLogin);

export default router;
