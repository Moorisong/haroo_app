# API 엔드포인트 정리

## 기본 정보

- **Base URL**: 환경 변수 `EXPO_PUBLIC_API_URL`
- **인증**: Bearer Token (JWT)
- **Content-Type**: application/json

---

## 인증 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/auth/kakao` | 카카오 로그인 | Public |
| POST | `/auth/refresh` | 토큰 갱신 | Public |

---

## 메시지 모드 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/modes/current` | 현재 모드 상태 조회 | Private |
| POST | `/modes/request` | 메시지 모드 신청 | Private |
| POST | `/modes/accept/:id` | 신청 수락 | Private |
| POST | `/modes/reject/:id` | 신청 거절 | Private |
| POST | `/modes/block/:id` | 신청 차단 | Private |

### POST /modes/request

**Request Body:**
```json
{
    "targetHashId": "string",
    "durationDays": 1 | 3
}
```

**Response:** MessageMode 객체

**에러:**
- 400: Invalid durationDays
- 400: Cannot request mode to yourself
- 400: You already have an active or pending mode
- 400: The recipient is currently busy with another mode
- 403: You have blocked this user
- 403: You are blocked by this user
- 404: User not found

### GET /modes/current

**Response:**
```json
{
    "_id": "string",
    "initiator": { "hashId": "string", "settings": {...} },
    "recipient": { "hashId": "string", "settings": {...} },
    "status": "PENDING" | "ACTIVE_PERIOD",
    "durationDays": 1 | 3,
    "startDate": "ISO date",
    "endDate": "ISO date",
    "canSendToday": boolean,
    "remainingDays": number
}
```

---

## 메시지 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/messages` | 메시지 전송 | Private |
| GET | `/messages/received/today` | 오늘 받은 메시지 조회 | Private |
| POST | `/messages/:id/read` | 메시지 읽음 표시 | Private |

### POST /messages

**Request Body:**
```json
{
    "content": "string (max 1000 chars)",
    "modeId": "string"
}
```

**에러:**
- 400: Content and modeId are required
- 400: Message Mode is not active
- 400: Message Mode has expired
- 400: You have already sent a message today
- 403: Not authorized to send message to this mode
- 404: Message Mode not found

### GET /messages/received/today

**Response:**
```json
{
    "message": {
        "_id": "string",
        "modeId": "string",
        "sender": { "_id": "string", "hashId": "string", "nickname": "string" },
        "content": "string",
        "isRead": boolean,
        "sentAt": "ISO date",
        "createdAt": "ISO date"
    } | null
}
```

---

## 사용자 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/users/profile` | 내 프로필 조회 | Private |
| PATCH | `/users/settings` | 설정 업데이트 | Private |
| POST | `/users/block` | 사용자 차단 | Private |
| DELETE | `/users/block/:targetHashId` | 차단 해제 | Private |
| GET | `/users/blocked` | 차단 목록 조회 | Private |
| POST | `/users/fcm-token` | FCM 토큰 등록 | Private |

### PATCH /users/settings

**Request Body:**
```json
{
    "displayMode": "WIDGET" | "NOTIFICATION"
}
```

### POST /users/block

**Request Body:**
```json
{
    "targetHashId": "string"
}
```

### GET /users/blocked

**Response:**
```json
{
    "blockedUsers": [
        { "hashId": "string", "nickname": "string" }
    ]
}
```

---

## 테스트 도구 API

> 개발/테스트 환경에서만 사용

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/test-tools/advance-day` | 시간 N일 진행 |
| POST | `/test-tools/advance-hours` | 시간 N시간 진행 |
| POST | `/test-tools/reset-main` | 메인 테스트 상태 초기화 |
| POST | `/test-tools/reset-trace` | Trace 테스트 상태 초기화 |
| GET | `/test-tools/status` | 테스트 상태 조회 |
| POST | `/test-tools/create-test-user` | 테스트 유저 생성 |
| POST | `/test-tools/create-connection` | 테스트 연결 생성 |
| POST | `/test-tools/force-activate` | 메시지 모드 강제 활성화 |
| POST | `/test-tools/force-expire` | 메시지 모드 강제 만료 |
| POST | `/test-tools/force-reject` | 메시지 모드 강제 거절 |
| GET | `/test-tools/message-logs` | 메시지 로그 조회 |
| GET | `/test-tools/push-logs` | 푸시 로그 조회 |

---

## 응답 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (검증 실패) |
| 401 | 인증 필요 / 토큰 만료 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |

---

## 파일 위치

- **라우트**: `packages/server/src/routes/`
- **컨트롤러**: `packages/server/src/controllers/`
- **앱 API 클라이언트**: `packages/app/src/services/api.ts`
