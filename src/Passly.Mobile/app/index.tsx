import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { stepToRoute } from '@/constants/steps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveSubmission, clearActiveSubmission } from '@/store/active-submission-slice';
import {
  useCreateSubmissionMutation,
  useGetSubmissionsQuery,
  useDeleteSubmissionMutation,
} from '@/api/api';
import { Button } from '@/components/ui/Button';
import { SettingsFab } from '@/components/ui/AppHeader';
import type { SubmissionResponse } from '@/types';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.activeSubmission.id);
  const [modalVisible, setModalVisible] = useState(false);

  const [createSubmission, { isLoading: isCreating }] =
    useCreateSubmissionMutation();
  const [deleteSubmission] = useDeleteSubmissionMutation();

  const { data: submissions = [] } = useGetSubmissionsQuery();

  const handleCreate = async () => {
    const result = await createSubmission({
      label: `Petition ${new Date().toLocaleDateString()}`,
    }).unwrap();
    dispatch(setActiveSubmission(result.id));
    router.push('/evidence');
  };

  const handleResume = () => {
    if (submissions.length === 1) {
      const sub = submissions[0];
      dispatch(setActiveSubmission(sub.id));
      router.push(stepToRoute(sub.currentStep) as '/evidence');
    } else if (submissions.length > 1) {
      setModalVisible(true);
    }
  };

  const handleSelectPetition = (sub: SubmissionResponse) => {
    dispatch(setActiveSubmission(sub.id));
    setModalVisible(false);
    router.push(stepToRoute(sub.currentStep) as '/evidence');
  };

  const handleDeletePetition = (sub: SubmissionResponse) => {
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

  const renderPetitionRow = ({ item: sub }: { item: SubmissionResponse }) => (
    <View style={[styles.petitionRow, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.petitionInfo}>
        <Text style={[styles.petitionLabel, { color: t.fg }]}>{sub.label}</Text>
        <Text style={[styles.petitionMeta, { color: t.muted }]}>
          {sub.status} · {new Date(sub.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.petitionActions}>
        <Pressable
          onPress={() => handleDeletePetition(sub)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <MaterialIcons name="delete-outline" size={22} color={t.danger} />
        </Pressable>
        <Button
          label="Resume"
          size="sm"
          onPress={() => handleSelectPetition(sub)}
        />
      </View>
    </View>
  );

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
              label={isCreating ? 'Creating...' : 'Create petition'}
              size="lg"
              onPress={handleCreate}
              disabled={isCreating}
            />
            {submissions.length > 0 && (
              <Button
                label="Resume petition"
                variant="secondary"
                size="lg"
                onPress={handleResume}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: t.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.fg }]}>
                Select a petition
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <MaterialIcons name="close" size={24} color={t.muted} />
              </Pressable>
            </View>
            <FlatList
              data={submissions}
              keyExtractor={(item) => item.id}
              renderItem={renderPetitionRow}
              contentContainerStyle={styles.modalList}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    borderRadius: radius.xl,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  modalList: {
    padding: spacing.base,
    paddingTop: 0,
    gap: spacing.sm,
  },
  petitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  petitionInfo: {
    flex: 1,
    gap: 2,
  },
  petitionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  petitionMeta: {
    fontSize: fontSize.xs,
  },
  petitionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
