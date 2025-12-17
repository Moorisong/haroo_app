// 연결 상태 타입 정의
export type ConnectionStatus =
    | 'NONE'           // 연결 없음
    | 'PENDING'        // 신청 대기
    | 'ACTIVE_PERIOD'  // 메시지 모드 활성
    | 'EXPIRED'        // 기간 종료
    | 'REJECTED'       // 거절됨
    | 'BLOCKED';       // 차단됨

export interface Connection {
    id: string;
    status: ConnectionStatus;
    requesterId: string; // 요청을 보낸 사용자의 ID
    partnerId?: string;
    startDate?: Date;
    endDate?: Date;
    canSendToday?: boolean;
}

export interface User {
    id: string;
    hashId: string;
    currentConnection?: Connection;
    settings?: {
        displayMode: 'WIDGET' | 'NOTIFICATION';
    };
    blockedUsers?: string[];
}