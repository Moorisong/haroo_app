import mongoose, { Document, Schema } from 'mongoose';

export interface ITraceReport extends Document {
    traceId: mongoose.Types.ObjectId;
    reporterId: mongoose.Types.ObjectId;
    reason: string;
    createdAt: Date;
}

const TraceReportSchema: Schema = new Schema({
    traceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trace',
        required: true,
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

TraceReportSchema.index({ traceId: 1, reporterId: 1 }, { unique: true });

export default mongoose.model<ITraceReport>('TraceReport', TraceReportSchema);
