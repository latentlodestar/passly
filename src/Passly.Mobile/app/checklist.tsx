import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Stepper, ProgressBar } from '@/components/ui/Stepper';
import { SettingsFab } from '@/components/ui/AppHeader';

const processSteps = [
  { label: 'Get started' },
  { label: 'Import evidence' },
  { label: 'Review' },
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

function statusIcon(status: ChecklistItem['status']) {
  switch (status) {
    case 'complete':
      return '\u2713';
    case 'weak':
      return '\u26A0';
    case 'missing':
      return '\u25CB';
  }
}

function badgeVariant(status: ChecklistItem['status']): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'complete':
      return 'success';
    case 'weak':
      return 'warning';
    case 'missing':
      return 'danger';
  }
}

function badgeLabel(status: ChecklistItem['status']) {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'weak':
      return 'Needs more';
    case 'missing':
      return 'Missing';
  }
}

export default function ChecklistScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const completed = checklistItems.filter((i) => i.status === 'complete').length;
  const total = checklistItems.length;
  const pct = Math.round((completed / total) * 100);

  const missingCount = checklistItems.filter((i) => i.status === 'missing').length;
  const weakCount = checklistItems.filter((i) => i.status === 'weak').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={2} />
        </View>

        <Card>
          <CardBody>
            <View style={styles.readiness}>
              <Text style={[styles.readinessScore, { color: t.fg }]}>
                {pct}%
              </Text>
              <Text style={[styles.readinessLabel, { color: t.fg2 }]}>
                OVERALL READINESS
              </Text>
              <ProgressBar
                value={completed}
                max={total}
                variant={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'}
              />
            </View>
          </CardBody>
        </Card>

        {(missingCount > 0 || weakCount > 0) && (
          <Alert variant="warning" title="Items need attention">
            {`${missingCount > 0 ? `${missingCount} item${missingCount !== 1 ? 's' : ''} missing. ` : ''}${weakCount > 0 ? `${weakCount} item${weakCount !== 1 ? 's' : ''} could be strengthened.` : ''}`}
          </Alert>
        )}

        <Card>
          <CardHeader>Checklist</CardHeader>
          <View>
            {checklistItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.checkItem,
                  {
                    borderBottomColor: t.border,
                    borderBottomWidth:
                      index < checklistItems.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.checkIcon,
                    {
                      color:
                        item.status === 'complete'
                          ? t.successText
                          : item.status === 'weak'
                            ? t.warningText
                            : t.muted,
                    },
                  ]}
                >
                  {statusIcon(item.status)}
                </Text>
                <View style={styles.checkContent}>
                  <Text
                    style={[
                      styles.checkLabel,
                      {
                        color:
                          item.status === 'complete' ? t.fg2 : t.fg,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.checkDesc, { color: t.muted }]}>
                    {item.description}
                  </Text>
                </View>
                <Badge variant={badgeVariant(item.status)}>
                  {badgeLabel(item.status)}
                </Badge>
              </View>
            ))}
          </View>
        </Card>
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
    gap: spacing.lg,
  },
  stepperWrap: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  readiness: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  readinessScore: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    lineHeight: 48,
  },
  readinessLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  checkIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  checkContent: {
    flex: 1,
    gap: 2,
  },
  checkLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  checkDesc: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
});
