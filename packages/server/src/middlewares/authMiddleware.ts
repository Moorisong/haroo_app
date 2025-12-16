import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
    id: string;
    hashId: string;
}

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            const err = new Error('Not authorized, token failed');
            next(err);
        }
    }

    if (!token) {
        res.status(401);
        const error = new Error('Not authorized, no token');
        next(error);
    }
};
