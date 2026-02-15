import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
}

export function TextField({ label, helper, error, style, ...props }: TextFieldProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={t.muted}
        style={[
          styles.input,
          {
            backgroundColor: t.surface,
            color: t.fg,
            borderColor: hasError ? t.danger : t.border,
          },
          style,
        ]}
        {...props}
      />
      {(helper || error) && (
        <Text
          style={[
            styles.helper,
            { color: hasError ? t.dangerText : t.muted },
          ]}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: fontSize.base,
  },
  helper: {
    fontSize: fontSize.xs,
  },
});
