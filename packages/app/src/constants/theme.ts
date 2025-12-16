// 디자인 시스템 상수
export const COLORS = {
    // 배경 그라데이션 (연한 베이지)
    gradientStart: '#FBF8F4',     // 상단: 크림 화이트
    gradientEnd: '#F0E8DF',       // 하단: 연한 베이지
    background: '#F7F3EE',        // 단색 폴백
    backgroundSecondary: '#EFE9E2',

    // 텍스트
    textPrimary: '#4F4F4F',       // 진한 회색 (Soft Dark Gray)
    textSecondary: '#7A7A7A',
    textTertiary: '#A8A8A8',

    // 액센트
    accent: '#A08060',            // 웜 베이지 브라운
    accentLight: '#D4C4B0',       // 라이트 베이지
    accentMuted: '#E5D9CC',       // 매우 연한 베이지

    // 버튼 (베이지 톤)
    buttonPrimary: '#B8A58C',     // 메인 버튼: 베이지 브라운
    buttonDisabled: '#E5DED5',
    buttonText: '#FFFFFF',
    buttonTextDisabled: '#B5ADA3',

    // 기타
    border: '#E5DED5',
    divider: '#F0EBE5',
};

export const FONTS = {
    // Roboto 폰트 사용 (Expo 기본 지원) -> 나눔고딕으로 변경
    regular: 'NanumGothic_400Regular',
    medium: 'NanumGothic_700Bold', // Medium이 없으므로 Bold 사용하거나 Regular 사용
    bold: 'NanumGothic_700Bold',
    // 명조 계열
    serif: 'NanumMyeongjo_700Bold', // 나눔명조 Bold 사용
};

export const FONT_SIZES = {
    xs: 10,
    sm: 11,
    md: 13,
    lg: 15,
    xl: 18,
    xxl: 22,
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};
