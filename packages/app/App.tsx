import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoadingProvider, useLoading, setGlobalLoadingHandlers } from './src/context/LoadingContext';
import { HomeScreen, LandingScreen, RequestScreen, SendScreen, ReceiveScreen, SettingsScreen, TestToolsScreen, TraceScreen, TraceWriteScreen } from './src/screens';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/notifications';
import Constants from 'expo-constants';

const Stack = createStackNavigator();
const IS_TEST = Constants.expoConfig?.extra?.APP_MODE === 'TEST';

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Request" component={RequestScreen} />
      <Stack.Screen name="Send" component={SendScreen} />
      <Stack.Screen name="Receive" component={ReceiveScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Trace" component={TraceScreen} />
      <Stack.Screen name="TraceWrite" component={TraceWriteScreen} />
      {IS_TEST && <Stack.Screen name="TestTools" component={TestToolsScreen} />}
    </Stack.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { accessToken, isLoading } = useAuth();

  // 로그인 후 푸시 알림 등록 + 위젯 조용히 새로고침
  useEffect(() => {
    if (accessToken) {
      registerForPushNotificationsAsync();
      const cleanup = setupNotificationListeners();

      // 위젯 조용히 새로고침 (앱이 열렸을 때)
      import('./src/widgets/widgetRefresh').then(({ refreshWidgetSilently }) => {
        refreshWidgetSilently();
      });

      // 앱이 백그라운드에서 포그라운드로 올 때마다 위젯 새로고침
      const { AppState } = require('react-native');
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
          import('./src/widgets/widgetRefresh').then(({ refreshWidgetSilently }) => {
            refreshWidgetSilently();
          });
        }
      };
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        cleanup();
        subscription.remove();
      };
    }
  }, [accessToken]);

  // Connect loading handlers for axios interceptors
  const { showLoading, hideLoading } = useLoading();
  useEffect(() => {
    setGlobalLoadingHandlers(showLoading, hideLoading);
  }, [showLoading, hideLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {accessToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
    NanumMyeongjo_800ExtraBold,
    NanumGothic_400Regular,
    NanumGothic_700Bold,
    NanumGothic_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <LoadingProvider>
        <RootNavigator />
      </LoadingProvider>
    </AuthProvider>
  );
}
