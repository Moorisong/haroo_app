import api from './api';

export type TraceToneTag = 'happy' | 'fear' | 'anger' | 'monologue' | 'review' | 'comfort' | 'other';

export interface TraceMessage {
    _id: string;
    content: string;
    toneTag: TraceToneTag;
    location: {
        lat: number;
        lng: number;
    };
    grid: {
        x: number;
        y: number;
    };
    status: 'ACTIVE' | 'HIDDEN' | 'REMOVED';
    likeCount: number;
    createdAt: string;
    expiresAt: string;
    isLiked?: boolean; // Client side logic might need this or track separately
    isMine?: boolean;
}

export interface TraceListResponse {
    messages: TraceMessage[];
    gridStatus: 'HAS_MESSAGES' | 'EMPTY';
    page: number;
    count: number;
}

export interface UserStatusResponse {
    userStatus: string;
    writePermission: 'FREE_AVAILABLE' | 'FREE_USED' | 'PAID_AVAILABLE' | 'DENIED_COOLDOWN' | 'DENIED_LOCATION' | 'DENIED_USER';
    nextAvailableAt?: string;  // Cooldown end time (ISO string)
    cooldownRemainingMs?: number;  // Remaining cooldown in milliseconds (accounts for test time offset)
    tracePassExpiresAt?: string;
    reportInfluence: number;
}

const traceService = {
    // 메시지 목록 조회
    getMessages: async (lat: number, lng: number, page: number = 1): Promise<TraceListResponse> => {
        const response = await api.get('/api/messages', {
            params: { lat, lng, page }
        });
        return response.data;
    },

    // 메시지 작성
    createMessage: async (content: string, toneTag: string, lat: number, lng: number) => {
        const response = await api.post('/api/messages',
            { content, toneTag, lat, lng }
        );
        return response.data;
    },

    // 좋아요
    likeMessage: async (id: string) => {
        const response = await api.post(`/api/messages/${id}/like`);
        return response.data; // { likeStatus: 'LIKED', likeCount: number }
    },

    // 좋아요 취소
    unlikeMessage: async (id: string) => {
        const response = await api.delete(`/api/messages/${id}/like`);
        return response.data; // { likeStatus: 'NOT_LIKED', likeCount: number }
    },

    // 신고
    reportMessage: async (id: string, reason: string) => {
        const response = await api.post(`/api/messages/${id}/report`, { reason });
        return response.data;
    },

    // 삭제
    deleteMessage: async (id: string) => {
        const response = await api.delete(`/api/messages/${id}`);
        return response.data;
    },

    // 사용자 상태 조회 (작성 권한 등)
    getUserStatus: async (): Promise<UserStatusResponse> => {
        // Test Tool Hook - allows test tools to force specific states
        if ((global as any).TRACE_WRITE_PERMISSION) {
            console.log('[TestMode] Using forced permission:', (global as any).TRACE_WRITE_PERMISSION);
            return {
                userStatus: 'ACTIVE',
                writePermission: (global as any).TRACE_WRITE_PERMISSION,
                reportInfluence: 1.0
            };
        }

        const response = await api.get('/api/users/me');
        return response.data;
    },

    // 위치 상태 조회
    getLocationStatus: async (lat: number, lng: number) => {
        const response = await api.get('/api/location/current', {
            params: { lat, lng }
        });
        return response.data;
    },

    // 시간/동기화
    getTimeState: async () => {
        const response = await api.get('/api/time');
        return response.data;
    },

    // 개발용 결제 Mock
    mockPayment: async (type: 'single' | 'threeDay') => {
        // [Fix] Clear test override when payment is made
        // This ensures real server state takes effect after payment
        delete (global as any).TRACE_WRITE_PERMISSION;

        const response = await api.post('/api/payment/mock', { type });
        return response.data;
    },

    // 테스트 메시지 생성 (타인 글 5개)
    seedTestMessages: async (lat: number, lng: number) => {
        const response = await api.post('/api/test-tools/seed-messages', { lat, lng });
        return response.data;
    }
};

export default traceService;
