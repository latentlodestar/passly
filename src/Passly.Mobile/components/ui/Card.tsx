import { StyleSheet, View, Text, type ViewProps } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, fontFamily } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReactNode } from 'react';

interface CardProps extends ViewProps {
  children: ReactNode;
}

export function Card({ style, children, ...props }: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.surface,
          borderColor: t.borderAccent,
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
        <Text style={[styles.headerText, { color: t.fg }]}>{children}</Text>
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
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  body: {
    padding: spacing.base,
    gap: spacing.md,
  },
});
