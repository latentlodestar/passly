import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { SettingsFab } from '@/components/ui/AppHeader';

const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Submit' },
];

export default function SubmitScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const maxReachedStep = useAppSelector((s) => s.progress.maxReachedStep);

  useEffect(() => { dispatch(reportStep(2)); }, [dispatch]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={2} maxReachedStep={maxReachedStep} onStepPress={(i) => {
            const routes = ['/evidence', '/checklist', '/submit'] as const;
            router.push(routes[i]);
          }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: t.fg }]}>Submit your petition</Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            This step is coming soon. Once your checklist is complete, you'll be able to finalize and submit your petition package here.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: t.bg,
            borderTopColor: t.border,
            paddingBottom: insets.bottom + spacing.base,
          },
        ]}
      >
        <Button
          label="Save and exit"
          variant="ghost"
          onPress={() => router.replace('/')}
        />
      </View>
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
    gap: spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stepperWrap: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  content: {
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing['2xl'],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
  },
});
