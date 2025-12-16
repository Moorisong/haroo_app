import { HomeScreen, LandingScreen, RequestScreen } from './src/screens';
import {
  useFonts,
  NanumMyeongjo_400Regular,
  NanumMyeongjo_700Bold,
  NanumMyeongjo_800ExtraBold
} from '@expo-google-fonts/nanum-myeongjo';
import {
  NanumGothic_400Regular,
  NanumGothic_700Bold,
  NanumGothic_800ExtraBold
} from '@expo-google-fonts/nanum-gothic';
import { ActivityIndicator, View } from 'react-native';
import { useState, useEffect } from 'react';

type Screen = 'HOME' | 'REQUEST';

export default function App() {
  const [fontsLoaded] = useFonts({
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
    NanumMyeongjo_800ExtraBold,
    NanumGothic_400Regular,
    NanumGothic_700Bold,
    NanumGothic_800ExtraBold,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');

  useEffect(() => {
    // 3초 후 로딩 종료
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isLoading) return <LandingScreen />;

  return (
    <>
      {currentScreen === 'HOME' && (
        <HomeScreen onRequest={() => setCurrentScreen('REQUEST')} />
      )}
      {currentScreen === 'REQUEST' && (
        <RequestScreen onBack={() => setCurrentScreen('HOME')} />
      )}
    </>
  );
}
