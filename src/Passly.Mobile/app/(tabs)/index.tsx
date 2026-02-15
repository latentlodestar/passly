import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Stepper } from '@/components/ui/Stepper';

const processSteps = [
  { label: 'Get started' },
  { label: 'Import evidence' },
  { label: 'Review' },
];

const features = [
  {
    icon: '\u{1F4CB}',
    title: 'Guided preparation',
    description:
      'Step-by-step guidance through every section of your petition.',
  },
  {
    icon: '\u{1F50D}',
    title: 'Evidence analysis',
    description:
      'Import your communication history and surface the signals that matter.',
  },
  {
    icon: '\u2705',
    title: 'Gap identification',
    description:
      'See exactly what documentation is missing before you submit.',
  },
];

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
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={0} />
        </View>

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
              onPress={() => router.push('/(tabs)/evidence')}
            />
            <Button
              label="View checklist"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(tabs)/checklist')}
            />
          </View>
        </View>

        <View style={styles.features}>
          {features.map((f) => (
            <Card key={f.title}>
              <CardBody>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={[styles.featureTitle, { color: t.fg }]}>
                  {f.title}
                </Text>
                <Text style={[styles.featureDesc, { color: t.fg2 }]}>
                  {f.description}
                </Text>
              </CardBody>
            </Card>
          ))}
        </View>
      </ScrollView>
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
  stepperWrap: {
    paddingHorizontal: spacing.sm,
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
  features: {
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
