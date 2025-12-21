import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

// 대한민국 경계 (대략적인 Bounding Box)
// 극동: 독도 (131.5222) -> 여유있게 132
// 극서: 마안도 (124.11) -> 124
// 극남: 마라도 (33.0643) -> 33
// 극북: 온성군 (43.0097) -> 43.1
const KOREA_BOUNDS = {
    minLat: 33.0,
    maxLat: 43.1,
    minLng: 124.0,
    maxLng: 132.0,
};

export interface LocationState {
    lat: number;
    lng: number;
    isInKorea: boolean;
    errorMsg?: string;
}

class LocationService {
    // 권한 요청 및 현재 위치 가져오기
    async getCurrentLocation(): Promise<LocationState> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                return {
                    lat: 0,
                    lng: 0,
                    isInKorea: false,
                    errorMsg: 'PERMISSION_DENIED',
                };
            }

            // 1. First try last known position (Fastest)
            const lastKnown = await Location.getLastKnownPositionAsync();

            // If last known location is recent (within 1 min), utilize it immediately.
            if (lastKnown && (Date.now() - lastKnown.timestamp < 1 * 60 * 1000)) {
                // console.log('Using cached location (recent)');
                const { latitude, longitude } = lastKnown.coords;
                return {
                    lat: latitude,
                    lng: longitude,
                    isInKorea: this.checkIfInKorea(latitude, longitude),
                };
            }

            // 2. Get current position with timeout
            let location: Location.LocationObject | null = null;
            try {
                location = await Promise.race([
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                    new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT')), 8000)
                    )
                ]) as Location.LocationObject;
            } catch (e) {
                console.log('Location fetch timed out, falling back to last known');
            }

            // If timeout or null, fallback to lastKnown if available (even if stale)
            const finalLocation = location || lastKnown;

            if (!finalLocation) {
                throw new Error('Location unavailable');
            }

            const { latitude, longitude } = finalLocation.coords;
            const isInKorea = this.checkIfInKorea(latitude, longitude);

            return {
                lat: latitude,
                lng: longitude,
                isInKorea,
            };

        } catch (error) {
            console.error('Location Error:', error);
            return {
                lat: 0,
                lng: 0,
                isInKorea: false,
                errorMsg: 'SERVICE_ERROR',
            };
        }
    }

    // 대한민국 내 위치인지 확인
    private checkIfInKorea(lat: number, lng: number): boolean {
        return (
            lat >= KOREA_BOUNDS.minLat &&
            lat <= KOREA_BOUNDS.maxLat &&
            lng >= KOREA_BOUNDS.minLng &&
            lng <= KOREA_BOUNDS.maxLng
        );
    }

    // 위치 권한 거부 시 설정으로 이동 안내
    showPermissionAlert() {
        Alert.alert(
            '위치 권한 필요',
            '이 기능을 사용하려면 위치 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [
                { text: '취소', style: 'cancel' },
                { text: '설정으로 이동', onPress: () => Linking.openSettings() },
            ]
        );
    }

    // 국가 제한 안내 (API로 대체 가능하지만 클라이언트 우선 처리)
    showCountryRestrictionAlert() {
        Alert.alert(
            '서비스 지역 안내',
            '현재 서비스는 대한민국에서만 이용할 수 있어요.',
            [{ text: '확인' }]
        );
    }
}

export default new LocationService();
