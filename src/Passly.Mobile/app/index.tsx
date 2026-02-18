import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { SettingsFab } from '@/components/ui/AppHeader';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: t.fg }]}>
            Prepare your immigration petition with confidence
          </Text>
          <Text style={[styles.heroSubtitle, { color: t.fg2 }]}>
            Passly helps you structure your petition, analyze supporting
            evidence, and identify documentation gaps.
          </Text>

          <View style={styles.actions}>
            <Button
              label="Begin preparation"
              size="lg"
              onPress={() => router.push('/evidence')}
            />
            <Button
              label="View checklist"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/checklist')}
            />
          </View>
        </View>
      </ScrollView>
      <SettingsFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.base,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
});
