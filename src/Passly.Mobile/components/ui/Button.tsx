import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const bgMap: Record<ButtonVariant, string> = {
    primary: t.primary,
    secondary: t.surface2,
    ghost: 'transparent',
    danger: t.danger,
  };

  const fgMap: Record<ButtonVariant, string> = {
    primary: t.primaryFg,
    secondary: t.fg,
    ghost: t.fg2,
    danger: t.dangerFg,
  };

  const borderMap: Record<ButtonVariant, string> = {
    primary: 'transparent',
    secondary: t.border,
    ghost: 'transparent',
    danger: 'transparent',
  };

  const heightMap: Record<ButtonSize, number> = {
    sm: 36,
    md: 44,
    lg: 48,
  };

  const fontSizeMap: Record<ButtonSize, number> = {
    sm: fontSize.sm,
    md: fontSize.base,
    lg: fontSize.base,
  };

  const paddingMap: Record<ButtonSize, number> = {
    sm: spacing.md,
    md: spacing.base,
    lg: spacing.lg,
  };

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
          height: heightMap[size],
          paddingHorizontal: paddingMap[size],
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          {
            color: fgMap[variant],
            fontSize: fontSizeMap[size],
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  label: {
    fontWeight: fontWeight.semibold,
  },
});
