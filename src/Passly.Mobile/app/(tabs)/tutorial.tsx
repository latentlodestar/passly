import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Step = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    icon: 'add-circle-outline',
    title: 'Create a petition',
    body: 'From the Home tab, tap "Create petition" to start. Each petition represents one immigration case.',
  },
  {
    icon: 'upload-file',
    title: 'Import your evidence',
    body: 'Export your WhatsApp chat history without media. Open the chat, tap the contact name, scroll to "Export Chat", and choose "Without Media". Then import the .txt file into Passly.',
  },
  {
    icon: 'analytics',
    title: 'Review the analysis',
    body: 'Passly analyzes your messages to extract key relationship signals — frequency, gaps, milestones, and tone. Review the summary to understand what your evidence shows.',
  },
  {
    icon: 'verified',
    title: 'Sign and generate your PDF',
    body: 'Draw your signature to attest the accuracy of the summary. Passly generates an encrypted, signed PDF ready to include in your petition package.',
  },
  {
    icon: 'download',
    title: 'Download your summary',
    body: 'Once the PDF is generated, download it from the Summary screen or swipe left on any petition in the Home tab.',
  },
  {
    icon: 'lock',
    title: 'Your passphrase protects everything',
    body: 'All uploaded evidence is encrypted with your passphrase. Set it once in Settings. It cannot be recovered, so store it somewhere safe.',
  },
];

export default function TutorialScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.fg }]}>How Passly works</Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            Follow these steps to build a structured, credible petition package.
          </Text>
        </View>

        <View style={styles.steps}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.iconWrap, { backgroundColor: t.primaryMuted }]}>
                  <MaterialIcons name={step.icon} size={22} color={t.primary} />
                </View>
                {index < steps.length - 1 && (
                  <View style={[styles.connector, { backgroundColor: t.border }]} />
                )}
              </View>
              <View style={[styles.stepContent, { borderColor: t.border, backgroundColor: t.surface }]}>
                <Text style={[styles.stepNumber, { color: t.muted }]}>Step {index + 1}</Text>
                <Text style={[styles.stepTitle, { color: t.fg }]}>{step.title}</Text>
                <Text style={[styles.stepBody, { color: t.fg2 }]}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.note, { backgroundColor: t.surface, borderColor: t.border }]}>
          <MaterialIcons name="info-outline" size={18} color={t.muted} />
          <Text style={[styles.noteText, { color: t.fg2 }]}>
            Passly is structured risk-reduction software, not legal advice. Always consult an immigration attorney for your specific situation.
          </Text>
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
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  steps: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  stepLeft: {
    alignItems: 'center',
    width: 44,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: spacing.base,
    marginVertical: spacing.xs,
  },
  stepContent: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  stepNumber: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  stepBody: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
