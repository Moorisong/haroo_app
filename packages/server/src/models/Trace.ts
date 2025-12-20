import mongoose, { Document, Schema } from 'mongoose';

export type TraceToneTag = 'happy' | 'fear' | 'anger' | 'monologue' | 'review' | 'comfort' | 'other';
export type TraceStatus = 'ACTIVE' | 'HIDDEN' | 'REMOVED';

export interface ITrace extends Document {
    content: string;
    toneTag: TraceToneTag;
    
    // 위치 정보
    location: {
        lat: number;
        lng: number;
    };
    grid: {
        x: number;
        y: number;
    };
    
    status: TraceStatus;
    
    // 메타데이터
    authorId?: mongoose.Types.ObjectId; // 익명이어도 내부 추적용
    authorIp?: string;
    
    // 카운터
    likeCount: number;
    reportScore: number; // 신고 누적 점수
    
    // 시간
    createdAt: Date;
    expiresAt: Date;
}

const TraceSchema: Schema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
    },
    toneTag: {
        type: String,
        required: true,
        enum: ['happy', 'fear', 'anger', 'monologue', 'review', 'comfort', 'other'],
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    grid: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'HIDDEN', 'REMOVED'],
        default: 'ACTIVE',
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    authorIp: { type: String },
    likeCount: { type: Number, default: 0 },
    reportScore: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true,
});

TraceSchema.index({ 'grid.x': 1, 'grid.y': 1, status: 1 });
TraceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TraceSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model<ITrace>('Trace', TraceSchema);
