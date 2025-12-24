import './config/env'; // Must be first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

import { notFound, errorHandler } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import modeRoutes from './routes/modeRoutes';
import messageRoutes from './routes/messageRoutes';
import apiRoutes from './routes/apiRoutes';
import billingRoutes from './routes/billing';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/modes', modeRoutes);
app.use('/messages', messageRoutes);
app.use('/api', apiRoutes);
app.use('/billing', billingRoutes);

import testToolsRoutes from './routes/testTools';
import { isTestMode } from './utils/testMode';

if (isTestMode) {
    app.use('/test-tools', testToolsRoutes);
}

// Basic Route
app.get('/', (req, res) => {
    res.send('Haroo Server is running!');
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
