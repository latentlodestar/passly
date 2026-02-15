import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const bgMap: Record<BadgeVariant, string> = {
    neutral: t.surface2,
    success: t.successSubtle,
    danger: t.dangerSubtle,
    warning: t.warningSubtle,
  };

  const fgMap: Record<BadgeVariant, string> = {
    neutral: t.fg2,
    success: t.successText,
    danger: t.dangerText,
    warning: t.warningText,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant] }]}>
      <Text style={[styles.text, { color: fgMap[variant] }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
