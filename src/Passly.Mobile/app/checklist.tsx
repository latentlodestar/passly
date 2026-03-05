import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector, useAppDispatch } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { useStepSync } from '@/hooks/use-step-sync';
import { usePassphrase } from '@/hooks/use-passphrase';
import {
  useGetChatImportsQuery,
  useGetSubmissionSummaryQuery,
  useGetSubmissionSummaryContentQuery,
  useAnalyzeSubmissionMutation,
} from '@/api/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { WorkflowHeader } from '@/components/ui/AppHeader';
import { SummaryContentView } from '@/components/SummaryContent';
import type { ChatImportSummaryResponse } from '@/types';

export default function ChecklistScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeSubmissionId = useAppSelector((s) => s.activeSubmission.id);

  useStepSync('ReviewComplete');
  useEffect(() => { dispatch(reportStep(3)); }, [dispatch]);

  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();

  // Fetch parsed chat imports to find one to use for analysis
  const { data: imports = [] } = useGetChatImportsQuery(
    { submissionId: activeSubmissionId ?? '' },
    { skip: !activeSubmissionId },
  );
  const parsedImport = imports.find(
    (i: ChatImportSummaryResponse) => i.status === 'Parsed',
  );

  // Fetch existing summary metadata (analysis result)
  const {
    data: summaryMeta,
    isLoading: isLoadingMeta,
    refetch: refetchMeta,
  } = useGetSubmissionSummaryQuery(
    { id: activeSubmissionId ?? '' },
    { skip: !activeSubmissionId },
  );

  const hasSummary = !!summaryMeta;

  // Fetch full content when analysis exists
  const {
    data: summaryContent,
    isLoading: isLoadingContent,
  } = useGetSubmissionSummaryContentQuery(
    {
      id: activeSubmissionId ?? '',
      passphrase: passphrase ?? '',
    },
    { skip: !hasSummary || !activeSubmissionId || !passphrase },
  );

  const [analyzeSubmission] = useAnalyzeSubmissionMutation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  const noPassphrase = passphraseLoaded && !passphrase;

  /* ---- Auto-trigger analysis on load ---- */

  useEffect(() => {
    if (hasTriggered) return;
    if (isLoadingMeta || hasSummary) return;
    if (!activeSubmissionId || !passphrase || !parsedImport) return;

    setHasTriggered(true);
    setIsAnalyzing(true);
    setAnalyzeError(null);

    analyzeSubmission({
      id: activeSubmissionId,
      body: {
        passphrase,
        chatImportId: parsedImport.id,
      },
    })
      .unwrap()
      .then(() => refetchMeta())
      .catch((err: unknown) => {
        let message = 'Failed to analyze messages.';
        if (err != null && typeof err === 'object' && 'data' in err) {
          const data = (err as { data: unknown }).data;
          if (data != null && typeof data === 'object' && 'error' in data) {
            message = String((data as { error: unknown }).error);
          }
        }
        setAnalyzeError(message);
      })
      .finally(() => setIsAnalyzing(false));
  }, [hasTriggered, isLoadingMeta, hasSummary, activeSubmissionId, passphrase, parsedImport, analyzeSubmission, refetchMeta]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <WorkflowHeader title="Review" step={3} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Passphrase warning */}
        {noPassphrase && (
          <Pressable onPress={() => router.navigate('/(tabs)/settings')} style={styles.warningRow}>
            <MaterialIcons name="lock-outline" size={16} color={t.warning} />
            <Text style={[styles.warningText, { color: t.fg2 }]}>
              Set up a passphrase in{' '}
              <Text style={{ color: t.primary }}>Settings</Text>
              {' '}before analyzing.
            </Text>
          </Pressable>
        )}

        {/* Analysis error */}
        {analyzeError && (
          <Alert variant="danger" onDismiss={() => setAnalyzeError(null)}>
            {analyzeError}
          </Alert>
        )}

        {/* Loading */}
        {isLoadingMeta && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        )}

        {/* Analyzing */}
        {!isLoadingMeta && !hasSummary && isAnalyzing && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={[styles.analyzingText, { color: t.fg2 }]}>
              Analyzing messages…
            </Text>
          </View>
        )}

        {/* No analysis yet and not analyzing */}
        {!isLoadingMeta && !hasSummary && !isAnalyzing && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: t.primaryMuted }]}>
              <MaterialIcons name="analytics" size={32} color={t.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.fg }]}>
              {noPassphrase ? 'Passphrase required' : 'No chat import available'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: t.muted }]}>
              {noPassphrase
                ? 'Set up a passphrase in Settings before analysis can run.'
                : 'Import and process a chat export first, then come back.'}
            </Text>
          </View>
        )}

        {/* Analysis content */}
        {hasSummary && (
          <SummaryContentView
            content={summaryContent}
            isLoading={isLoadingContent}
            totalMessages={summaryMeta.totalMessages}
            selectedMessages={summaryMeta.selectedMessages}
            t={t}
          />
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {hasSummary && (
          <Button
            label="Attest & Checkout"
            onPress={() => router.push('/attestation')}
          />
        )}
        <Button
          label="Save and exit"
          variant="secondary"
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
  analyzingText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
