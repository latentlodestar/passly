import { StyleSheet, View, Text, type ViewProps } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';

type CardStatus = 'ok' | 'error' | 'warning';

interface CardProps extends ViewProps {
  status?: CardStatus;
  children: ReactNode;
}

export function Card({ status, style, children, ...props }: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const statusColors: Record<CardStatus, string> = {
    ok: t.success,
    error: t.danger,
    warning: t.warning,
  };

  return (
    <View
      style={[
        styles.card,
        shadow.sm,
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          borderLeftColor: status ? statusColors[status] : t.border,
          borderLeftWidth: status ? 3 : 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  children: ReactNode;
}

export function CardHeader({ children }: CardHeaderProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  return (
    <View style={[styles.header, { borderBottomColor: t.border }]}>
      {typeof children === 'string' ? (
        <Text style={[styles.headerText, { color: t.fg2 }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

interface CardBodyProps {
  children: ReactNode;
}

export function CardBody({ children }: CardBodyProps) {
  return <View style={styles.body}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    padding: spacing.base,
    gap: spacing.md,
  },
});
