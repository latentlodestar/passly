import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { stepToRoute } from '@/constants/steps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeviceId } from '@/hooks/use-device-id';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveSubmission } from '@/store/active-submission-slice';
import {
  useCreateSubmissionMutation,
  useGetSubmissionQuery,
} from '@/api/api';
import { Button } from '@/components/ui/Button';
import { SettingsFab } from '@/components/ui/AppHeader';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const deviceId = useDeviceId();
  const activeId = useAppSelector((s) => s.activeSubmission.id);

  const [createSubmission, { isLoading: isCreating }] =
    useCreateSubmissionMutation();

  const { data: activeSubmission } = useGetSubmissionQuery(
    { id: activeId!, deviceId: deviceId! },
    { skip: !activeId || !deviceId },
  );

  const handleCreate = async () => {
    if (!deviceId) return;
    const result = await createSubmission({
      deviceId,
      label: `Petition ${new Date().toLocaleDateString()}`,
    }).unwrap();
    dispatch(setActiveSubmission(result.id));
    router.push('/evidence');
  };

  const handleResume = () => {
    if (activeSubmission) {
      router.push(stepToRoute(activeSubmission.currentStep) as '/evidence');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: t.fg }]}>
            Prepare your immigration petition with confidence
          </Text>
          <Text style={[styles.heroSubtitle, { color: t.fg2 }]}>
            Passly helps you structure your petition, analyze supporting
            evidence, and identify documentation gaps.
          </Text>

          <View style={styles.actions}>
            <Button
              label={isCreating ? 'Creating...' : 'Create submission'}
              size="lg"
              onPress={handleCreate}
              disabled={isCreating || !deviceId}
            />
            {activeSubmission && (
              <Button
                label="Resume submission"
                variant="secondary"
                size="lg"
                onPress={handleResume}
              />
            )}
          </View>
        </View>
      </ScrollView>
      <SettingsFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.base,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
});
