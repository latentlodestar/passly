import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAppearance, type Appearance } from '@/store/theme-slice';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

const options: { value: Appearance; label: string; icon: 'brightness-auto' | 'light-mode' | 'dark-mode' }[] = [
  { value: 'system', label: 'System', icon: 'brightness-auto' },
  { value: 'light', label: 'Light', icon: 'light-mode' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const appearance = useAppSelector((state) => state.theme.appearance);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.fg }]}>Settings</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <MaterialIcons name="close" size={24} color={t.muted} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Card>
          <CardHeader>Appearance</CardHeader>
          <CardBody>
            {options.map((option) => {
              const selected = appearance === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => dispatch(setAppearance(option.value))}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? t.primaryMuted : 'transparent',
                      borderColor: selected ? t.primary : t.border,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={20}
                    color={selected ? t.primary : t.muted}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: selected ? t.primary : t.fg,
                        fontWeight: selected ? fontWeight.semibold : fontWeight.normal,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected && (
                    <MaterialIcons
                      name="check"
                      size={18}
                      color={t.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </CardBody>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
