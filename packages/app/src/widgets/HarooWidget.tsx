import React from 'react';
import {
    FlexWidget,
    TextWidget,
} from 'react-native-android-widget';

interface HarooWidgetProps {
    message: string | null;
    senderName: string | null;
    status: 'ACTIVE' | 'EXPIRED' | 'NONE';
    today: string;
}

export function HarooWidget({
    message,
    senderName,
    status,
    today,
}: HarooWidgetProps) {
    const renderContent = () => {
        if (status === 'ACTIVE' && message) {
            return (
                <FlexWidget style={{ flexDirection: 'column' }}>
                    <TextWidget
                        text={`from. ${senderName || '익명'}`}
                        style={{
                            fontSize: 12,
                            fontFamily: 'sans-serif',
                            color: '#888888',
                        }}
                    />
                    <TextWidget
                        text={message.length > 100 ? message.substring(0, 100) + '...' : message}
                        style={{
                            fontSize: 16,
                            fontFamily: 'sans-serif',
                            color: '#333333',
                            marginTop: 8,
                        }}
                    />
                </FlexWidget>
            );
        }

        if (status === 'EXPIRED') {
            return (
                <TextWidget
                    text="오늘의 메시지가 종료되었어요"
                    style={{
                        fontSize: 14,
                        fontFamily: 'sans-serif',
                        color: '#999999',
                    }}
                />
            );
        }

        return (
            <TextWidget
                text="오늘은 아직 메시지가 없어요"
                style={{
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    color: '#999999',
                }}
            />
        );
    };

    return (
        <FlexWidget
            style={{
                flex: 1,
                padding: 16,
                backgroundColor: '#FEFEFE',
                borderRadius: 16,
            }}
            clickAction="OPEN_APP"
        >
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <TextWidget
                    text="하루"
                    style={{
                        fontSize: 18,
                        fontFamily: 'sans-serif-medium',
                        color: '#FF6B6B',
                    }}
                />
                <TextWidget
                    text={today}
                    style={{
                        fontSize: 12,
                        fontFamily: 'sans-serif',
                        color: '#AAAAAA',
                        marginLeft: 8,
                    }}
                />
            </FlexWidget>

            <FlexWidget
                style={{
                    flex: 1,
                    marginTop: 12,
                    justifyContent: 'center',
                }}
            >
                {renderContent()}
            </FlexWidget>
        </FlexWidget>
    );
}
