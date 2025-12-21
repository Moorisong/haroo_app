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

// @desc    Kakao OAuth Callback (Server Redirect 방식)
// @route   GET /auth/kakao
// @access  Public
export const kakaoCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.query;

        if (!code || typeof code !== 'string') {
            res.status(400);
            throw new Error('Authorization code is required');
        }

        const kakaoClientId = process.env.KAKAO_CLIENT_ID;
        const kakaoRedirectUri = process.env.KAKAO_REDIRECT_URI;
        const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET; // 선택적

        console.log('[kakaoCallback] code:', code);
        console.log('[kakaoCallback] kakaoClientId:', kakaoClientId);
        console.log('[kakaoCallback] kakaoRedirectUri:', kakaoRedirectUri);
        console.log('[kakaoCallback] kakaoClientSecret:', kakaoClientSecret ? 'SET' : 'NOT SET');

        if (!kakaoClientId || !kakaoRedirectUri) {
            res.status(500);
            throw new Error('Kakao OAuth configuration is missing');
        }

        // 1. Authorization code로 카카오 토큰 획득
        let kakaoAccessToken: string;
        try {
            console.log('[kakaoCallback] Requesting token from Kakao...');

            // 카카오 API는 form-urlencoded body로 파라미터를 받음
            const tokenParams = new URLSearchParams();
            tokenParams.append('grant_type', 'authorization_code');
            tokenParams.append('client_id', kakaoClientId);
            tokenParams.append('redirect_uri', kakaoRedirectUri);
            tokenParams.append('code', code);

            // Client Secret이 설정된 경우 추가
            if (kakaoClientSecret) {
                tokenParams.append('client_secret', kakaoClientSecret);
            }

            const tokenResponse = await axios.post(
                'https://kauth.kakao.com/oauth/token',
                tokenParams.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            );
            console.log('[kakaoCallback] Token response received');
            kakaoAccessToken = tokenResponse.data.access_token;
        } catch (error: any) {
            console.error('[kakaoCallback] Kakao token exchange failed!');
            console.error('[kakaoCallback] Error response:', JSON.stringify(error.response?.data, null, 2));
            console.error('[kakaoCallback] Error status:', error.response?.status);
            res.status(401);
            throw new Error('Failed to exchange authorization code');
        }

        // 2. 카카오 사용자 정보 조회
        const kakaoUser = await getKakaoUserInfo(kakaoAccessToken);
        const kakaoId = kakaoUser.id.toString();
        const kakaoNickname = kakaoUser.properties?.nickname || null;

        // 3. DB에서 사용자 찾기 또는 생성
        let user = await User.findOne({ kakaoId });

        if (!user) {
            // 새 사용자 생성 (Hash ID 발급)
            let hashId = generateHashId();
            let isDuplicate = await User.findOne({ hashId });
            while (isDuplicate) {
                hashId = generateHashId();
                isDuplicate = await User.findOne({ hashId });
            }

            user = await User.create({
                kakaoId,
                hashId,
                nickname: kakaoNickname,
                status: 'ACTIVE',
            });
        } else {
            // 기존 사용자: 닉네임 업데이트 (카카오에서 변경되었을 수 있음)
            if (kakaoNickname && user.nickname !== kakaoNickname) {
                user.nickname = kakaoNickname;
                await user.save();
            }
        }

        if (user.status === 'BANNED') {
            // 차단된 계정은 에러 페이지로 리다이렉트 (추후 구현)
            res.status(403);
            throw new Error('This account has been banned');
        }

        // 4. JWT 발급 (30일 유효, 단일 토큰)
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign(
            {
                id: user._id,
                hashId: user.hashId,
                provider: 'kakao',
                tokenType: 'access'
            },
            jwtSecret,
            { expiresIn: '30d' }
        );

        // 5. 딥링크로 앱 복귀 (Zero-UI: redirect only, no HTML)
        // Expo Go 개발 모드에서는 exp:// 스킴 사용, 프로덕션에서는 haroo:// 사용
        const expoDevUrl = process.env.EXPO_DEV_URL; // 예: exp://192.168.219.101:8081
        let deepLink: string;

        if (expoDevUrl) {
            // Expo Go 개발 모드
            deepLink = `${expoDevUrl}/--/login?token=${encodeURIComponent(token)}`;
        } else {
            // 프로덕션 앱
            deepLink = `haroo://login?token=${encodeURIComponent(token)}`;
        }

        console.log('[kakaoCallback] Redirecting to:', deepLink);

        // Zero-UI: 오직 딥링크 redirect만 수행
        res.redirect(deepLink);

    } catch (error) {
        next(error);
    }
};

// @desc    Kakao Admin Login (Web Admin Dashboard용)
// @route   POST /auth/kakao/admin
// @access  Public
export const kakaoAdminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            res.status(400).json({ message: 'Authorization code is required' });
            return;
        }

        const kakaoClientId = process.env.KAKAO_CLIENT_ID;
        // Admin용 redirect URI (web 환경)
        const kakaoAdminRedirectUri = process.env.KAKAO_ADMIN_REDIRECT_URI || 'http://localhost:3000/admin/callback';
        const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET;
        // 허용된 Admin 카카오 ID 목록 (콤마로 구분)
        const adminKakaoIds = (process.env.ADMIN_KAKAO_IDS || '').split(',').map(id => id.trim()).filter(Boolean);

        if (!kakaoClientId) {
            res.status(500).json({ message: 'Kakao OAuth configuration is missing' });
            return;
        }

        // 1. Authorization code로 카카오 토큰 획득
        let kakaoAccessToken: string;
        try {
            const tokenParams = new URLSearchParams();
            tokenParams.append('grant_type', 'authorization_code');
            tokenParams.append('client_id', kakaoClientId);
            tokenParams.append('redirect_uri', kakaoAdminRedirectUri);
            tokenParams.append('code', code);

            if (kakaoClientSecret) {
                tokenParams.append('client_secret', kakaoClientSecret);
            }

            const tokenResponse = await axios.post(
                'https://kauth.kakao.com/oauth/token',
                tokenParams.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            );
            kakaoAccessToken = tokenResponse.data.access_token;
        } catch (error: any) {
            console.error('[kakaoAdminLogin] Kakao token exchange failed:', error.message);
            res.status(401).json({ message: 'Failed to exchange authorization code' });
            return;
        }

        // 2. 카카오 사용자 정보 조회
        const kakaoUser = await getKakaoUserInfo(kakaoAccessToken);
        const kakaoId = kakaoUser.id.toString();
        const kakaoNickname = kakaoUser.properties?.nickname || '관리자';

        // 3. Admin 권한 체크
        if (adminKakaoIds.length > 0 && !adminKakaoIds.includes(kakaoId)) {
            console.warn('[kakaoAdminLogin] Unauthorized admin access attempt:', kakaoId);
            res.status(403).json({ message: '관리자 권한이 없습니다. 허용된 계정으로 로그인해주세요.' });
            return;
        }

        // 4. JWT 발급 (Admin용 - 24시간 유효)
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        const adminToken = jwt.sign(
            {
                kakaoId,
                nickname: kakaoNickname,
                role: 'admin',
                tokenType: 'admin_access'
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token: adminToken,
            user: {
                kakaoId,
                name: kakaoNickname,
                email: `admin_${kakaoId}@haroo.site`,
                role: 'admin'
            }
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
