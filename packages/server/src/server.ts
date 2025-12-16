import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`
    ################################################
    🛡️  Server listening on port: ${PORT} 🛡️
    ################################################
        `);
    });
};

startServer();
