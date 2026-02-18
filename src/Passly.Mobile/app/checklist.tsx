import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { Button } from '@/components/ui/Button';
import { Stepper, ProgressBar } from '@/components/ui/Stepper';
import { SettingsFab } from '@/components/ui/AppHeader';

const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Submit' },
];

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'complete' | 'missing' | 'weak';
}

const checklistItems: ChecklistItem[] = [
  {
    id: '1',
    label: 'Marriage certificate',
    description: 'Certified copy of your marriage certificate',
    status: 'complete',
  },
  {
    id: '2',
    label: 'Passport copies',
    description: 'Copies of both petitioner and beneficiary passports',
    status: 'complete',
  },
  {
    id: '3',
    label: 'Passport-style photos',
    description: '2x2 inch photos meeting USCIS specifications',
    status: 'missing',
  },
  {
    id: '4',
    label: 'Communication history',
    description: 'Chat logs, call records, or messaging history',
    status: 'complete',
  },
  {
    id: '5',
    label: 'Joint financial records',
    description: 'Bank statements, shared accounts, or joint bills',
    status: 'weak',
  },
  {
    id: '6',
    label: 'Photos together',
    description: 'Photos showing your relationship over time',
    status: 'missing',
  },
  {
    id: '7',
    label: 'Travel records',
    description: 'Flight itineraries, boarding passes, or hotel bookings',
    status: 'weak',
  },
  {
    id: '8',
    label: 'Affidavits of support',
    description: 'Sworn statements from friends or family',
    status: 'missing',
  },
];

type Theme = (typeof colors)[keyof typeof colors];

function statusIcon(status: ChecklistItem['status']): { name: keyof typeof MaterialIcons.glyphMap; color: (t: Theme) => string } {
  switch (status) {
    case 'complete':
      return { name: 'check-circle', color: (t) => t.successText };
    case 'weak':
      return { name: 'error-outline', color: (t) => t.warningText };
    case 'missing':
      return { name: 'radio-button-unchecked', color: (t) => t.dangerText };
  }
}

export default function ChecklistScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const maxReachedStep = useAppSelector((s) => s.progress.maxReachedStep);

  useEffect(() => { dispatch(reportStep(1)); }, [dispatch]);

  const completed = checklistItems.filter((i) => i.status === 'complete').length;
  const total = checklistItems.length;
  const attentionCount = total - completed;

  // Sort: attention items first (missing, then weak), completed last
  const sortedItems = [...checklistItems].sort((a, b) => {
    const order = { missing: 0, weak: 1, complete: 2 };
    return order[a.status] - order[b.status];
  });

  const allComplete = attentionCount === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={1} maxReachedStep={maxReachedStep} onStepPress={(i) => {
            const routes = ['/evidence', '/checklist', '/submit'] as const;
            router.push(routes[i]);
          }} />
        </View>

        {/* Compact status summary */}
        <View style={styles.summary}>
          <Text style={[styles.summaryText, { color: t.fg }]}>
            {allComplete
              ? 'All items complete'
              : `${attentionCount} item${attentionCount !== 1 ? 's' : ''} need${attentionCount === 1 ? 's' : ''} attention`}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarWrap}>
              <ProgressBar value={completed} max={total} variant={allComplete ? 'success' : 'primary'} />
            </View>
            <Text style={[styles.progressLabel, { color: t.muted }]}>
              {Math.round((completed / total) * 100)}%
            </Text>
          </View>
        </View>

        {/* Checklist */}
        <View>
          {sortedItems.map((item, index) => {
            const icon = statusIcon(item.status);
            const isComplete = item.status === 'complete';

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: index < sortedItems.length - 1 ? t.border : 'transparent' },
                  pressed ? { opacity: 0.7 } : null,
                ]}
                onPress={() => {
                  // Navigate to resolve this item
                }}
                disabled={isComplete}
              >
                <MaterialIcons
                  name={icon.name}
                  size={20}
                  color={icon.color(t)}
                  style={isComplete ? styles.iconSettled : undefined}
                />
                <View style={styles.rowContent}>
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: isComplete ? t.muted : t.fg },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {!isComplete && (
                    <Text style={[styles.rowDesc, { color: t.muted }]}>
                      {item.description}
                    </Text>
                  )}
                </View>
                {!isComplete && (
                  <MaterialIcons name="chevron-right" size={20} color={t.muted} />
                )}
              </Pressable>
            );
          })}
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
        <View style={styles.bottomRow}>
          <Button
            label="Continue"
            onPress={() => router.push('/submit')}
            style={styles.bottomRowBtn}
          />
        </View>
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
  stepperWrap: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },

  /* Status summary */
  summary: {
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarWrap: {
    flex: 1,
  },
  progressLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    minWidth: 28,
    textAlign: 'right',
  },

  /* Checklist rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  iconSettled: {
    opacity: 0.5,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rowDesc: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomRowBtn: {
    flex: 1,
  },
});
