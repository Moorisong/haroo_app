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

    // 사용자 상태 조회 (작성 권한 등)
    getUserStatus: async (): Promise<UserStatusResponse> => {
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
    }
};

export default traceService;
