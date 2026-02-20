import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { signUp, clearError } from '@/store/auth-slice';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function SignUpScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLocalError(null);
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const result = await dispatch(signUp({ email: email.trim(), password }));
    if (signUp.fulfilled.match(result)) {
      router.push({ pathname: '/confirm', params: { email: email.trim() } });
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.fg }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            Create your Passly account to get started.
          </Text>
        </View>

        {displayError && (
          <Alert
            variant="danger"
            onDismiss={() => {
              setLocalError(null);
              dispatch(clearError());
            }}
          >
            {displayError}
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
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextField
            label="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button
            label={isLoading ? 'Creating account...' : 'Create account'}
            size="lg"
            onPress={handleSignUp}
            disabled={isLoading || !email.trim() || !password || !confirmPassword}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: t.muted }]}>
              Already have an account?
            </Text>
            <Pressable onPress={() => router.push('/signin')}>
              <Text style={[styles.link, { color: t.primary }]}>Sign in</Text>
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
