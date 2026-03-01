import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ShareIntentProvider } from 'expo-share-intent';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { colors } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store, persistor, useAppDispatch, useAppSelector } from '@/store';
import { checkSession } from '@/store/auth-slice';
import { hydrateAuthStorage } from '@/auth/cognito';
import { Toast } from '@/components/ui/Toast';

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

  const navTheme = useMemo(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    const t = colors[colorScheme ?? 'light'];
    return {
      ...base,
      colors: {
        ...base.colors,
        background: t.bg,
        card: t.surface,
        text: t.fg,
        border: t.border,
        primary: t.primary,
      },
    };
  }, [colorScheme]);

  return (
    <ThemeProvider value={navTheme}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="signin" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="confirm" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="tutorial" />
          <Stack.Screen name="evidence" />
          <Stack.Screen name="import-detail" />
          <Stack.Screen name="checklist" />
        </Stack>
        <Toast />
      </AuthGate>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ShareIntentProvider>
            <RootNavigator />
          </ShareIntentProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
