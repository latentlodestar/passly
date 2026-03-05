import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, fontFamily, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { useStepSync } from '@/hooks/use-step-sync';
import { Button } from '@/components/ui/Button';
import { WorkflowHeader } from '@/components/ui/AppHeader';

export default function AttestationScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();

  useStepSync('AttestCheckout');
  useEffect(() => { dispatch(reportStep(4)); }, [dispatch]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <WorkflowHeader title="Attest & Checkout" step={4} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIconWrap}>
          <View style={[styles.heroCircle, { backgroundColor: t.primaryMuted }]}>
            <MaterialIcons name="verified" size={52} color={t.primary} />
          </View>
        </View>

        <Text style={[styles.heading, { color: t.fg }]}>Attestation</Text>
        <Text style={[styles.body, { color: t.fg2 }]}>
          By proceeding, you attest that the chat evidence submitted is authentic
          and has not been altered, fabricated, or taken out of context.
        </Text>
        <Text style={[styles.body, { color: t.fg2 }]}>
          You understand that this material may be included in a filing with
          U.S. Citizenship and Immigration Services (USCIS) and that
          submitting false evidence may have legal consequences.
        </Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label="I Attest & Continue"
          onPress={() => router.replace('/')}
        />
        <Button
          label="Go back"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
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
  heading: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
