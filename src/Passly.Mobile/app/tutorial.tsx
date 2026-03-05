import { useEffect, useState, useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, fontFamily, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useAppDispatch } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { WorkflowHeader } from '@/components/ui/AppHeader';

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
  const dispatch = useAppDispatch();
  const [hasWhatsApp, setHasWhatsApp] = useState<boolean | null>(null);
  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();

  useEffect(() => { dispatch(reportStep(0)); }, [dispatch]);

  useEffect(() => {
    Linking.canOpenURL('whatsapp://').then(setHasWhatsApp).catch(() => setHasWhatsApp(false));
  }, []);

  const handleImportFile = useCallback(async () => {
    // Check passphrase first
    if (passphraseLoaded && !passphrase) {
      router.push('/settings');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'application/zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    router.push({
      pathname: '/analyzing',
      params: {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'text/plain',
      },
    });
  }, [passphraseLoaded, passphrase, router]);

  const handleOpenWhatsApp = useCallback(() => {
    Linking.openURL('whatsapp://');
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <WorkflowHeader title="Instructions" step={0} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIcon}>
          <View style={[styles.heroCircle, { backgroundColor: t.primaryMuted }]}>
            <MaterialIcons
              name={hasWhatsApp === false ? 'description' : 'share'}
              size={48}
              color={t.primary}
            />
          </View>
        </View>

        {hasWhatsApp === false ? (
          <>
            <Text style={[styles.heading, { color: t.fg }]}>
              Import A Chat Export File
            </Text>
            <Text style={[styles.subheading, { color: t.fg2 }]}>
              WhatsApp wasn't detected on this device. You can still continue
              and import a previously exported chat file.
            </Text>
          </>
        ) : (
          <>
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
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {hasWhatsApp === false ? (
          <Pressable
            style={[styles.button, { backgroundColor: t.btnPrimary }]}
            onPress={handleImportFile}
          >
            <MaterialIcons name="file-upload" size={20} color={t.primaryFg} />
            <Text style={[styles.buttonText, { color: t.primaryFg }]}>
              Import Chat Export
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, { backgroundColor: t.btnPrimary }]}
            onPress={handleOpenWhatsApp}
          >
            <Text style={[styles.buttonText, { color: t.primaryFg }]}>
              Open WhatsApp
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  subheading: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
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
    flexDirection: 'row',
    paddingVertical: spacing.base,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
