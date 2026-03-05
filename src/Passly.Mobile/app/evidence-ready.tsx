import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, fontFamily, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { useStepSync } from '@/hooks/use-step-sync';
import { Button } from '@/components/ui/Button';
import { WorkflowHeader } from '@/components/ui/AppHeader';

export default function EvidenceReadyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { chatImportId } = useLocalSearchParams<{ chatImportId: string }>();

  useStepSync('EvidenceReady');
  useEffect(() => { dispatch(reportStep(2)); }, [dispatch]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <WorkflowHeader title="Evidence ready" step={2} />
      <View style={styles.center}>
        {/* Hero icon — folder with check overlay */}
        <View style={styles.heroIconWrap}>
          <View style={[styles.heroCircle, { backgroundColor: t.primaryMuted }]}>
            <MaterialIcons name="folder" size={52} color={t.primary} />
          </View>
          <View style={[styles.checkBadge, { backgroundColor: t.bg }]}>
            <MaterialIcons name="check-circle" size={28} color={t.successText} />
          </View>
        </View>

        <Text style={[styles.heading, { color: t.fg }]}>Evidence is Ready</Text>
        <Text style={[styles.subtext, { color: t.fg2 }]}>
          Your curated chat history has been successfully generated.
        </Text>
      </View>

      <View style={styles.bottomBar}>
        <Button
          label="View Curated Chat History"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/import-detail',
              params: { id: chatImportId },
            })
          }
        />
        <Button
          label="Continue"
          onPress={() => router.push('/checklist')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  heroIconWrap: {
    position: 'relative',
  },
  heroCircle: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: radius.full,
    padding: 2,
  },
  heading: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
