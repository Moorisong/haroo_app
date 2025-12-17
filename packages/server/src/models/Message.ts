import mongoose, { Document, Schema } from 'mongoose';

// 메시지 상태
export type MessageStatus = 'ACTIVE' | 'EXPIRED';

export interface IMessage extends Document {
    modeId: mongoose.Types.ObjectId; // 어떤 모드(연결)에서 보내진 것인지
    sender: mongoose.Types.ObjectId;
    content: string;
    isRead: boolean;
    status: MessageStatus;
    sentAt: Date;
    expiresAt: Date; // 만료 시점 (sentAt + 24시간)
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    modeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageMode',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000, // 길이 제한
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED'],
        default: 'ACTIVE',
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true, // createdAt, updatedAt
});

// 조회 최적화: 특정 모드에서 특정 날짜의 메시지 조회 등
MessageSchema.index({ modeId: 1, sentAt: -1 });
MessageSchema.index({ sender: 1, sentAt: -1 });
// ACTIVE 메시지 조회 및 만료 배치 처리용
MessageSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);

