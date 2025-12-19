# Haroo App (Client)

React Native (Expo) 기반의 모바일 클라이언트 앱

## 🛠️ 기술 스택

- **Framework**: React Native 0.81 + Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation 7
- **State**: React Context API
- **HTTP**: Axios
- **Push**: expo-notifications + FCM
- **Widgets**: react-native-android-widget

## 📁 디렉토리 구조

```
src/
├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── ActionButton.tsx
│   ├── CustomModal.tsx
│   └── ...
├── constants/        # 상수 및 테마
│   ├── colors.ts
│   └── fonts.ts
├── context/          # React Context
│   └── AuthContext.tsx      # 인증 상태 관리
├── screens/          # 화면 컴포넌트
│   ├── LandingScreen.tsx    # 랜딩/로그인
│   ├── HomeScreen.tsx       # 메인 홈
│   ├── RequestScreen.tsx    # 모드 신청
│   ├── ReceiveScreen.tsx    # 받은 신청 처리
│   ├── SendScreen.tsx       # 메시지 작성
│   ├── SettingsScreen.tsx   # 설정
│   └── TestToolsScreen.tsx  # 개발자 도구
├── services/         # API 및 외부 서비스
│   ├── api.ts               # Axios 인스턴스 + API 함수
│   └── storage.ts           # AsyncStorage 래퍼
├── types/            # TypeScript 타입 정의
│   └── index.ts
└── widgets/          # Android 위젯
    ├── SmallWidget.tsx
    ├── MediumWidget.tsx
    └── ...
```

## 📱 화면 구성

### LandingScreen
- 앱 소개 및 카카오 로그인

### HomeScreen
- 현재 연결 상태 표시
- D-Day 카운트다운
- 받은 메시지 표시
- 메시지 보내기/받은 신청 확인 버튼

### RequestScreen
- 상대방 Hash ID 입력
- 1일권/3일권 선택
- 메시지 모드 신청

### ReceiveScreen
- 받은 신청 목록
- 수락/거절 처리

### SendScreen
- 메시지 작성 (100자 제한)
- 하루 1회 제한 안내

### SettingsScreen
- 내 Hash ID 복사
- 차단 사용자 관리
- 로그아웃

### TestToolsScreen (TEST 모드 전용)
- Time Travel (시간 조작)
- 테스트 연결 생성/관리
- 푸시 로그 확인

## 🔧 환경 변수

`packages/app/.env`:
```env
APP_MODE=PROD  # or TEST

# API
EXPO_PUBLIC_API_URL=https://your-server.com

# Kakao
EXPO_PUBLIC_KAKAO_REST_API_KEY=your-rest-api-key
EXPO_PUBLIC_SERVER_REDIRECT_URI=https://your-server.com/auth/kakao/callback
```

## 🚀 실행 방법

```bash
# 개발 서버 시작
npm start

# Android 빌드 및 실행
npm run android

# iOS 빌드 및 실행 (macOS만)
npm run ios
```

## 📲 빌드

### Android
```bash
# 디버그 APK
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
npx expo run:android
```

### iOS
```bash
npx expo run:ios
```

## 🔔 푸시 알림 처리

앱에서 푸시 알림 수신 시:
1. **foreground**: 알림 표시 + 상태 새로고침
2. **background/quit**: 알림 탭 시 해당 화면으로 이동

## 🧪 테스트 모드

`APP_MODE=TEST` 설정 시:
- Settings에 "Developer Tools" 버튼 표시
- TestToolsScreen 접근 가능
- 모든 테스트 도구 사용 가능

### 테스트 도구 기능
| 기능 | 설명 |
|------|------|
| +12 Hours | 12시간 이동 (리마인드 테스트) |
| +1 Day | 1일 이동 |
| +3 Days | 3일 이동 |
| Create Connection | PENDING 연결 생성 |
| Force Activate | 강제 활성화 |
| Force Reject | 강제 거절 |
| Force Expire | 강제 만료 |
| View Push Logs | 푸시 로그 확인 |
| Reset | 테스트 데이터 초기화 |

## 📦 주요 의존성

| 패키지 | 용도 |
|--------|------|
| `expo` | 개발 환경 |
| `react-navigation` | 화면 네비게이션 |
| `expo-notifications` | 푸시 알림 |
| `expo-auth-session` | OAuth 인증 |
| `react-native-android-widget` | Android 위젯 |
| `@expo-google-fonts/*` | 커스텀 폰트 |
