import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function WorkflowHeader({ title }: { title: string }) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
      >
        <MaterialIcons name="chevron-left" size={28} color={t.fg} />
      </Pressable>
      <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
      <View style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  right: {
    width: 36,
  },
});
