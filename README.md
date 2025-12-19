# Haroo App

**하루에 한 번, 마음을 전하는 메시지 앱**

Haroo는 매일 반복되는 작은 소통을 통해 관계를 이어가는 서비스입니다.

## 📱 주요 기능

### 메시지 모드
- **1일권 / 3일권** 선택 가능
- 상대방의 **수락이 있어야** 메시지 전송 가능
- 하루에 **단 1회** 메시지 전송 제한

### 알림 시스템
- 메시지 모드 신청/수락/거절 알림
- 새 메시지 도착 알림
- 모드 만료 알림
- 리마인드 알림 (12시간 후)

### 개인정보 보호
- 메시지는 **24시간 후 자동 만료**
- 만료 후 7일 뒤 **완전 삭제**
- 사용자 차단 기능

## 🏗️ 프로젝트 구조

```
haroo_app/
├── packages/
│   ├── app/          # React Native (Expo) 클라이언트
│   └── server/       # Node.js (Express) 백엔드
└── README.md
```

## 🚀 시작하기

### 요구사항
- Node.js 18+
- MongoDB
- Android Studio / Xcode (앱 빌드 시)

### 설치

```bash
# 의존성 설치
npm install

# 서버 실행
cd packages/server
npm run dev

# 앱 실행
cd packages/app
npm start
```

## 📦 패키지 문서

- [Server README](./packages/server/README.md) - 백엔드 API 문서
- [App README](./packages/app/README.md) - 프론트엔드 앱 문서

## 🔧 환경 변수

### Server (`packages/server/.env`)
```env
APP_MODE=PROD  # or TEST
MONGODB_URI=mongodb://...
JWT_SECRET=your-jwt-secret
```

### App (`packages/app/.env`)
```env
APP_MODE=PROD  # or TEST
EXPO_PUBLIC_API_URL=http://your-server-url
EXPO_PUBLIC_KAKAO_REST_API_KEY=your-kakao-key
```