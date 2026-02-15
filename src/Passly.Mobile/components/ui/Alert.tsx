import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
}: AlertProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const bgMap: Record<AlertVariant, string> = {
    info: t.primaryMuted,
    success: t.successSubtle,
    warning: t.warningSubtle,
    danger: t.dangerSubtle,
  };

  const borderMap: Record<AlertVariant, string> = {
    info: t.primary,
    success: t.success,
    warning: t.warning,
    danger: t.danger,
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
        },
      ]}
    >
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
        )}
        {typeof children === 'string' ? (
          <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={[styles.dismiss, { color: t.muted }]}>{'\u00D7'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  text: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  dismiss: {
    fontSize: 20,
    lineHeight: 20,
  },
});
