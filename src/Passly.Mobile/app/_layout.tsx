import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ShareIntentProvider } from 'expo-share-intent';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { store, persistor, useAppDispatch, useAppSelector } from '@/store';
import { checkSession } from '@/store/auth-slice';
import { hydrateAuthStorage } from '@/auth/cognito';

const AUTH_SCREENS = ['signin', 'signup', 'confirm', 'forgot-password'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const segments = useSegments();
  const hasCheckedSession = useRef(false);

  // Hydrate Cognito secure storage and check session once
  useEffect(() => {
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    (async () => {
      await hydrateAuthStorage();
      dispatch(checkSession());
    })();
  }, [dispatch]);

  // Redirect based on auth state after loading completes
  useEffect(() => {
    if (isLoading) return;

    const currentSegment = segments[0] ?? '';
    const isOnAuthScreen = AUTH_SCREENS.includes(currentSegment);

    if (!isAuthenticated && !isOnAuthScreen) {
      router.replace('/signin');
    } else if (isAuthenticated && isOnAuthScreen) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootNavigator() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="signin" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="confirm" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="index" />
          <Stack.Screen name="evidence" />
          <Stack.Screen name="import-detail" />
          <Stack.Screen name="checklist" />
          <Stack.Screen name="submit" />
          <Stack.Screen
            name="settings"
            options={{ presentation: 'modal' }}
          />
        </Stack>
      </AuthGate>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ShareIntentProvider>
          <RootNavigator />
        </ShareIntentProvider>
      </PersistGate>
    </Provider>
  );
}
