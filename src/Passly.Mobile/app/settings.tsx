import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, fontFamily, radius, borderWidth } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAppearance, type Appearance } from '@/store/theme-slice';
import { signOut } from '@/store/auth-slice';
import { usePassphrase } from '@/hooks/use-passphrase';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';

const options: { value: Appearance; label: string; icon: 'brightness-auto' | 'light-mode' | 'dark-mode' }[] = [
  { value: 'system', label: 'System', icon: 'brightness-auto' },
  { value: 'light', label: 'Light', icon: 'light-mode' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const appearance = useAppSelector((state) => state.theme.appearance);
  const userEmail = useAppSelector((state) => state.auth.userEmail);
  const { passphrase: savedPassphrase, isLoaded, setPassphrase } = usePassphrase();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | undefined>();

  const handleSavePassphrase = async () => {
    if (draft.length < 8) {
      setError('Must be at least 8 characters');
      return;
    }
    setError(undefined);
    await setPassphrase(draft);
    setDraft('');
  };

  const handleSignOut = () => {
    dispatch(signOut());
    router.replace('/signin');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={t.fg} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: t.fg }]}>SETTINGS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {userEmail && (
          <Card>
            <CardHeader>Account</CardHeader>
            <CardBody>
              <Text style={[styles.emailText, { color: t.fg }]}>{userEmail}</Text>
              <Button
                label="Sign out"
                variant="danger"
                size="sm"
                onPress={handleSignOut}
              />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>Appearance</CardHeader>
          <CardBody>
            {options.map((option) => {
              const selected = appearance === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => dispatch(setAppearance(option.value))}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? t.primaryMuted : 'transparent',
                      borderColor: selected ? t.primary : t.fg,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={20}
                    color={selected ? t.primary : t.fg}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: selected ? t.primary : t.fg,
                        fontWeight: selected ? fontWeight.semibold : fontWeight.normal,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected && (
                    <MaterialIcons
                      name="check"
                      size={18}
                      color={t.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <View style={styles.passphraseHeader}>
              <Text style={[styles.cardHeaderText, { color: t.fg }]}>
                Encryption passphrase
              </Text>
              {isLoaded && savedPassphrase && (
                <MaterialIcons name="check-circle" size={18} color={t.success} />
              )}
            </View>
          </CardHeader>
          <CardBody>
            <Text style={[styles.passphraseHint, { color: t.fg }]}>
              Your passphrase encrypts uploaded evidence. Choose something memorable — it cannot be recovered.
            </Text>
            <TextField
              placeholder="Enter passphrase"
              secureTextEntry
              value={draft}
              onChangeText={setDraft}
              error={error}
            />
            <Button
              label={savedPassphrase ? 'Update passphrase' : 'Save passphrase'}
              size="sm"
              onPress={handleSavePassphrase}
              disabled={draft.length === 0}
            />
          </CardBody>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topBarTitle: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: 1,
  },
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emailText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: borderWidth.accent,
    gap: spacing.md,
  },
  optionLabel: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  passphraseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  passphraseHint: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
