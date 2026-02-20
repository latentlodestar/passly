import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { confirmSignUp, clearError } from '@/store/auth-slice';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function ConfirmScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(paramEmail ?? '');
  const [code, setCode] = useState('');

  const handleConfirm = async () => {
    if (!email.trim() || !code.trim()) return;
    const result = await dispatch(
      confirmSignUp({ email: email.trim(), code: code.trim() }),
    );
    if (confirmSignUp.fulfilled.match(result)) {
      router.replace('/signin');
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
          <Text style={[styles.title, { color: t.fg }]}>Verify your email</Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            Enter the verification code sent to your email address.
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
            label="Verification code"
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            autoCorrect={false}
            value={code}
            onChangeText={setCode}
          />
          <Button
            label={isLoading ? 'Verifying...' : 'Verify'}
            size="lg"
            onPress={handleConfirm}
            disabled={isLoading || !email.trim() || !code.trim()}
          />
        </View>

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
