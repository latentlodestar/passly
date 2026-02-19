import { useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import type { SummaryContentResponse, SummaryMessageResponse } from '@/types';

type Theme = (typeof colors)[keyof typeof colors];

/* ------------------------------------------------------------------ */
/*  Stat row                                                           */
/* ------------------------------------------------------------------ */

function StatRow({ label, value, t }: { label: string; value: string; t: Theme }) {
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
  label: { fontSize: fontSize.sm },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ icon, title, t }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  t: Theme;
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
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});

/* ------------------------------------------------------------------ */
/*  Gap row                                                            */
/* ------------------------------------------------------------------ */

function GapRow({ start, end, days, t }: {
  start: string; end: string; days: number; t: Theme;
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
  dates: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  duration: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});

/* ------------------------------------------------------------------ */
/*  Message row                                                        */
/* ------------------------------------------------------------------ */

function MessageRow({ msg, t }: { msg: SummaryMessageResponse; t: Theme }) {
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
  row: { borderLeftWidth: 2, paddingLeft: spacing.md, paddingVertical: spacing.xs },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sender: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  date: { fontSize: fontSize.xs },
  content: { fontSize: fontSize.xs, lineHeight: 18 },
});

/* ------------------------------------------------------------------ */
/*  Time window section                                                */
/* ------------------------------------------------------------------ */

function TimeWindowSection({ windowLabel, messages, t }: {
  windowLabel: string;
  messages: SummaryMessageResponse[];
  t: Theme;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = messages.slice(0, 2);
  const hasMore = messages.length > 2;

  return (
    <View style={[twStyles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={twStyles.header}>
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
  section: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  count: { fontSize: fontSize.xs },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  showMore: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, paddingTop: spacing.xs },
});

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */

interface SummaryContentViewProps {
  content: SummaryContentResponse | undefined;
  isLoading: boolean;
  totalMessages: number;
  selectedMessages: number;
  t: Theme;
}

export function SummaryContentView({
  content,
  isLoading,
  totalMessages,
  selectedMessages,
  t,
}: SummaryContentViewProps) {
  const messageGroups = useMemo(() => {
    if (!content?.representativeMessages) return [];
    const groups = new Map<string, SummaryMessageResponse[]>();
    for (const msg of content.representativeMessages) {
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
  }, [content?.representativeMessages]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={t.primary} />
        <Text style={[styles.loadingText, { color: t.muted }]}>Loading report details...</Text>
      </View>
    );
  }

  if (!content) return null;

  return (
    <View style={styles.container}>
      {/* Overview card */}
      <Card status="ok">
        <CardHeader>Communication Overview</CardHeader>
        <CardBody>
          <StatRow label="Total messages" value={totalMessages.toLocaleString()} t={t} />
          <StatRow label="Selected messages" value={selectedMessages.toLocaleString()} t={t} />
          <StatRow label="Communication gaps" value={content.gaps.length.toLocaleString()} t={t} />
          <StatRow
            label="Date range"
            value={`${fmtDate(content.earliestMessage)} — ${fmtDate(content.latestMessage)}`}
            t={t}
          />
        </CardBody>
      </Card>

      {/* Communication Gaps */}
      {content.gaps.length > 0 && (
        <View>
          <SectionHeader icon="warning-amber" title="Communication Gaps" t={t} />
          <Text style={[styles.sectionDesc, { color: t.fg2 }]}>
            Periods of 7+ days with no messages. These may be flagged during review.
          </Text>
          <View style={styles.gapList}>
            {content.gaps.map((gap, i) => (
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
      {messageGroups.length > 0 && (
        <View>
          <SectionHeader icon="forum" title="Representative Messages" t={t} />
          <Text style={[styles.sectionDesc, { color: t.fg2 }]}>
            {selectedMessages.toLocaleString()} messages selected from{' '}
            {totalMessages.toLocaleString()} to demonstrate communication patterns.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  centered: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  loadingText: { fontSize: fontSize.sm, marginTop: spacing.sm },
  sectionDesc: { fontSize: fontSize.xs, lineHeight: 18, marginBottom: spacing.md },
  gapList: { gap: spacing.sm },
  messageGroupList: { gap: spacing.md },
});
