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
import { useDeviceId } from '@/hooks/use-device-id';
import { usePassphrase } from '@/hooks/use-passphrase';
import {
  useGetChatImportsQuery,
  useGetSubmissionSummaryQuery,
  useGenerateSubmissionSummaryMutation,
} from '@/api/api';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { SettingsFab } from '@/components/ui/AppHeader';
import type { ChatImportSummaryResponse } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5192';

const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Summary' },
];

/* ------------------------------------------------------------------ */
/*  Stat row                                                           */
/* ------------------------------------------------------------------ */

function StatRow({ label, value, t }: { label: string; value: string; t: (typeof colors)[keyof typeof colors] }) {
  return (
    <View style={statStyles.row}>
      <Text style={[statStyles.label, { color: t.fg2 }]}>{label}</Text>
      <Text style={[statStyles.value, { color: t.fg }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

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

  const deviceId = useDeviceId();
  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();

  // Fetch parsed chat imports to find one to use for generation
  const { data: imports = [] } = useGetChatImportsQuery(deviceId ?? '', {
    skip: !deviceId,
  });
  const parsedImport = imports.find(
    (i: ChatImportSummaryResponse) => i.status === 'Parsed',
  );

  // Fetch existing summary metadata
  const {
    data: summaryMeta,
    isLoading: isLoadingMeta,
    refetch: refetchMeta,
  } = useGetSubmissionSummaryQuery(
    { id: activeSubmissionId ?? '', deviceId: deviceId ?? '' },
    { skip: !activeSubmissionId || !deviceId },
  );

  const [generateSummary] = useGenerateSubmissionSummaryMutation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const hasSummary = !!summaryMeta;
  const noPassphrase = passphraseLoaded && !passphrase;
  const noParsedImport = !parsedImport && !isLoadingMeta;

  /* ---- Generate ---- */

  const handleGenerate = useCallback(async () => {
    if (!activeSubmissionId || !deviceId || !passphrase || !parsedImport) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      await generateSummary({
        id: activeSubmissionId,
        body: {
          deviceId,
          passphrase,
          chatImportId: parsedImport.id,
        },
      }).unwrap();
      refetchMeta();
    } catch (err: unknown) {
      let message = 'Failed to generate summary.';
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
  }, [activeSubmissionId, deviceId, passphrase, parsedImport, generateSummary, refetchMeta]);

  /* ---- Download ---- */

  const handleDownload = useCallback(async () => {
    if (!activeSubmissionId || !deviceId || !passphrase) return;

    const url =
      `${API_BASE_URL}/api/submissions/${activeSubmissionId}/summary/download` +
      `?deviceId=${encodeURIComponent(deviceId)}` +
      `&passphrase=${encodeURIComponent(passphrase)}`;

    await WebBrowser.openBrowserAsync(url);
  }, [activeSubmissionId, deviceId, passphrase]);

  /* ---- Render ---- */

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={2} maxReachedStep={maxReachedStep} onStepPress={(i) => {
            const routes = ['/evidence', '/checklist', '/submit'] as const;
            router.push(routes[i]);
          }} />
        </View>

        <Text style={[styles.title, { color: t.fg }]}>Communication Summary</Text>
        <Text style={[styles.subtitle, { color: t.fg2 }]}>
          Generate a structured PDF report of your relationship communication history.
        </Text>

        {/* Passphrase warning */}
        {noPassphrase && (
          <Pressable onPress={() => router.push('/settings')} style={styles.warningRow}>
            <MaterialIcons name="lock-outline" size={16} color={t.warning} />
            <Text style={[styles.warningText, { color: t.fg2 }]}>
              Set up a passphrase in{' '}
              <Text style={{ color: t.primary }}>Settings</Text>
              {' '}before generating a summary.
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

        {/* No summary yet */}
        {!isLoadingMeta && !hasSummary && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: t.primaryMuted }]}>
              <MaterialIcons name="description" size={32} color={t.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.fg }]}>No summary generated</Text>
            <Text style={[styles.emptySubtitle, { color: t.muted }]}>
              {noParsedImport
                ? 'Import and process a chat export first, then come back to generate your summary.'
                : 'Your chat evidence is ready. Tap the button below to analyze your communication history and generate a PDF report.'}
            </Text>

            {isGenerating && (
              <View style={styles.generatingRow}>
                <ActivityIndicator size="small" color={t.primary} />
                <Text style={[styles.generatingText, { color: t.fg2 }]}>
                  Analyzing messages and generating report…
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Summary exists */}
        {!isLoadingMeta && hasSummary && (
          <View style={styles.summarySection}>
            <Card status="ok">
              <CardHeader>Summary Report</CardHeader>
              <CardBody>
                <StatRow label="Total messages" value={summaryMeta.totalMessages.toLocaleString()} t={t} />
                <StatRow label="Selected messages" value={summaryMeta.selectedMessages.toLocaleString()} t={t} />
                <StatRow label="Communication gaps" value={summaryMeta.gapCount.toLocaleString()} t={t} />
                <StatRow
                  label="Generated"
                  value={new Date(summaryMeta.createdAt).toLocaleDateString()}
                  t={t}
                />
              </CardBody>
            </Card>

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
        {!hasSummary && (
          <Button
            label={isGenerating ? 'Generating…' : 'Generate Summary'}
            disabled={isGenerating || noPassphrase || noParsedImport || !activeSubmissionId}
            onPress={handleGenerate}
          />
        )}
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

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

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
    color: '#6b7280',
    lineHeight: 20,
  },

  /* Warning */
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

  /* Empty state */
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
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  generatingText: {
    fontSize: fontSize.sm,
  },

  /* Summary */
  summarySection: {
    gap: spacing.base,
  },

  /* Center helper */
  centered: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
});
