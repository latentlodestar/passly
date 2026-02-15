import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const items: React.ReactNode[] = [];
  steps.forEach((step, index) => {
    const isCompleted = index < currentStep;
    const isCurrent = index === currentStep;

    items.push(
      <View key={`step-${index}`} style={styles.step}>
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: isCompleted
                ? t.primary
                : isCurrent
                  ? t.primaryMuted
                  : t.surface,
              borderColor: isCompleted || isCurrent ? t.primary : t.border,
            },
          ]}
        >
          <Text
            style={[
              styles.indicatorText,
              {
                color: isCompleted
                  ? t.primaryFg
                  : isCurrent
                    ? t.primary
                    : t.muted,
              },
            ]}
          >
            {isCompleted ? '\u2713' : `${index + 1}`}
          </Text>
        </View>
        <Text
          style={[
            styles.label,
            {
              color: isCompleted || isCurrent ? t.fg : t.muted,
              fontWeight: isCurrent ? fontWeight.semibold : fontWeight.medium,
            },
          ]}
          numberOfLines={1}
        >
          {step.label}
        </Text>
      </View>,
    );

    if (index < steps.length - 1) {
      items.push(
        <View
          key={`connector-${index}`}
          style={[
            styles.connector,
            {
              backgroundColor: isCompleted ? t.primary : t.border,
            },
          ]}
        />,
      );
    }
  });

  return <View style={styles.container}>{items}</View>;
}

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
}: ProgressBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const barColorMap: Record<string, string> = {
    primary: t.primary,
    success: t.success,
    warning: t.warning,
    danger: t.danger,
  };

  return (
    <View style={[styles.progressTrack, { backgroundColor: t.surface2 }]}>
      <View
        style={[
          styles.progressBar,
          {
            backgroundColor: barColorMap[variant],
            width: `${pct}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontSize: fontSize.xs,
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.full,
  },
});
