import mongoose, { Document, Schema } from 'mongoose';

export interface IPushLog extends Document {
    userId: string; // Recipient User ID (string or ObjectId)
    title: string;
    body: string;
    data?: any;
    triggeredAt: Date;
}

const PushLogSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: false,
    },
    data: {
        type: Object,
        required: false,
    },
    triggeredAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IPushLog>('PushLog', PushLogSchema);
