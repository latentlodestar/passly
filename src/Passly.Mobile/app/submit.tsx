import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { useStepSync } from '@/hooks/use-step-sync';
import { usePassphrase } from '@/hooks/use-passphrase';
import {
  useGetSubmissionSummaryQuery,
  useGenerateSubmissionSummaryMutation,
} from '@/api/api';
import { getIdToken } from '@/auth/cognito';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Alert } from '@/components/ui/Alert';
import { SettingsFab } from '@/components/ui/AppHeader';
import { SignaturePad } from '@/components/ui/SignaturePad';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5192';

const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Summary' },
];

export default function SummaryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const maxReachedStep = useAppSelector((s) => s.progress.maxReachedStep);
  const activeSubmissionId = useAppSelector((s) => s.activeSubmission.id);

  useEffect(() => { dispatch(reportStep(2)); }, [dispatch]);
  useStepSync('ReviewComplete');

  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();

  // Fetch existing summary metadata
  const {
    data: summaryMeta,
    isLoading: isLoadingMeta,
    refetch: refetchMeta,
  } = useGetSubmissionSummaryQuery(
    { id: activeSubmissionId ?? '' },
    { skip: !activeSubmissionId },
  );

  const hasSummary = !!summaryMeta;
  const hasPdf = hasSummary && summaryMeta.hasPdf;

  const [generateSummary] = useGenerateSubmissionSummaryMutation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const noPassphrase = passphraseLoaded && !passphrase;
  const canGenerate = !!signatureBase64 && !noPassphrase && !isGenerating;

  /* ---- Generate PDF ---- */

  const handleGeneratePdf = useCallback(async () => {
    if (!activeSubmissionId || !passphrase || !signatureBase64) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      await generateSummary({
        id: activeSubmissionId,
        body: { passphrase, signatureBase64 },
      }).unwrap();
      refetchMeta();
    } catch (err: unknown) {
      let message = 'Failed to generate PDF.';
      if (err != null && typeof err === 'object' && 'data' in err) {
        const data = (err as { data: unknown }).data;
        if (data != null && typeof data === 'object' && 'error' in data) {
          message = String((data as { error: unknown }).error);
        }
      }
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [activeSubmissionId, passphrase, signatureBase64, generateSummary, refetchMeta]);

  /* ---- Download ---- */

  const handleDownload = useCallback(async () => {
    if (!activeSubmissionId || !passphrase) return;

    const token = await getIdToken();
    const url =
      `${API_BASE_URL}/api/submissions/${activeSubmissionId}/summary/download` +
      `?passphrase=${encodeURIComponent(passphrase)}` +
      (token ? `&token=${encodeURIComponent(token)}` : '');

    await WebBrowser.openBrowserAsync(url);
  }, [activeSubmissionId, passphrase]);

  /* ---- Render ---- */

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSigning}
      >
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={2} maxReachedStep={maxReachedStep} onStepPress={(i) => {
            const routes = ['/evidence', '/checklist', '/submit'] as const;
            router.push(routes[i]);
          }} />
        </View>

        {/* Passphrase warning */}
        {noPassphrase && (
          <Pressable onPress={() => router.push('/settings')} style={styles.warningRow}>
            <MaterialIcons name="lock-outline" size={16} color={t.warning} />
            <Text style={[styles.warningText, { color: t.fg2 }]}>
              Set up a passphrase in{' '}
              <Text style={{ color: t.primary }}>Settings</Text>
              {' '}before generating.
            </Text>
          </Pressable>
        )}

        {/* Generation error */}
        {generateError && (
          <Alert variant="danger" onDismiss={() => setGenerateError(null)}>
            {generateError}
          </Alert>
        )}

        {/* Loading state */}
        {isLoadingMeta && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        )}

        {/* No analysis yet — needs to go back to Review */}
        {!isLoadingMeta && !hasSummary && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: t.primaryMuted }]}>
              <MaterialIcons name="analytics" size={32} color={t.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.fg }]}>No analysis available</Text>
            <Text style={[styles.emptySubtitle, { color: t.muted }]}>
              Go back to the Review step to analyze your chat messages first.
            </Text>
          </View>
        )}

        {/* Analysis exists, no PDF yet — attestation + signature */}
        {!isLoadingMeta && hasSummary && !hasPdf && (
          <View style={styles.summarySection}>
            {/* Attestation card */}
            <View style={[styles.attestationCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.attestationHeader}>
                <MaterialIcons name="verified" size={20} color={t.primary} />
                <Text style={[styles.attestationTitle, { color: t.fg }]}>Attestation</Text>
              </View>
              <Text style={[styles.attestationBody, { color: t.fg2 }]}>
                I attest that the information contained in this summary is accurate and complete
                to the best of my knowledge. The communication records presented have not been
                altered, fabricated, or selectively omitted to misrepresent the nature of the
                relationship.
              </Text>
            </View>

            {/* Signature pad */}
            <View>
              <Text style={[styles.sectionLabel, { color: t.fg }]}>Your signature</Text>
              <Text style={[styles.sectionHint, { color: t.muted }]}>
                Draw your signature below to sign the attestation.
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <SignaturePad
                  onSignatureCapture={setSignatureBase64}
                  onClear={() => setSignatureBase64(null)}
                  onDrawBegin={() => setIsSigning(true)}
                  onDrawEnd={() => setIsSigning(false)}
                />
              </View>
            </View>

            {isGenerating && (
              <View style={styles.generatingRow}>
                <ActivityIndicator size="small" color={t.primary} />
                <Text style={[styles.generatingText, { color: t.fg2 }]}>
                  Generating signed PDF…
                </Text>
              </View>
            )}
          </View>
        )}

        {/* PDF ready — success state */}
        {!isLoadingMeta && hasPdf && (
          <View style={styles.successSection}>
            <View style={[styles.successCard, { backgroundColor: t.successSubtle, borderColor: t.success }]}>
              <MaterialIcons name="check-circle" size={32} color={t.success} />
              <Text style={[styles.successTitle, { color: t.fg }]}>PDF generated</Text>
              <Text style={[styles.successSubtitle, { color: t.fg2 }]}>
                Your signed communication summary is ready for download.
              </Text>
            </View>
            <Button
              label="Download PDF"
              variant="secondary"
              onPress={handleDownload}
            />
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom bar */}
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
        {hasSummary && !hasPdf && (
          <Button
            label={isGenerating ? 'Generating…' : 'Sign and generate PDF'}
            disabled={!canGenerate}
            onPress={handleGeneratePdf}
          />
        )}
        <Button
          label="Save and exit"
          variant="ghost"
          onPress={() => router.replace('/')}
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  summarySection: {
    gap: spacing.xl,
  },
  attestationCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  attestationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attestationTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  attestationBody: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  generatingText: {
    fontSize: fontSize.sm,
  },
  successSection: {
    gap: spacing.xl,
  },
  successCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  successSubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
});
