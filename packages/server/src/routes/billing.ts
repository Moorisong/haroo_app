/**
 * Billing Routes
 * 결제 검증 및 취소 API
 */

import { Router } from 'express';
import { verifyPurchase, handlePurchaseCancel } from '../controllers/billingController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// 모든 결제 라우트는 인증 필요
router.use(protect);

// POST /billing/verify - 구매 토큰 검증 및 메시지 모드 활성화
router.post('/verify', verifyPurchase);

// POST /billing/cancel - 결제 취소 처리
router.post('/cancel', handlePurchaseCancel);

export default router;
