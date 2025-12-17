import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { generateHashId } from '../utils/hashGenerator';

// 카카오 사용자 정보 조회 (토큰 검증)
const getKakaoUserInfo = async (accessToken: string) => {
    try {
        const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch Kakao user info');
    }
};

export const kakaoLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.body; // 클라이언트에서 받은 카카오 액세스 토큰

        if (!token) {
            res.status(400);
            throw new Error('Kakao access token is required');
        }

        // 1. 카카오 서버에서 사용자 정보 가져오기
        let kakaoId = '';
        if (token === 'TEST_DEV_TOKEN_12345') {
            // Dev Bypass
            kakaoId = 'DEV_USER_12345';
        } else {
            const kakaoUser = await getKakaoUserInfo(token);
            kakaoId = kakaoUser.id.toString();
        }

        // 2. DB에서 사용자 찾기 또는 생성
        let user = await User.findOne({ kakaoId });

        if (!user) {
            // 새 사용자 생성 (Hash ID 발급)
            // 중복 방지 로직 필요하나 간단히 처리 (실제로는 재시도 로직 필요)
            let hashId = generateHashId();
            let isDuplicate = await User.findOne({ hashId });
            while (isDuplicate) {
                hashId = generateHashId();
                isDuplicate = await User.findOne({ hashId });
            }

            user = await User.create({
                kakaoId,
                hashId,
                status: 'ACTIVE',
            });
        }

        if (user.status === 'BANNED') {
            res.status(403);
            throw new Error('This account has been banned');
        }

        // 3. JWT 토큰 발급
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

        // Access Token (15분)
        const accessToken = jwt.sign(
            { id: user._id, hashId: user.hashId, tokenType: 'access' },
            jwtSecret,
            { expiresIn: '15m' }
        );

        // Refresh Token (30일)
        const refreshToken = jwt.sign(
            { id: user._id, hashId: user.hashId, tokenType: 'refresh' },
            jwtSecret,
            { expiresIn: '30d' }
        );

        // Refresh Token 만료 시간 계산
        const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일 후

        // DB에 Refresh Token 저장
        user.refreshToken = refreshToken;
        user.refreshTokenExpiresAt = refreshTokenExpiresAt;
        await user.save();

        res.status(200).json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                hashId: user.hashId,
                status: user.status,
                settings: user.settings,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh Access Token
// @route   POST /auth/refresh
// @access  Public (with Refresh Token)
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken: clientRefreshToken } = req.body;

        if (!clientRefreshToken) {
            res.status(400);
            throw new Error('Refresh Token is required');
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        let decoded: any;
        try {
            decoded = jwt.verify(clientRefreshToken, jwtSecret);
        } catch (error) {
            res.status(401);
            throw new Error('Invalid or expired Refresh Token');
        }

        if (decoded.tokenType !== 'refresh') {
            res.status(401);
            throw new Error('Provided token is not a Refresh Token');
        }

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== clientRefreshToken || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
            res.status(401);
            throw new Error('Invalid or expired Refresh Token');
        }

        // Generate new Access Token (15분)
        const newAccessToken = jwt.sign(
            { id: user._id, hashId: user.hashId, tokenType: 'access' },
            jwtSecret,
            { expiresIn: '15m' }
        );

        // Optionally, generate a new Refresh Token and update in DB (as per spec)
        // For now, just issue a new Access Token.
        // If spec requires refresh token rotation, uncomment and implement below:
        /*
        const newRefreshToken = jwt.sign(
            { id: user._id, hashId: user.hashId, tokenType: 'refresh' },
            jwtSecret,
            { expiresIn: '30d' }
        );
        const newRefreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        user.refreshToken = newRefreshToken;
        user.refreshTokenExpiresAt = newRefreshTokenExpiresAt;
        await user.save();
        res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        */

        res.status(200).json({ accessToken: newAccessToken });

    } catch (error) {
        next(error);
    }
};
