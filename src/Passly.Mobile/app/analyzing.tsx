import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, fontFamily, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector, useAppDispatch } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useGetChatImportsQuery, useUploadChatExportMutation } from '@/api/api';
import { useStepSync } from '@/hooks/use-step-sync';
import { WorkflowHeader } from '@/components/ui/AppHeader';
import type { ChatImportSummaryResponse } from '@/types';

const POLL_INTERVAL = 3000;
const MIN_DISPLAY_MS = 1000;

export default function AnalyzingScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const { uri, name, mimeType } = useLocalSearchParams<{
    uri: string;
    name: string;
    mimeType: string;
  }>();

  const dispatch = useAppDispatch();
  const activeSubmissionId = useAppSelector((s) => s.activeSubmission.id);
  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();

  useStepSync('AnalyzingChats');
  useEffect(() => { dispatch(reportStep(1)); }, [dispatch]);
  const [uploadChatExport] = useUploadChatExportMutation();
  const { shareIntent, resetShareIntent } = useShareIntent();

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const visibleSince = useRef(Date.now());

  // Poll for chat imports
  const { data: imports = [] } = useGetChatImportsQuery(
    { submissionId: activeSubmissionId ?? '' },
    {
      skip: !activeSubmissionId || !uploadedFileName,
      pollingInterval: POLL_INTERVAL,
    },
  );

  // --- Animations ---
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const rotation3 = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation1.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
    );
    rotation2.value = withRepeat(
      withTiming(360, { duration: 4500, easing: Easing.linear }),
      -1,
    );
    rotation3.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [rotation1, rotation2, rotation3, pulse]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation2.value}deg` }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation3.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // --- Upload logic ---
  const doUpload = useCallback(
    async (fileUri: string, fileName: string, fileMimeType: string) => {
      if (!passphrase || !activeSubmissionId) return;

      setUploadedFileName(fileName);
      setUploadError(null);

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      } else {
        formData.append('file', {
          uri: fileUri,
          name: fileName,
          type: fileMimeType,
        } as unknown as Blob);
      }
      formData.append('submissionId', activeSubmissionId);
      formData.append('passphrase', passphrase);

      try {
        await uploadChatExport(formData).unwrap();
      } catch (err: unknown) {
        let message = 'Upload failed';
        if (err instanceof Error) {
          message = err.message;
        } else if (err != null && typeof err === 'object' && 'data' in err) {
          const data = (err as { data: unknown }).data;
          if (data != null && typeof data === 'object' && 'error' in data) {
            message = String((data as { error: unknown }).error);
          }
        }
        setUploadError(message);
      }
    },
    [activeSubmissionId, passphrase, uploadChatExport],
  );

  // Redirect to settings if no passphrase
  useEffect(() => {
    if (passphraseLoaded && !passphrase) {
      router.replace('/settings');
    }
  }, [passphraseLoaded, passphrase, router]);

  // Handle file params from tutorial (DocumentPicker)
  useEffect(() => {
    if (hasStarted.current) return;
    if (!uri || !name || !passphrase || !activeSubmissionId) return;

    hasStarted.current = true;
    visibleSince.current = Date.now();
    doUpload(uri, name, mimeType ?? 'text/plain');
  }, [uri, name, mimeType, passphrase, activeSubmissionId, doUpload]);

  // Handle share intent
  useEffect(() => {
    if (hasStarted.current) return;
    if (!shareIntent?.files?.length) return;
    if (!passphrase || !activeSubmissionId) return;

    hasStarted.current = true;
    visibleSince.current = Date.now();

    const file = shareIntent.files[0];
    doUpload(file.path, file.fileName ?? 'shared-file.txt', file.mimeType ?? 'text/plain');
    resetShareIntent();
  }, [shareIntent, passphrase, activeSubmissionId, doUpload, resetShareIntent]);

  // Watch polling results for completion
  useEffect(() => {
    if (!uploadedFileName) return;

    const match = imports.find(
      (i: ChatImportSummaryResponse) => i.fileName === uploadedFileName,
    );
    if (!match) return;

    if (match.status === 'Parsed') {
      const elapsed = Date.now() - visibleSince.current;
      const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const timer = setTimeout(() => {
        router.replace({
          pathname: '/evidence-ready',
          params: { chatImportId: match.id },
        });
      }, delay);
      return () => clearTimeout(timer);
    }

    if (match.status === 'Failed') {
      Alert.alert('Processing Failed', 'The chat export could not be processed.', [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    }
  }, [imports, uploadedFileName, router]);

  // Upload error
  useEffect(() => {
    if (uploadError) {
      Alert.alert('Upload Error', uploadError, [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    }
  }, [uploadError, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <WorkflowHeader title="Analyzing" step={1} />
      <View style={styles.center}>
        {/* Animated rings + icon */}
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.ring, styles.ring1, { borderColor: t.primaryMuted }, ring1Style]} />
          <Animated.View style={[styles.ring, styles.ring2, { borderColor: t.primaryMuted }, ring2Style]} />
          <Animated.View style={[styles.ring, styles.ring3, { borderColor: t.primaryMuted }, ring3Style]} />

          {/* Orbit dots */}
          <Animated.View style={[styles.orbitDotContainer, styles.ring1, ring1Style]}>
            <View style={[styles.orbitDot, { backgroundColor: t.primary }]} />
          </Animated.View>
          <Animated.View style={[styles.orbitDotContainer, styles.ring2, ring2Style]}>
            <View style={[styles.orbitDot, styles.orbitDotSm, { backgroundColor: t.accent }]} />
          </Animated.View>
          <Animated.View style={[styles.orbitDotContainer, styles.ring3, ring3Style]}>
            <View style={[styles.orbitDot, styles.orbitDotLg, { backgroundColor: t.primary, opacity: 0.6 }]} />
          </Animated.View>

          {/* Center icon */}
          <Animated.View style={[styles.iconCircle, { backgroundColor: t.primaryMuted }, pulseStyle]}>
            <MaterialIcons name="description" size={36} color={t.primary} />
          </Animated.View>
        </View>

        <Text style={[styles.heading, { color: t.fg }]}>Analyzing Chats</Text>
        <Text style={[styles.subtext, { color: t.fg2 }]}>
          This may take a moment while we process your chat export.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const RING_1 = 120;
const RING_2 = 160;
const RING_3 = 200;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  animationContainer: {
    width: RING_3,
    height: RING_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: radius.full,
    borderStyle: 'dashed',
  },
  ring1: {
    width: RING_1,
    height: RING_1,
  },
  ring2: {
    width: RING_2,
    height: RING_2,
  },
  ring3: {
    width: RING_3,
    height: RING_3,
  },
  orbitDotContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -4,
  },
  orbitDotSm: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
  },
  orbitDotLg: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
