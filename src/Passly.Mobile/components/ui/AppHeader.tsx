import { Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadow } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SettingsFab() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [
        styles.fab,
        shadow.md,
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <MaterialIcons name="settings" size={22} color={t.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
