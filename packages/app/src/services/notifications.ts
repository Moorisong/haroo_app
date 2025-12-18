import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// 알림 핸들러 설정 (앱이 포그라운드일 때 알림 표시 방식)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// FCM 토큰 획득 및 서버 등록
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token: string | null = null;

    // 실제 디바이스에서만 동작
    if (!Device.isDevice) {
        console.log('푸시 알림은 실제 디바이스에서만 작동합니다.');
        return null;
    }

    // 권한 확인 및 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
        return null;
    }

    // FCM 토큰 획득
    try {
        const pushToken = await Notifications.getExpoPushTokenAsync({
            projectId: undefined, // EAS 사용 시 필요
        });
        token = pushToken.data;
        console.log('FCM Token:', token);

        // 서버에 토큰 등록
        await api.post('/users/fcm-token', { fcmToken: token });
        console.log('✅ FCM 토큰이 서버에 등록되었습니다.');
    } catch (error) {
        console.error('FCM 토큰 획득 실패:', error);
    }

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('haroo_default', {
            name: '하루 알림',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B6B',
        });
    }

    return token;
};

// 푸시 알림 수신 리스너 설정
export const setupNotificationListeners = (
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) => {
    // 알림 수신 시 (앱이 포그라운드일 때)
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log('알림 수신:', notification);
        onNotificationReceived?.(notification);
    });

    // 알림 탭 시 (사용자가 알림을 탭했을 때)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('알림 탭:', response);
        onNotificationResponse?.(response);
    });

    // 클린업 함수 반환
    return () => {
        notificationListener.remove();
        responseListener.remove();
    };
};
