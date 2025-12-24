# 에러 메시지 및 UX 문구

## 공통 UX 원칙

| 원칙 | 설명 |
|------|------|
| 감정 평가 ❌ | 사용자의 감정을 판단하지 않음 |
| 책임 전가 ❌ | 사용자에게 책임을 묻지 않음 |
| 이유 과다 설명 ❌ | 필요 이상의 설명을 하지 않음 |
| 사실만 전달 ⭕ | 상황만 명확히 전달 |
| 선택은 사용자에게 ⭕ | 다음 행동은 사용자가 선택 |

### 핵심 문장
> 앱하루의 거절과 차단은 상처가 아니라, 경계다.

---

## 메시지 상수 파일

위치: `packages/app/src/constants/messages.ts`

---

## 1. ID 입력 단계 (/request)

### 존재하지 않는 ID
```typescript
ID_INPUT.NOT_FOUND = {
    TITLE: '해당 ID를 찾을 수 없어요.',
    SUB: 'ID를 다시 확인해 주세요.',
}
```

### 본인 ID 입력
```typescript
ID_INPUT.SELF = {
    TITLE: '내 ID에는\n메시지 모드를 신청할 수 없어요.',
}
```

### 상대 비활성 계정
```typescript
ID_INPUT.INACTIVE_USER = {
    TITLE: '현재 이 사용자에게\n메시지를 보낼 수 없어요.',
}
```

---

## 2. 신청 불가 상태

### 상대가 다른 사용자와 연결 중
```typescript
REQUEST_UNAVAILABLE.PEER_BUSY = {
    TITLE: '이 사용자는\n이미 다른 메시지 모드를 사용 중이에요.',
}
```

### 본인이 다른 사용자와 연결 중
```typescript
REQUEST_UNAVAILABLE.SELF_BUSY = {
    TITLE: '현재 다른 메시지 모드가 진행 중이에요.',
    SUB: '한 번에 하나의 메시지 모드만 사용할 수 있어요.',
}
```

### 상대가 나를 차단한 경우
```typescript
REQUEST_UNAVAILABLE.BLOCKED_BY_PEER = {
    TITLE: '이 사용자에게\n메시지를 보낼 수 없어요.',
    // 차단 사실 직접 언급 ❌
}
```

### 내가 상대를 차단한 상태
```typescript
REQUEST_UNAVAILABLE.BLOCKED_BY_SELF = {
    TITLE: '차단한 사용자에게는\n메시지를 보낼 수 없어요.',
}
```

---

## 3. 신청 결과 (/home)

### 신청 거절됨 (REJECTED)
```typescript
REQUEST_RESULT.REJECTED = {
    TITLE: '메시지 모드 신청이\n거절되었어요.',
    SUB: '상대의 선택을 존중해 주세요.',
    BUTTON: '확인',
}
```

### 신청 응답 없음 (만료)
```typescript
REQUEST_RESULT.EXPIRED = {
    TITLE: '메시지 모드 신청이\n응답 없이 종료되었어요.',
    SUB: '다시 신청할 수 있어요.',
    BUTTON: '다시 신청하기',
}
```

---

## 4. 메시지 전송 단계 (/send)

### 하루 전송 횟수 초과
```typescript
SEND.DAILY_LIMIT = {
    TITLE: '오늘은 이미\n메시지를 보냈어요.',
    SUB: '내일 다시 보낼 수 있어요.',
}
```

### 결제 실패
```typescript
SEND.PAYMENT_FAIL = {
    TITLE: '결제가 완료되지 않았어요.',
    SUB: '다시 시도해 주세요.',
}
```

### 결제 완료 후 전송 실패
```typescript
SEND.SEND_FAIL = {
    TITLE: '메시지를 보내지 못했어요.',
    SUB: '결제는 취소 처리돼요.',
}
```

---

## 5. 메시지 수신 후 상태 변화

### 메시지 수신 후 상대 차단
```typescript
RECEIVE.BLOCKED_USER = {
    TITLE: '차단한 사용자로부터 더 이상\n메시지를 받을 수 없어요.',
}
```

### 메시지 모드 기간 종료 후 접근
```typescript
RECEIVE.EXPIRED_ACCESS = {
    TITLE: '메시지 모드가\n종료되었어요.',
}
```

---

## 6. 수신자 신청 대기 상태

### 신청 수신 알림
```typescript
PENDING_RECEIVER = {
    TITLE: '누군가\n마음을 전하고 싶어 해요.',
    SUB: '허락하면 하루에 한 번\n메시지를 받을 수 있어요.',
    BUTTON: {
        ACCEPT: '수락하기',
        REJECT: '거절하기',
        BLOCK: '이 발신자 차단하기',
    },
    TOAST: {
        ACCEPT_COMPLETE: '메시지 수신을 허락했어요.',
    }
}
```

---

## 서버 에러 메시지 매핑

서버에서 반환하는 에러 메시지를 앱 UX 메시지로 변환:

| 서버 에러 | 앱 표시 |
|----------|---------|
| `User not found` | ID_INPUT.NOT_FOUND |
| `Cannot request mode to yourself` | ID_INPUT.SELF |
| `You have blocked this user` | REQUEST_UNAVAILABLE.BLOCKED_BY_SELF |
| `You are blocked by this user` | REQUEST_UNAVAILABLE.BLOCKED_BY_PEER |
| `You already have an active or pending mode` | REQUEST_UNAVAILABLE.SELF_BUSY |
| `The recipient is currently busy with another mode` | REQUEST_UNAVAILABLE.PEER_BUSY |
| `You have already sent a message today` | SEND.DAILY_LIMIT |
| `Message Mode is not active` | RECEIVE.EXPIRED_ACCESS |
| `Message Mode has expired` | RECEIVE.EXPIRED_ACCESS |
