/**
 * 앱 전반에서 사용되는 메시지 상수 정의
 * 에러, 차단, 거절 상태 등 UX 문구 정리
 */

export const MESSAGES = {
    // 1. ID 입력 단계 (/request)
    ID_INPUT: {
        NOT_FOUND: {
            TITLE: '해당 ID를 찾을 수 없어요.',
            SUB: 'ID를 다시 확인해 주세요.',
        },
        SELF: {
            TITLE: '내 ID에는\n메시지 모드를 신청할 수 없어요.',
        },
        INACTIVE_USER: {
            TITLE: '현재 이 사용자에게\n메시지를 보낼 수 없어요.',
        },
    },

    // 2. 신청 불가 상태
    REQUEST_UNAVAILABLE: {
        PEER_BUSY: {
            TITLE: '이 사용자는\n이미 다른 메시지 모드를 사용 중이에요.',
        },
        SELF_BUSY: {
            TITLE: '현재 다른 메시지 모드가 진행 중이에요.',
            SUB: '한 번에 하나의 메시지 모드만 사용할 수 있어요.',
        },
        BLOCKED_BY_PEER: {
            TITLE: '이 사용자에게\n메시지를 보낼 수 없어요.', // 차단 사실 직접 언급 X
        },
        BLOCKED_BY_SELF: {
            TITLE: '차단한 사용자에게는\n메시지를 보낼 수 없어요.',
        },
    },

    // 3. 신청 결과 (/home)
    REQUEST_RESULT: {
        REJECTED: {
            TITLE: '메시지 모드 신청이\n거절되었어요.',
            SUB: '상대의 선택을 존중해 주세요.',
            BUTTON: '확인',
        },
        EXPIRED: {
            TITLE: '메시지 모드 신청이\n응답 없이 종료되었어요.',
            SUB: '다시 신청할 수 있어요.',
            BUTTON: '다시 신청하기',
        },
    },

    // 4. 메시지 전송 단계 (/send)
    SEND: {
        DAILY_LIMIT: {
            TITLE: '오늘은 이미\n메시지를 보냈어요.',
            SUB: '내일 다시 보낼 수 있어요.',
        },
        PAYMENT_FAIL: {
            TITLE: '결제가 완료되지 않았어요.',
            SUB: '다시 시도해 주세요.',
        },
        SEND_FAIL: {
            TITLE: '메시지를 보내지 못했어요.',
            SUB: '결제는 취소 처리돼요.',
        },
    },

    // 5. 메시지 수신 후 상태 변화
    RECEIVE: {
        BLOCKED_USER: {
            TITLE: '차단한 사용자로부터 더 이상\n메시지를 받을 수 없어요.',
        },
        EXPIRED_ACCESS: {
            TITLE: '메시지 모드가\n종료되었어요.',
        },
    },

    // 6. 수신자 신청 대기 상태 (홈 화면)
    PENDING_RECEIVER: {
        TITLE: '누군가\n마음을 전하고 싶어 해요.',
        SUB: '허락하면 하루에 한 번\n메시지를 받을 수 있어요.',
        BUTTON: {
            ACCEPT: '수락하기',
            REJECT: '거절하기',
            BLOCK: '이 발신자 차단하기',
        }
    }
} as const;
