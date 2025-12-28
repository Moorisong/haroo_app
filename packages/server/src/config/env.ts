import dotenv from 'dotenv';

// Only load .env in development
// In production, PM2 ecosystem.config.js provides env vars
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}
