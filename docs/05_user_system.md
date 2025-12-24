# 사용자 시스템

## 사용자 모델

위치: `packages/server/src/models/User.ts`

```typescript
interface IUser {
    hashId: string;              // 고유 해시값 ID (사용자에게 보여지는 ID)
    kakaoId: string;             // 카카오 고유 ID (인증용)
    nickname?: string;           // 카카오 닉네임
    status: UserStatus;          // 'ACTIVE' | 'INACTIVE' | 'BANNED'
    settings: {
        displayMode: DisplayMode;
    };
    blockedUsers: string[];      // 차단한 유저의 hashId 목록
    fcmToken?: string;           // FCM 푸시 알림 토큰
    refreshToken?: string;       // 리프레시 토큰
    refreshTokenExpiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Trace (여기 한 줄) 관련
    lastTraceAt?: Date;
    traceDailyCount?: number;
    tracePassExpiresAt?: Date;
    reportInfluence?: number;
}

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
type DisplayMode = 'WIDGET' | 'NOTIFICATION';
```

---

## 사용자 ID 체계

### hashId
- **목적**: 외부에 노출되는 사용자 식별자
- **형식**: 랜덤 해시 문자열 (예: `haru_x9f3a2`)
- **용도**: 메시지 모드 신청 시 상대방 검색에 사용

### kakaoId
- **목적**: 내부 인증용
- **형식**: 카카오 로그인에서 제공하는 고유 ID
- **노출**: 사용자에게 표시되지 않음

---

## 사용자 상태

| 상태 | 설명 | 영향 |
|------|------|------|
| ACTIVE | 정상 활동 상태 | 모든 기능 사용 가능 |
| INACTIVE | 비활성 상태 | 메시지 수신 불가 |
| BANNED | 이용 정지 상태 | 서비스 이용 불가 |

---

## 메시지 표시 방식 설정

### displayMode 옵션

| 옵션 | 설명 | 의미 |
|------|------|------|
| WIDGET | 홈 화면 위젯 | 일상에 조용히 두는 메시지 |
| NOTIFICATION | 알림바 고정 | 하루 동안 지우지 않겠다는 선택 |

### 설정 원칙
- ❌ 메시지 받을 때마다 선택하게 하지 않음
- ✅ **사전 설정 → 자동 적용** 구조
- 변경은 앱 안에서만 가능

---

## 차단 시스템

### 차단 데이터 구조
- `blockedUsers`: 차단한 유저의 hashId 배열

### 차단 효과
1. 차단한 사용자에게 메시지 모드 신청 불가
2. 차단한 사용자로부터 메시지 모드 신청 수신 불가
3. 차단한 사용자로부터 메시지 수신 불가

### 차단 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/users/block` | 사용자 차단 |
| DELETE | `/users/block/:targetHashId` | 차단 해제 |
| GET | `/users/blocked` | 차단 목록 조회 |

### 차단 검증 (신청 시)

```typescript
// requestMode 내 차단 검증
// 1. 내가 상대방을 차단했는지
if (initiator.blockedUsers?.includes(targetHashId)) {
    throw new Error('You have blocked this user');
}

// 2. 상대가 나를 차단했는지
if (recipient.blockedUsers?.includes(initiator.hashId)) {
    throw new Error('You are blocked by this user');
}
```

---

## 사용자 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/users/profile` | 내 프로필 조회 |
| PATCH | `/users/settings` | 설정 업데이트 |
| POST | `/users/block` | 사용자 차단 |
| DELETE | `/users/block/:targetHashId` | 차단 해제 |
| GET | `/users/blocked` | 차단 목록 조회 |
| POST | `/users/fcm-token` | FCM 토큰 등록 |

---

## FCM 토큰 관리

### 토큰 등록
- 로그인 후 앱에서 FCM 토큰을 서버에 등록
- 토큰 갱신 시 재등록 필요

### 푸시 알림 발송 조건
1. 메시지 모드 신청 받았을 때 (수신자에게)
2. 메시지 모드 수락되었을 때 (신청자에게)
3. 메시지 모드 거절되었을 때 (신청자에게)
4. 메시지 수신 시 (수신자에게)

---

## App 타입 정의

위치: `packages/app/src/types/index.ts`

```typescript
interface User {
    _id: string;
    id: string;
    hashId: string;
    currentConnection?: Connection;
    settings?: {
        displayMode: 'WIDGET' | 'NOTIFICATION';
    };
    blockedUsers?: string[];
}
```

---

## App API 함수

위치: `packages/app/src/services/api.ts`

```typescript
// 프로필 조회
export const getUserProfile = async (): Promise<User>

// 설정 업데이트
interface UserSettings {
    displayMode: 'WIDGET' | 'NOTIFICATION';
}
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<any>

// 차단
export const blockUser = async (targetHashId: string): Promise<any>
export const unblockUser = async (targetHashId: string): Promise<any>

// 차단 목록 조회
interface BlockedUser {
    hashId: string;
    nickname?: string;
}
export const getBlockedUsers = async (): Promise<{ blockedUsers: BlockedUser[] }>
```
