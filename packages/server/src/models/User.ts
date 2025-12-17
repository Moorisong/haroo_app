import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    hashId: string; // 고유 해시값 ID (사용자에게 보여지는 ID)
    kakaoId: string; // 카카오 고유 ID (인증용)
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    settings: {
        displayMode: 'WIDGET' | 'NOTIFICATION';
    };
    blockedUsers: string[]; // 차단한 유저의 hashId 목록
    refreshToken?: string; // 리프레시 토큰
    refreshTokenExpiresAt?: Date; // 리프레시 토큰 만료 시간
    createdAt: Date;
    updatedAt: Date;
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
    refreshToken: {
        type: String,
        required: false, // 로그인 시에만 생성
    },
    refreshTokenExpiresAt: {
        type: Date,
        required: false, // 로그인 시에만 생성
    },
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
