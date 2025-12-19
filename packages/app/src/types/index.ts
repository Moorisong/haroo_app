// 연결 상태 타입 정의
export type ConnectionStatus =
    | 'NONE'           // 연결 없음
    | 'PENDING'        // 신청 대기
    | 'ACTIVE_PERIOD'  // 메시지 모드 활성
    | 'EXPIRED'        // 기간 종료
    | 'REJECTED'       // 거절됨
    | 'BLOCKED';       // 차단됨

export interface Connection {
    _id: string; // Mongoose ID
    id?: string; // Client side alias if needed, but safer to use _id from backend
    status: ConnectionStatus;
    initiator: User | string; // Populated User object or ID string
    recipient: User | string; // Populated User object or ID string
    durationDays?: 1 | 3; // 선택된 기간
    startDate?: Date;
    endDate?: Date;
    canSendToday?: boolean;
    remainingDays?: number;
}

export interface User {
    _id: string; // Mongoose ID
    id: string;
    hashId: string;
    currentConnection?: Connection;
    settings?: {
        displayMode: 'WIDGET' | 'NOTIFICATION';
    };
    blockedUsers?: string[];
}