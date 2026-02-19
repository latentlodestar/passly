import { useEffect, useState, useCallback, useMemo } from 'react';
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
  useGetSubmissionSummaryContentQuery,
  useGenerateSubmissionSummaryMutation,
} from '@/api/api';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { SettingsFab } from '@/components/ui/AppHeader';
import type { ChatImportSummaryResponse, SummaryMessageResponse } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5192';

const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Summary' },
];

/* ------------------------------------------------------------------ */
/*  Small components                                                    */
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

function SectionHeader({ icon, title, t }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  t: (typeof colors)[keyof typeof colors];
}) {
  return (
    <View style={sectionStyles.header}>
      <MaterialIcons name={icon} size={18} color={t.primary} />
      <Text style={[sectionStyles.title, { color: t.fg }]}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});

function GapRow({ start, end, days, t }: {
  start: string;
  end: string;
  days: number;
  t: (typeof colors)[keyof typeof colors];
}) {
  return (
    <View style={[gapStyles.row, { backgroundColor: t.warningSubtle, borderColor: t.border }]}>
      <View style={gapStyles.dates}>
        <Text style={[gapStyles.date, { color: t.fg }]}>{start}</Text>
        <MaterialIcons name="arrow-forward" size={12} color={t.muted} />
        <Text style={[gapStyles.date, { color: t.fg }]}>{end}</Text>
      </View>
      <Text style={[gapStyles.duration, { color: t.warningText }]}>{days} days</Text>
    </View>
  );
}

const gapStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  duration: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

function MessageRow({ msg, t }: {
  msg: SummaryMessageResponse;
  t: (typeof colors)[keyof typeof colors];
}) {
  const date = new Date(msg.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });

  return (
    <View style={[msgStyles.row, { borderLeftColor: t.primary }]}>
      <View style={msgStyles.meta}>
        <Text style={[msgStyles.sender, { color: t.fg }]}>{msg.senderName}</Text>
        <Text style={[msgStyles.date, { color: t.muted }]}>{date}</Text>
      </View>
      <Text style={[msgStyles.content, { color: t.fg2 }]} numberOfLines={3}>
        {msg.content}
      </Text>
    </View>
  );
}

const msgStyles = StyleSheet.create({
  row: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sender: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  date: {
    fontSize: fontSize.xs,
  },
  content: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});

function TimeWindowSection({ windowLabel, messages, t }: {
  windowLabel: string;
  messages: SummaryMessageResponse[];
  t: (typeof colors)[keyof typeof colors];
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = messages.slice(0, 2);
  const hasMore = messages.length > 2;

  return (
    <View style={[twStyles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={twStyles.header}
      >
        <View style={twStyles.headerLeft}>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color={t.muted}
          />
          <Text style={[twStyles.label, { color: t.fg }]}>{windowLabel}</Text>
        </View>
        <Text style={[twStyles.count, { color: t.muted }]}>
          {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
        </Text>
      </Pressable>

      <View style={twStyles.body}>
        {(expanded ? messages : preview).map((msg, i) => (
          <MessageRow key={`${msg.timestamp}-${i}`} msg={msg} t={t} />
        ))}
        {!expanded && hasMore && (
          <Pressable onPress={() => setExpanded(true)}>
            <Text style={[twStyles.showMore, { color: t.primary }]}>
              Show {messages.length - 2} more...
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const twStyles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  count: {
    fontSize: fontSize.xs,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  showMore: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    paddingTop: spacing.xs,
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

  // Fetch full summary content when we have a summary and passphrase
  const hasSummary = !!summaryMeta;
  const {
    data: summaryContent,
    isLoading: isLoadingContent,
  } = useGetSubmissionSummaryContentQuery(
    {
      id: activeSubmissionId ?? '',
      deviceId: deviceId ?? '',
      passphrase: passphrase ?? '',
    },
    { skip: !hasSummary || !activeSubmissionId || !deviceId || !passphrase },
  );

  // Group messages by time window
  const messageGroups = useMemo(() => {
    if (!summaryContent?.representativeMessages) return [];
    const groups = new Map<string, SummaryMessageResponse[]>();
    for (const msg of summaryContent.representativeMessages) {
      const existing = groups.get(msg.timeWindow);
      if (existing) {
        existing.push(msg);
      } else {
        groups.set(msg.timeWindow, [msg]);
      }
    }
    return Array.from(groups.entries()).map(([window, msgs]) => ({
      window,
      messages: msgs,
    }));
  }, [summaryContent?.representativeMessages]);

  const [generateSummary] = useGenerateSubmissionSummaryMutation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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

  /* ---- Date formatting ---- */

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });

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
          {hasSummary
            ? 'Review your communication analysis below, or download the full PDF report.'
            : 'Generate a structured report of your relationship communication history.'}
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

            {/* Overview card */}
            <Card status="ok">
              <CardHeader>Communication Overview</CardHeader>
              <CardBody>
                <StatRow label="Total messages" value={summaryMeta.totalMessages.toLocaleString()} t={t} />
                <StatRow label="Selected messages" value={summaryMeta.selectedMessages.toLocaleString()} t={t} />
                <StatRow label="Communication gaps" value={summaryMeta.gapCount.toLocaleString()} t={t} />
                {summaryContent && (
                  <StatRow
                    label="Date range"
                    value={`${fmtDate(summaryContent.earliestMessage)} — ${fmtDate(summaryContent.latestMessage)}`}
                    t={t}
                  />
                )}
                <StatRow
                  label="Generated"
                  value={new Date(summaryMeta.createdAt).toLocaleDateString()}
                  t={t}
                />
              </CardBody>
            </Card>

            {/* Content loading */}
            {isLoadingContent && (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={t.primary} />
                <Text style={[styles.loadingText, { color: t.muted }]}>Loading report details...</Text>
              </View>
            )}

            {/* Communication Gaps */}
            {summaryContent && summaryContent.gaps.length > 0 && (
              <View>
                <SectionHeader icon="warning-amber" title="Communication Gaps" t={t} />
                <Text style={[styles.sectionDesc, { color: t.fg2 }]}>
                  Periods of 7+ days with no messages. These may be flagged during review.
                </Text>
                <View style={styles.gapList}>
                  {summaryContent.gaps.map((gap, i) => (
                    <GapRow
                      key={i}
                      start={fmtDate(gap.start)}
                      end={fmtDate(gap.end)}
                      days={gap.durationDays}
                      t={t}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Representative Messages */}
            {summaryContent && messageGroups.length > 0 && (
              <View>
                <SectionHeader icon="forum" title="Representative Messages" t={t} />
                <Text style={[styles.sectionDesc, { color: t.fg2 }]}>
                  {summaryMeta.selectedMessages.toLocaleString()} messages selected from{' '}
                  {summaryMeta.totalMessages.toLocaleString()} to demonstrate communication patterns.
                </Text>
                <View style={styles.messageGroupList}>
                  {messageGroups.map(({ window, messages }) => (
                    <TimeWindowSection
                      key={window}
                      windowLabel={window}
                      messages={messages}
                      t={t}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Download PDF */}
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
    gap: spacing.xl,
  },
  sectionDesc: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  gapList: {
    gap: spacing.sm,
  },
  messageGroupList: {
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },

  /* Center helper */
  centered: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
});
