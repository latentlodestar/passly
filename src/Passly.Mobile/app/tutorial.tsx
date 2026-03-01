import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, fontFamily, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Instruction = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
};

const instructions: Instruction[] = [
  { icon: 'chat-bubble-outline', label: 'Open Chat In WhatsApp' },
  { icon: 'person-outline', label: 'Tap On The Users Name' },
  { icon: 'ios-share', label: 'Tap Export Chat' },
  { icon: 'share', label: 'Share To Passly' },
];

export default function TutorialScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="chevron-left" size={28} color={t.fg} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: t.fg }]}>INSTRUCTIONS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIcon}>
          <View style={[styles.heroCircle, { backgroundColor: t.primaryMuted }]}>
            <MaterialIcons name="share" size={48} color={t.primary} />
          </View>
        </View>

        <Text style={[styles.heading, { color: t.fg }]}>
          Follow The Instructions Below To Upload Your Chat To Passly
        </Text>

        <View style={styles.cards}>
          {instructions.map((item, index) => (
            <View
              key={index}
              style={[styles.card, { backgroundColor: t.surface }]}
            >
              <MaterialIcons name={item.icon} size={24} color={t.fg} />
              <Text style={[styles.cardText, { color: t.fg }]}>
                {index + 1}. {item.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.button, { backgroundColor: t.btnPrimary }]}
          onPress={() => router.push('/')}
        >
          <Text style={[styles.buttonText, { color: t.primaryFg }]}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topBarTitle: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  heroIcon: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  heroCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    lineHeight: 28,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.card,
  },
  cardText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  button: {
    paddingVertical: spacing.base,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
