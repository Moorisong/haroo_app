import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageMode extends Document {
    initiator: mongoose.Types.ObjectId; // 신청한 유저 (결제한 유저)
    recipient: mongoose.Types.ObjectId; // 받는 유저
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
    startDate?: Date; // 수락하여 활성화된 시점
    endDate?: Date; // 활성화 시점 + durationDays
    durationDays: number; // 1 or 3
    createdAt: Date;
    updatedAt: Date;
}

const MessageModeSchema: Schema = new Schema({
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED', 'CANCELED'],
        default: 'PENDING',
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    durationDays: {
        type: Number,
        required: true,
        enum: [1, 3], // 1일권 or 3일권
    },
}, {
    timestamps: true,
});

// 한 유저가 동시에 여러 활성 모드를 가질 수 없는지 체크하기 위한 인덱스 등은 로직에서 처리
// 혹은 빠르게 조회하기 위한 인덱스
MessageModeSchema.index({ initiator: 1, status: 1 });
MessageModeSchema.index({ recipient: 1, status: 1 });

export default mongoose.model<IMessageMode>('MessageMode', MessageModeSchema);
