import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { stepToRoute } from '@/constants/steps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeviceId } from '@/hooks/use-device-id';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAppearance, type Appearance } from '@/store/theme-slice';
import { setActiveSubmission } from '@/store/active-submission-slice';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useGetSubmissionsQuery } from '@/api/api';
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
  const deviceId = useDeviceId();
  const activeId = useAppSelector((state) => state.activeSubmission.id);
  const { data: submissions = [] } = useGetSubmissionsQuery(deviceId ?? '', {
    skip: !deviceId,
  });
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.fg }]}>Settings</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <MaterialIcons name="close" size={24} color={t.muted} />
        </Pressable>
      </View>

      <View style={styles.content}>
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
                      borderColor: selected ? t.primary : t.border,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={20}
                    color={selected ? t.primary : t.muted}
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

        {submissions.length > 0 && (
          <Card>
            <CardHeader>Submissions</CardHeader>
            <CardBody>
              {submissions.map((sub) => {
                const isActive = sub.id === activeId;
                return (
                  <View
                    key={sub.id}
                    style={[
                      styles.submissionRow,
                      {
                        backgroundColor: isActive ? t.primaryMuted : 'transparent',
                        borderColor: isActive ? t.primary : t.border,
                      },
                    ]}
                  >
                    <View style={styles.submissionInfo}>
                      <Text style={[styles.submissionLabel, { color: t.fg }]}>
                        {sub.label}
                      </Text>
                      <Text style={[styles.submissionMeta, { color: t.muted }]}>
                        {sub.status} · {new Date(sub.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.submissionActions}>
                      {!isActive && (
                        <Button
                          label="Set active"
                          variant="secondary"
                          size="sm"
                          onPress={() => dispatch(setActiveSubmission(sub.id))}
                        />
                      )}
                      <Button
                        label="Open"
                        size="sm"
                        onPress={() => {
                          dispatch(setActiveSubmission(sub.id));
                          router.back();
                          setTimeout(() => {
                            router.push(stepToRoute(sub.currentStep) as '/evidence');
                          }, 100);
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <View style={styles.passphraseHeader}>
              <Text style={[styles.cardHeaderText, { color: t.fg2 }]}>
                Encryption passphrase
              </Text>
              {isLoaded && savedPassphrase && (
                <MaterialIcons name="check-circle" size={18} color={t.success} />
              )}
            </View>
          </CardHeader>
          <CardBody>
            <Text style={[styles.passphraseHint, { color: t.muted }]}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionLabel: {
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
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passphraseHint: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  submissionInfo: {
    flex: 1,
    gap: 2,
  },
  submissionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  submissionMeta: {
    fontSize: fontSize.xs,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
