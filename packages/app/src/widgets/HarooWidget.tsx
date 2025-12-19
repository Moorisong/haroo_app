import React from 'react';
import {
    FlexWidget,
    TextWidget,
    ColorProp,
} from 'react-native-android-widget';
import { WidgetConfig, THEME_COLORS, FONT_SIZES, DEFAULT_WIDGET_CONFIG, BADGE_COLORS, FONT_COLORS } from './WidgetConfigScreen';

// 위젯 크기 타입
export type WidgetSize = 'small' | 'medium';

// hex 색상에 투명도 적용하는 함수 (배경에만 사용)
function applyOpacity(hexColor: string, opacity: number): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 랜덤 이모지 선택 (귀엽고 행복한 이모지 10개)
const HAPPY_EMOJIS = ['💛', '🌸', '✨', '🌈', '💕', '🍀', '🌻', '💌', '🎀', '🐣'];
function getRandomEmoji(): string {
    return HAPPY_EMOJIS[Math.floor(Math.random() * HAPPY_EMOJIS.length)];
}

// 디자인 색상
const DESIGN_COLORS = {
    fromText: '#6B7280', // 중성적인 회색
    refreshIcon: '#B0B0B0', // 은은한 회색
};

interface HarooWidgetProps {
    message: string | null;
    senderName: string | null;
    status: 'ACTIVE' | 'EXPIRED' | 'NONE';
    today: string;
    size: WidgetSize;
    config?: WidgetConfig;
}

// 메시지 텍스트 처리 (줄바꿈 제거 후 말줄임)
function truncateMessage(text: string, maxLength: number): string {
    // 줄바꿈을 공백으로 변환
    const singleLine = text.replace(/\n/g, ' ').trim();
    if (singleLine.length <= maxLength) {
        return singleLine;
    }
    return singleLine.substring(0, maxLength) + '...';
}

// 소형 위젯 (2x1) - 컴팩트한 디자인
function SmallWidget({ message, senderName, status, config = DEFAULT_WIDGET_CONFIG }: Omit<HarooWidgetProps, 'size' | 'today'>) {
    const theme = THEME_COLORS[config.theme];
    const fontSize = FONT_SIZES[config.fontSize];
    const badgeColor = BADGE_COLORS[config.badgeColor];
    const fontColor = FONT_COLORS[config.fontColor];
    const emoji = getRandomEmoji();

    const getDisplayText = () => {
        if (status === 'ACTIVE' && message) {
            // 가로 확장 시 더 많은 텍스트 표시 (40자)
            return truncateMessage(message, 40);
        }
        if (status === 'EXPIRED') return config.showEmoji ? `${emoji} 종료됨` : '종료됨';
        return config.showEmoji ? `${emoji} 대기중` : '대기중';
    };

    return (
        <FlexWidget
            style={{
                flex: 1,
                flexDirection: 'row',
                backgroundColor: applyOpacity(theme.background, config.opacity) as ColorProp,
                borderRadius: 14,
            }}
            clickAction="OPEN_APP"
        >
            {/* 왼쪽 컨텐츠 영역 */}
            <FlexWidget style={{ flex: 1, padding: 10 }}>
                {/* 헤더 */}
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FlexWidget
                        style={{
                            backgroundColor: badgeColor as ColorProp,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 8,
                        }}
                    >
                        <TextWidget
                            text="하루"
                            style={{
                                fontSize: fontSize.title,
                                fontFamily: 'sans-serif-medium',
                                color: '#FFFFFF' as ColorProp,
                            }}
                        />
                    </FlexWidget>
                    {status === 'ACTIVE' && senderName && (
                        <TextWidget
                            text={senderName}
                            style={{
                                fontSize: fontSize.hint,
                                fontFamily: 'sans-serif',
                                color: theme.textSecondary as ColorProp,
                                marginLeft: 6,
                            }}
                        />
                    )}
                </FlexWidget>
                <TextWidget
                    text={getDisplayText()}
                    style={{
                        fontSize: fontSize.message,
                        fontFamily: 'sans-serif',
                        color: (status === 'ACTIVE' ? fontColor : theme.textSecondary) as ColorProp,
                        marginTop: 4,
                    }}
                />
            </FlexWidget>

            {/* 새로고침 - 완전 우측 끝 */}
            <FlexWidget
                style={{ justifyContent: 'flex-start', paddingTop: 4, paddingHorizontal: 10 }}
                clickAction="OPEN_APP"
                clickActionData={{ action: 'refresh' }}
            >
                <TextWidget
                    text="↻"
                    style={{
                        fontSize: 16,
                        color: DESIGN_COLORS.refreshIcon as ColorProp,
                    }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}

// 중형 위젯 - 풍성한 디자인
function MediumWidget({ message, senderName, status, today, config = DEFAULT_WIDGET_CONFIG }: Omit<HarooWidgetProps, 'size'>) {
    const theme = THEME_COLORS[config.theme];
    const fontSize = FONT_SIZES[config.fontSize];
    const badgeColor = BADGE_COLORS[config.badgeColor];
    const fontColor = FONT_COLORS[config.fontColor];
    const contentEmoji = getRandomEmoji();

    const getDisplayContent = () => {
        if (status === 'ACTIVE' && message) {
            return {
                emoji: contentEmoji,
                title: '오늘의 마음',
                text: message, // 전문 표시 (줄바꿈 유지)
            };
        }
        if (status === 'EXPIRED') {
            return {
                emoji: '🌙',
                title: '하루가 지났어요',
                text: '내일 또 만나요',
            };
        }
        return {
            emoji: '✨',
            title: '기다리는 중',
            text: '오늘의 메시지가 도착하면 알려드릴게요',
        };
    };
    const content = getDisplayContent();

    return (
        <FlexWidget
            style={{
                flex: 1,
                flexDirection: 'row',
                backgroundColor: applyOpacity(theme.background, config.opacity) as ColorProp,
                borderRadius: 20,
            }}
            clickAction="OPEN_APP"
        >
            {/* 왼쪽 메인 컨텐츠 영역 - flex:1로 확장 */}
            <FlexWidget style={{ flex: 1, padding: 14 }}>
                {/* 상단 헤더 */}
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <FlexWidget
                        style={{
                            backgroundColor: badgeColor as ColorProp,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 10,
                        }}
                    >
                        <TextWidget
                            text="하루"
                            style={{
                                fontSize: fontSize.title,
                                fontFamily: 'sans-serif-medium',
                                color: '#FFFFFF' as ColorProp,
                            }}
                        />
                    </FlexWidget>
                    <TextWidget
                        text={today}
                        style={{
                            fontSize: fontSize.hint,
                            fontFamily: 'sans-serif',
                            color: theme.textSecondary as ColorProp,
                            marginLeft: 8,
                        }}
                    />
                </FlexWidget>

                {/* 메인 컨텐츠 영역 */}
                <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
                    {config.showEmoji && (
                        <FlexWidget
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: theme.accentLight as ColorProp,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10,
                            }}
                        >
                            <TextWidget
                                text={content.emoji}
                                style={{
                                    fontSize: 20,
                                }}
                            />
                        </FlexWidget>
                    )}

                    <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
                        {status !== 'ACTIVE' && (
                            <TextWidget
                                text={content.title}
                                style={{
                                    fontSize: fontSize.hint,
                                    fontFamily: 'sans-serif-medium',
                                    color: theme.textSecondary as ColorProp,
                                    marginBottom: 2,
                                }}
                            />
                        )}
                        <TextWidget
                            text={content.text}
                            style={{
                                fontSize: fontSize.message,
                                fontFamily: 'sans-serif',
                                color: (status === 'ACTIVE' ? fontColor : theme.textSecondary) as ColorProp,
                            }}
                        />
                        {status === 'ACTIVE' && senderName && (
                            <TextWidget
                                text={config.showEmoji ? `from. ${senderName} ♡` : `from. ${senderName}`}
                                style={{
                                    fontSize: fontSize.hint,
                                    fontFamily: 'sans-serif-medium',
                                    color: theme.textSecondary as ColorProp,
                                    marginTop: 10,
                                }}
                            />
                        )}
                    </FlexWidget>
                </FlexWidget>
            </FlexWidget>

            {/* 새로고침 - 완전 우측 끝 (소형과 동일 구조) */}
            <FlexWidget
                style={{ justifyContent: 'flex-start', paddingTop: 6, paddingHorizontal: 12 }}
                clickAction="OPEN_APP"
                clickActionData={{ action: 'refresh' }}
            >
                <TextWidget
                    text="↻"
                    style={{
                        fontSize: 22,
                        fontFamily: 'sans-serif',
                        color: DESIGN_COLORS.refreshIcon as ColorProp,
                    }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}

export function HarooWidget(props: HarooWidgetProps) {
    const { size, config, ...rest } = props;

    switch (size) {
        case 'small':
            return <SmallWidget {...rest} config={config} />;
        case 'medium':
        default:
            return <MediumWidget {...rest} config={config} />;
    }
}
