import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // MONGO_URI가 없으면 로컬 기본값 사용
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/haroo_db');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error: ${error.message}`);
        } else {
            console.error(`❌ Unknown Error: ${error}`);
        }
        process.exit(1);
    }
};

export default connectDB;
