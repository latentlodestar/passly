import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { forgotPassword, confirmForgotPassword } from '@/auth/cognito';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

type Step = 'request' | 'confirm';

export default function ForgotPasswordScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestCode = async () => {
    if (!email.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep('confirm');
      setSuccessMessage('A verification code has been sent to your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await confirmForgotPassword(email.trim(), code.trim(), newPassword);
      router.replace('/signin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
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
          <Text style={[styles.title, { color: t.fg }]}>
            {step === 'request' ? 'Reset password' : 'Set new password'}
          </Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            {step === 'request'
              ? 'Enter your email address and we will send you a verification code.'
              : 'Enter the code from your email and choose a new password.'}
          </Text>
        </View>

        {error && (
          <Alert variant="danger" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && step === 'confirm' && (
          <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {step === 'request' && (
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
            <Button
              label={isLoading ? 'Sending...' : 'Send verification code'}
              size="lg"
              onPress={handleRequestCode}
              disabled={isLoading || !email.trim()}
            />
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.form}>
            <TextField
              label="Verification code"
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              autoCorrect={false}
              value={code}
              onChangeText={setCode}
            />
            <TextField
              label="New password"
              placeholder="At least 8 characters"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextField
              label="Confirm new password"
              placeholder="Re-enter your new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Button
              label={isLoading ? 'Resetting...' : 'Reset password'}
              size="lg"
              onPress={handleConfirmReset}
              disabled={isLoading || !code.trim() || !newPassword || !confirmPassword}
            />
          </View>
        )}

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/signin')}>
            <Text style={[styles.link, { color: t.primary }]}>Back to sign in</Text>
          </Pressable>
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
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  spinner: {
    marginTop: spacing.md,
  },
});
