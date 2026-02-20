import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { signIn, clearError } from '@/store/auth-slice';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function SignInScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    const result = await dispatch(signIn({ email: email.trim(), password }));
    if (signIn.fulfilled.match(result)) {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.fg }]}>Sign in</Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            Sign in to your Passly account to continue.
          </Text>
        </View>

        {error && (
          <Alert variant="danger" onDismiss={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            label={isLoading ? 'Signing in...' : 'Sign in'}
            size="lg"
            onPress={handleSignIn}
            disabled={isLoading || !email.trim() || !password}
          />
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text style={[styles.link, { color: t.primary }]}>Forgot password?</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: t.muted }]}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={[styles.link, { color: t.primary }]}>Sign up</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && (
          <ActivityIndicator size="small" color={t.primary} style={styles.spinner} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing['3xl'],
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  form: {
    gap: spacing.base,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.sm,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  spinner: {
    marginTop: spacing.md,
  },
});
