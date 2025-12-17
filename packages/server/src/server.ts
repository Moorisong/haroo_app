import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import { initMessageCleanupScheduler } from './schedulers/messageCleanupScheduler';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    // 스케줄러 초기화 (매일 새벽 4시 KST)
    initMessageCleanupScheduler();

    app.listen(PORT, () => {
        console.log(`
    ################################################
    🛡️  Server listening on port: ${PORT} 🛡️
    ################################################
        `);
    });
};

startServer();
