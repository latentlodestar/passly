import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius, borderWidth, fontFamily } from '@/constants/design-tokens';
import { stepToRoute } from '@/constants/steps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveSubmission, clearActiveSubmission } from '@/store/active-submission-slice';
import { getIdToken } from '@/auth/cognito';
import {
  useCreateSubmissionMutation,
  useGetSubmissionsQuery,
  useDeleteSubmissionMutation,
  api,
} from '@/api/api';
import { Button } from '@/components/ui/Button';
import type { SubmissionResponse } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5192';

// ---- PetitionRow ----

type PetitionRowProps = {
  sub: SubmissionResponse;
  isLast: boolean;
  onResume: (sub: SubmissionResponse) => void;
  onDelete: (sub: SubmissionResponse) => void;
};

function PetitionRow({ sub, isLast, onResume, onDelete }: PetitionRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const { passphrase } = usePassphrase();
  const swipeRef = useRef<Swipeable>(null);

  const handleDownloadPdf = async () => {
    swipeRef.current?.close();
    if (!passphrase) return;
    const token = await getIdToken();
    const url =
      `${API_BASE_URL}/api/submissions/${sub.id}/summary/download` +
      `?passphrase=${encodeURIComponent(passphrase)}` +
      (token ? `&token=${encodeURIComponent(token)}` : '');
    await WebBrowser.openBrowserAsync(url);
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(sub);
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      {sub.hasPdf && (
        <Pressable
          onPress={handleDownloadPdf}
          style={[styles.swipeAction, { backgroundColor: t.btnPrimary }]}
        >
          <MaterialIcons name="picture-as-pdf" size={20} color={t.primaryFg} />
          <Text style={[styles.swipeActionLabel, { color: t.primaryFg }]}>PDF</Text>
        </Pressable>
      )}
      <Pressable
        onPress={handleDelete}
        style={[styles.swipeAction, { backgroundColor: t.danger }]}
      >
        <MaterialIcons name="delete-outline" size={20} color={t.dangerFg} />
        <Text style={[styles.swipeActionLabel, { color: t.dangerFg }]}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPress={() => onResume(sub)}
        style={({ pressed }) => [
          styles.petitionRow,
          {
            backgroundColor: pressed ? t.surface2 : t.surface,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: t.border,
          },
        ]}
      >
        <View style={styles.petitionInfo}>
          <Text style={[styles.petitionLabel, { color: t.fg }]}>{sub.label}</Text>
          <Text style={[styles.petitionMeta, { color: t.muted }]}>
            {sub.status} · {new Date(sub.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={t.muted} />
      </Pressable>
    </Swipeable>
  );
}

// ---- HomeScreen ----

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.activeSubmission.id);

  const [createSubmission, { isLoading: isCreating }] =
    useCreateSubmissionMutation();
  const [deleteSubmission] = useDeleteSubmissionMutation();

  const { data: submissions = [], isLoading } = useGetSubmissionsQuery();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const showLoading = isLoading || !minTimeElapsed;
  const isNewUser = submissions.length === 0;

  const handleGetStarted = async () => {
    const result = await createSubmission({
      label: `Petition ${new Date().toLocaleDateString()}`,
    }).unwrap();
    dispatch(setActiveSubmission(result.id));
    router.push('/tutorial');
  };

  const [fetchImports] = api.endpoints.getChatImports.useLazyQuery();

  const handleResume = async (sub: SubmissionResponse) => {
    dispatch(setActiveSubmission(sub.id));

    let route = stepToRoute(sub.currentStep);

    // For evidence-related steps, verify imports exist
    if (route === '/evidence' || route === '/evidence-ready') {
      const { data: imports = [] } = await fetchImports({ submissionId: sub.id });
      if (imports.length === 0) {
        router.push('/tutorial');
        return;
      }
      // evidence-ready needs the chatImportId param
      if (route === '/evidence-ready') {
        const parsed = imports.find((i: { status: string }) => i.status === 'Parsed');
        if (parsed) {
          router.push({ pathname: '/evidence-ready', params: { chatImportId: parsed.id } });
        } else {
          router.push('/evidence');
        }
        return;
      }
    }

    router.push(route as '/evidence');
  };

  const handleDelete = (sub: SubmissionResponse) => {
    Alert.alert(
      'Delete petition',
      `Are you sure you want to delete "${sub.label}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSubmission({ id: sub.id });
            if (sub.id === activeId) {
              dispatch(clearActiveSubmission());
            }
          },
        },
      ],
    );
  };

  if (showLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.btnPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <MaterialIcons name="chat-bubble-outline" size={64} color={t.btnPrimary} />
          <Text style={[styles.heroTitle, { color: t.fg }]}>
            Let's Turn Your Memories{'\n'}Into Evidence
          </Text>
          {isNewUser && (
            <>
              <Text style={[styles.heroSubtitle, { color: t.fg2 }]}>
                We'll walk you through how to share your WhatsApp chat directly
                with the app so it will automatically appear here.
              </Text>
              <Text style={[styles.heroSubtitle, { color: t.fg2 }]}>
                Passly will handle the rest and create a sampled history of your
                relationship chat that's ready for you to submit with your Visa
                case as a PDF USCIS-ready filing.
              </Text>
            </>
          )}
          <View style={styles.actions}>
            <Button
              label={isCreating ? 'Creating...' : isNewUser ? 'Get Started' : 'Create petition'}
              size="lg"
              onPress={handleGetStarted}
              disabled={isCreating}
            />
          </View>
        </View>

        {!isNewUser && (
          <View style={styles.petitionsSection}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>YOUR PETITIONS</Text>
            <View style={[styles.petitionList, { borderColor: t.borderAccent, backgroundColor: t.surface }]}>
              {submissions.map((sub, index) => (
                <PetitionRow
                  key={sub.id}
                  sub={sub}
                  isLast={index === submissions.length - 1}
                  onResume={handleResume}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: fontFamily.display,
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
  petitionsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
    marginLeft: spacing.sm,
  },
  petitionList: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.accent,
    overflow: 'hidden',
  },
  petitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  petitionInfo: {
    flex: 1,
    gap: 3,
  },
  petitionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  petitionMeta: {
    fontSize: fontSize.xs,
  },
  swipeActions: {
    flexDirection: 'row',
  },
  swipeAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
