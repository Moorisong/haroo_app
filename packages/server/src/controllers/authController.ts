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
        const serverToken = jwt.sign({ id: user._id, hashId: user.hashId }, jwtSecret, {
            expiresIn: '30d',
        });

        res.status(200).json({
            token: serverToken,
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
