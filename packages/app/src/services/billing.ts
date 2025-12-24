/**
 * Google Play Billing Service
 * 메시지 모드 결제를 위한 인앱 결제 서비스
 * react-native-iap v14+ 호환
 */

import {
    initConnection,
    endConnection,
    getProducts,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
    purchaseUpdatedListener,
    purchaseErrorListener,
    type Purchase,
} from 'react-native-iap';
import { Platform } from 'react-native';
import api from './api';

// 상품 ID 정의
export const PRODUCT_IDS = {
    MESSAGE_MODE_1DAY: 'message_mode_1day',
    MESSAGE_MODE_3DAY: 'message_mode_3day',
} as const;

// 상품 ID 배열
const productSkus = [PRODUCT_IDS.MESSAGE_MODE_1DAY, PRODUCT_IDS.MESSAGE_MODE_3DAY];

// 타입 정의
export interface Product {
    productId: string;
    title: string;
    description: string;
    price: string;
    localizedPrice: string;
    currency: string;
}

export interface PurchaseResult {
    success: boolean;
    purchaseToken?: string;
    productId?: string;
    error?: string;
}

// IAP 연결 상태
let isIapConnected = false;

// 리스너 구독 해제 함수
let removeUpdateListener: (() => void) | null = null;
let removeErrorListener: (() => void) | null = null;

/**
 * IAP 연결 초기화
 */
export const initBilling = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
        console.log('[Billing] Web platform - IAP not supported');
        return false;
    }

    try {
        const result = await initConnection();
        isIapConnected = true;
        console.log('[Billing] IAP connection initialized:', result);
        return true;
    } catch (error) {
        console.error('[Billing] Failed to init IAP connection:', error);
        isIapConnected = false;
        return false;
    }
};

/**
 * IAP 연결 종료
 */
export const endBilling = async (): Promise<void> => {
    if (removeUpdateListener) {
        removeUpdateListener();
        removeUpdateListener = null;
    }
    if (removeErrorListener) {
        removeErrorListener();
        removeErrorListener = null;
    }

    if (isIapConnected) {
        try {
            await endConnection();
            isIapConnected = false;
            console.log('[Billing] IAP connection ended');
        } catch (error) {
            console.error('[Billing] Failed to end IAP connection:', error);
        }
    }
};

/**
 * 구매 리스너 설정
 */
export const setupPurchaseListeners = (
    onPurchaseUpdate: (purchase: Purchase) => void,
    onPurchaseError: (error: any) => void
): void => {
    if (Platform.OS === 'web') return;

    // 기존 리스너 제거
    if (removeUpdateListener) {
        removeUpdateListener();
    }
    if (removeErrorListener) {
        removeErrorListener();
    }

    // 새 리스너 등록
    const updateSubscription = purchaseUpdatedListener(onPurchaseUpdate);
    const errorSubscription = purchaseErrorListener(onPurchaseError);

    removeUpdateListener = () => updateSubscription.remove();
    removeErrorListener = () => errorSubscription.remove();

    console.log('[Billing] Purchase listeners set up');
};

/**
 * 상품 목록 조회
 */
export const fetchProducts = async (): Promise<Product[]> => {
    if (Platform.OS === 'web') {
        // 웹에서는 하드코딩된 상품 정보 반환
        return [
            {
                productId: PRODUCT_IDS.MESSAGE_MODE_1DAY,
                title: '메시지 모드 1일권',
                description: '하루 동안 메시지 전송 가능',
                price: '500',
                localizedPrice: '₩500',
                currency: 'KRW',
            },
            {
                productId: PRODUCT_IDS.MESSAGE_MODE_3DAY,
                title: '메시지 모드 3일권',
                description: '3일 동안 메시지 전송 가능',
                price: '1000',
                localizedPrice: '₩1,000',
                currency: 'KRW',
            },
        ];
    }

    if (!isIapConnected) {
        await initBilling();
    }

    try {
        const products = await getProducts({ skus: productSkus });
        console.log('[Billing] Products fetched:', products);

        return products.map((product: any) => ({
            productId: product.productId || product.sku || '',
            title: product.title || product.name || '',
            description: product.description || '',
            price: product.price || '',
            localizedPrice: product.localizedPrice || product.oneTimePurchaseOfferDetails?.formattedPrice || '',
            currency: product.currency || 'KRW',
        }));
    } catch (error) {
        console.error('[Billing] Failed to get products:', error);
        throw error;
    }
};

/**
 * 구매 요청
 */
export const buyProduct = async (productId: string): Promise<PurchaseResult> => {
    if (Platform.OS === 'web') {
        // 웹에서는 테스트용 성공 응답
        console.log('[Billing] Web platform - simulating purchase');
        return {
            success: true,
            purchaseToken: 'web_test_token_' + Date.now(),
            productId,
        };
    }

    if (!isIapConnected) {
        await initBilling();
    }

    try {
        console.log('[Billing] Requesting purchase for:', productId);

        // react-native-iap v14+ API - request 파라미터가 변경됨
        await requestPurchase({ skus: [productId] });

        // 구매 완료 대기 (purchaseUpdatedListener에서 처리됨)
        return {
            success: true,
            productId,
        };
    } catch (error: any) {
        console.error('[Billing] Purchase request failed:', error);

        // 사용자 취소
        if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancelled')) {
            return {
                success: false,
                error: '결제가 취소되었습니다.',
            };
        }

        return {
            success: false,
            error: error.message || '결제 중 오류가 발생했습니다.',
        };
    }
};

/**
 * 구매 완료 처리 (consume)
 */
export const completePurchase = async (purchase: Purchase): Promise<void> => {
    try {
        await finishTransaction({ purchase, isConsumable: true });
        console.log('[Billing] Transaction finished (consumed)');
    } catch (error) {
        console.error('[Billing] Failed to finish transaction:', error);
        throw error;
    }
};

/**
 * 서버에 구매 검증 요청
 */
export const verifyPurchaseWithServer = async (
    productId: string,
    purchaseToken: string,
    recipientHashId: string
): Promise<{ success: boolean; modeId?: string; error?: string }> => {
    try {
        const durationDays = productId === PRODUCT_IDS.MESSAGE_MODE_1DAY ? 1 : 3;

        const response = await api.post('/billing/verify', {
            productId,
            purchaseToken,
            recipientHashId,
            durationDays,
        });

        console.log('[Billing] Server verification result:', response.data);

        return {
            success: true,
            modeId: response.data.modeId,
        };
    } catch (error: any) {
        console.error('[Billing] Server verification failed:', error);

        const errorMessage =
            error.response?.data?.message || '결제 검증에 실패했습니다.';

        return {
            success: false,
            error: errorMessage,
        };
    }
};

/**
 * 미완료 구매 확인 및 처리
 */
export const checkPendingPurchases = async (): Promise<Purchase[]> => {
    if (Platform.OS === 'web') {
        return [];
    }

    if (!isIapConnected) {
        await initBilling();
    }

    try {
        const purchases = await getAvailablePurchases();
        console.log('[Billing] Pending purchases:', purchases);
        return purchases;
    } catch (error) {
        console.error('[Billing] Failed to check pending purchases:', error);
        return [];
    }
};

// 타입 re-export
export type { Purchase };
