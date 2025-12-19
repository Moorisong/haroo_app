# Haroo Server

Express.js + TypeScript 기반의 백엔드 API 서버

## 🛠️ 기술 스택

- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT + Kakao OAuth
- **Push**: Firebase Cloud Messaging (FCM)
- **Scheduler**: node-cron

## 📁 디렉토리 구조

```
src/
├── config/           # 환경 설정 (env, firebase)
├── controllers/      # 비즈니스 로직
│   ├── authController.ts      # 카카오 로그인
│   ├── messageController.ts   # 메시지 CRUD
│   ├── modeController.ts      # 메시지 모드 관리
│   └── userController.ts      # 유저 정보/차단
├── middlewares/      # Express 미들웨어
│   ├── authMiddleware.ts      # JWT 인증 (protect)
│   └── errorMiddleware.ts     # 에러 핸들링
├── models/           # Mongoose 스키마
│   ├── User.ts
│   ├── MessageMode.ts
│   ├── Message.ts
│   └── PushLog.ts            # 테스트용 푸시 로그
├── routes/           # API 라우트
│   ├── authRoutes.ts
│   ├── messageRoutes.ts
│   ├── modeRoutes.ts
│   ├── userRoutes.ts
│   └── testTools.ts          # 개발자 테스트 도구
├── schedulers/       # 주기적 작업
│   └── messageCleanupScheduler.ts  # 메시지/모드 만료 처리
├── services/         # 외부 서비스
│   └── pushService.ts        # FCM 푸시 알림
├── utils/            # 유틸리티
│   └── testMode.ts           # 테스트 모드 시간 조작
├── app.ts            # Express 앱 설정
└── server.ts         # 서버 진입점
```

## 🔌 API 엔드포인트

### Auth (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | 카카오 로그인 |

### Messages (`/messages`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | 메시지 전송 |
| GET | `/today` | 오늘 받은 메시지 조회 |

### Modes (`/modes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request` | 메시지 모드 신청 |
| POST | `/accept/:id` | 모드 수락 |
| POST | `/reject/:id` | 모드 거절 |
| GET | `/my-connection` | 현재 연결 상태 |
| GET | `/received-requests` | 받은 신청 목록 |

### Users (`/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | 내 정보 조회 |
| PUT | `/fcm-token` | FCM 토큰 업데이트 |
| POST | `/block/:hashId` | 사용자 차단 |
| DELETE | `/block/:hashId` | 차단 해제 |

### Test Tools (`/test-tools`) - TEST 모드 전용
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | 테스트 상태 조회 |
| POST | `/advance-day` | 날짜 이동 |
| POST | `/advance-hours` | 시간 이동 |
| POST | `/reset` | 테스트 데이터 초기화 |
| POST | `/create-test-user` | 테스트 유저 생성 |
| POST | `/create-connection` | PENDING 연결 생성 |
| POST | `/force-activate` | 강제 활성화 |
| POST | `/force-expire` | 강제 만료 |
| POST | `/force-reject` | 강제 거절 |
| GET | `/message-logs` | 메시지 로그 |
| GET | `/push-logs` | 푸시 로그 |

## 📬 푸시 알림 이벤트

| Event | Target | Title |
|-------|--------|-------|
| `MODE_REQUESTED` | 수신자 | 누군가 마음을 전하고 싶어 해요 |
| `MODE_ACCEPTED` | 신청자 | 메시지 수신이 허락되었어요 |
| `MODE_REJECTED` | 신청자 | 메시지 모드 신청이 거절되었어요 |
| `MESSAGE_RECEIVED` | 수신자 | 오늘의 메시지가 도착했어요 |
| `MODE_EXPIRED` | 양쪽 | 메시지 모드가 종료되었어요 |
| `PENDING_REMINDER` | 수신자 | 아직 선택하지 않은 마음이 있어요 |
| `PENDING_EXPIRED` | 신청자 | 메시지 모드 신청이 만료되었어요 |

## ⏰ 스케줄러

**매일 04:00 KST 실행:**
1. 만료된 메시지 상태 변경 (ACTIVE → EXPIRED)
2. 7일 지난 만료 메시지 삭제
3. 기간 종료된 모드 만료 처리 + 푸시
4. 12시간 경과 PENDING에 리마인드 푸시
5. 24시간 경과 PENDING 자동 만료 + 푸시

## 🚀 실행 방법

```bash
# 개발 모드
npm run dev

# 빌드
npm run build

# 프로덕션
npm start
```

## 🔧 환경 변수

```env
# Database
MONGODB_URI=mongodb://localhost:27017/haroo

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Mode
APP_MODE=PROD  # PROD or TEST
```

## 📝 테스트 모드

`APP_MODE=TEST` 설정 시:
- `/test-tools` 엔드포인트 활성화
- 푸시 알림이 DB에 로그로 저장 (실제 발송 X)
- 시간 조작 가능 (Time Travel)
