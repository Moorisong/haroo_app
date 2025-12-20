import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    hashId: string; // 고유 해시값 ID (사용자에게 보여지는 ID)
    kakaoId: string; // 카카오 고유 ID (인증용)
    nickname?: string; // 카카오 닉네임
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    settings: {
        displayMode: 'WIDGET' | 'NOTIFICATION';
    };
    blockedUsers: string[]; // 차단한 유저의 hashId 목록
    fcmToken?: string; // FCM 푸시 알림 토큰
    refreshToken?: string; // 리프레시 토큰
    refreshTokenExpiresAt?: Date; // 리프레시 토큰 만료 시간
    createdAt: Date;
    updatedAt: Date;

    // Trace (여기 한 줄) 관련
    lastTraceAt?: Date;
    traceDailyCount?: number; // 오늘 작성한 횟수
    tracePassExpiresAt?: Date; // 유료 패스 만료일
    reportInfluence?: number; // 신고 신뢰도 (기본 1.0)
}

const UserSchema: Schema = new Schema({
    hashId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    kakaoId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    nickname: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
        default: 'ACTIVE'
    },
    settings: {
        displayMode: {
            type: String,
            enum: ['WIDGET', 'NOTIFICATION'],
            default: 'NOTIFICATION'
        }
    },
    blockedUsers: [{ type: String }],
    fcmToken: {
        type: String,
        required: false,
    },
    refreshToken: {
        type: String,
        required: false, // 로그인 시에만 생성
    },
    refreshTokenExpiresAt: {
        type: Date,
        required: false, // 로그인 시에만 생성
    },

    // Trace Fields
    lastTraceAt: { type: Date },
    traceDailyCount: { type: Number, default: 0 },
    tracePassExpiresAt: { type: Date },
    reportInfluence: { type: Number, default: 1.0 },
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
