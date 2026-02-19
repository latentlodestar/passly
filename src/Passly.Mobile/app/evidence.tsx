import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useCallback, useState, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useShareIntent } from 'expo-share-intent';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { reportStep } from '@/store/progress-slice';
import { useDeviceId } from '@/hooks/use-device-id';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useStepSync } from '@/hooks/use-step-sync';
import { useGetChatImportsQuery, useUploadChatExportMutation } from '@/api/api';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import type { ChatImportSummaryResponse } from '@/types';

const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Summary' },
];

type LocalUpload = {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
};

type FileItem = {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'processed' | 'failed';
  error?: string;
  isLocal: boolean;
};

function mapServerStatus(status: string): FileItem['status'] {
  switch (status) {
    case 'Parsed': return 'processed';
    case 'Failed': return 'failed';
    default: return 'processing';
  }
}

function mapLocalStatus(status: LocalUpload['status']): FileItem['status'] {
  switch (status) {
    case 'uploading': return 'uploading';
    case 'success': return 'processing';
    case 'error': return 'failed';
  }
}

/* ------------------------------------------------------------------ */
/*  BottomSheet                                                        */
/* ------------------------------------------------------------------ */

function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <Pressable style={sheetStyles.backdrop} onPress={onClose} />
        <View
          style={[
            sheetStyles.content,
            {
              backgroundColor: t.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={[sheetStyles.handle, { backgroundColor: t.borderStrong }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
});

/* ------------------------------------------------------------------ */
/*  FileRow                                                            */
/* ------------------------------------------------------------------ */

function FileRow({
  file,
  borderColor,
  onDelete,
  onPress,
}: {
  file: FileItem;
  borderColor: string;
  onDelete: () => void;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  const isProcessed = file.status === 'processed';
  const isFailed = file.status === 'failed';
  const isInProgress = file.status === 'uploading' || file.status === 'processing';

  const statusLabel = file.status === 'uploading' ? 'Uploading\u2026' : 'Processing\u2026';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        rowStyles.row,
        { borderBottomColor: borderColor },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      {/* Left status icon */}
      {isInProgress ? (
        <ActivityIndicator
          size={18}
          color={file.status === 'uploading' ? t.muted : t.warningText}
          style={rowStyles.statusIcon}
        />
      ) : (
        <MaterialIcons
          name={isProcessed ? 'check-circle' : 'error'}
          size={20}
          color={isProcessed ? t.successText : t.dangerText}
          style={[rowStyles.statusIcon, isProcessed && rowStyles.iconSettled]}
        />
      )}

      {/* Content */}
      <View style={rowStyles.content}>
        <Text
          style={[rowStyles.name, { color: isProcessed ? t.muted : t.fg }]}
          numberOfLines={1}
        >
          {file.name}
        </Text>
        {isInProgress && (
          <Text style={[rowStyles.subtitle, { color: t.muted }]}>
            {statusLabel}
          </Text>
        )}
        {isFailed && file.error && (
          <Text style={[rowStyles.subtitle, { color: t.dangerText }]} numberOfLines={1}>
            {file.error}
          </Text>
        )}
      </View>

      {/* Right affordance */}
      {isProcessed && (
        <MaterialIcons name="chevron-right" size={20} color={t.muted} />
      )}
      {isFailed && (
        <Pressable onPress={onDelete} hitSlop={12} style={rowStyles.deleteBtn}>
          <MaterialIcons name="close" size={18} color={t.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  statusIcon: {
    width: 20,
  },
  iconSettled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  subtitle: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
});

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export default function EvidenceScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const maxReachedStep = useAppSelector((s) => s.progress.maxReachedStep);

  useEffect(() => { dispatch(reportStep(0)); }, [dispatch]);
  useStepSync('ImportEvidence');

  const deviceId = useDeviceId();
  const activeSubmissionId = useAppSelector((s) => s.activeSubmission.id);
  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();
  const [shouldPoll, setShouldPoll] = useState(false);
  const { data: imports = [] } = useGetChatImportsQuery(
    { deviceId: deviceId ?? '', submissionId: activeSubmissionId ?? '' },
    {
      skip: !deviceId || !activeSubmissionId,
      pollingInterval: shouldPoll ? 3000 : 0,
    },
  );
  const [uploadChatExport] = useUploadChatExportMutation();
  const [localUploads, setLocalUploads] = useState<Record<string, LocalUpload>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [howToVisible, setHowToVisible] = useState(false);

  useEffect(() => {
    const hasInProgress = imports.some(
      (i: ChatImportSummaryResponse) => i.status !== 'Parsed' && i.status !== 'Failed'
    );
    setShouldPoll(hasInProgress);
  }, [imports]);

  const containerRef = useRef<View>(null);
  const { shareIntent, resetShareIntent } = useShareIntent();

  /* ---- Upload ---- */

  const uploadFile = useCallback(async (fileUri: string, fileName: string, mimeType: string) => {
    if (!deviceId || !passphrase || !activeSubmissionId) return;

    const uploadKey = `${fileName}-${Date.now()}`;
    setLocalUploads((prev) => ({ ...prev, [uploadKey]: { fileName, status: 'uploading' } }));

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      } else {
        formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);
      }

      formData.append('deviceId', deviceId);
      formData.append('submissionId', activeSubmissionId);
      formData.append('passphrase', passphrase);

      await uploadChatExport(formData).unwrap();
      setLocalUploads((prev) => ({ ...prev, [uploadKey]: { fileName, status: 'success' } }));
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
      setLocalUploads((prev) => ({
        ...prev,
        [uploadKey]: { fileName, status: 'error', error: message },
      }));
    }
  }, [deviceId, activeSubmissionId, passphrase, uploadChatExport]);

  /* ---- Share intent ---- */

  useEffect(() => {
    if (shareIntent?.files?.length) {
      for (const file of shareIntent.files) {
        uploadFile(file.path, file.fileName ?? 'shared-file.txt', file.mimeType ?? 'text/plain');
      }
      resetShareIntent();
    }
  }, [shareIntent, uploadFile, resetShareIntent]);

  /* ---- Web drag-and-drop (invisible, on container) ---- */

  const handleDrop = useCallback(async (files: FileList) => {
    if (!passphrase) {
      router.push('/settings');
      return;
    }
    for (const file of Array.from(files)) {
      const uri = URL.createObjectURL(file);
      await uploadFile(uri, file.name, file.type || 'text/plain');
    }
  }, [passphrase, router, uploadFile]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = containerRef.current as unknown as HTMLElement | null;
    if (!el) return;

    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files.length) handleDrop(e.dataTransfer.files);
    };

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };
  }, [handleDrop]);

  /* ---- File picking ---- */

  const pickFile = useCallback(async (types: string[]) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: types,
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    if (!passphrase) {
      router.push('/settings');
      return;
    }

    const asset = result.assets[0];
    await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'text/plain');
  }, [passphrase, router, uploadFile]);


  /* ---- Delete ---- */

  const handleDelete = (file: FileItem) => {
    if (file.isLocal) {
      setLocalUploads((prev) => {
        const next = { ...prev };
        delete next[file.id];
        return next;
      });
    } else {
      setDeletedIds((prev) => new Set(prev).add(file.id));
    }
  };

  /* ---- FAB ---- */

  const handleFabPress = () => {
    if (!passphraseLoaded) return;
    if (!passphrase) {
      router.push('/settings');
      return;
    }
    pickFile(['text/plain', 'application/zip']);
  };

  /* ---- Derived state ---- */

  const serverFileNames = new Set(imports.map((imp: ChatImportSummaryResponse) => imp.fileName));

  const allFiles: FileItem[] = [
    ...imports
      .filter((imp: ChatImportSummaryResponse) => !deletedIds.has(imp.id))
      .map((imp: ChatImportSummaryResponse) => ({
        id: imp.id,
        name: imp.fileName,
        status: mapServerStatus(imp.status),
        isLocal: false,
      })),
    ...Object.entries(localUploads)
      .filter(([, u]) => !serverFileNames.has(u.fileName))
      .map(([key, u]) => ({
        id: key,
        name: u.fileName,
        status: mapLocalStatus(u.status),
        error: u.error,
        isLocal: true,
      })),
  ];

  const doneCount = imports.filter(
    (f: ChatImportSummaryResponse) => f.status === 'Parsed' && !deletedIds.has(f.id)
  ).length;
  const canContinue = doneCount > 0;
  const noPassphrase = passphraseLoaded && !passphrase;

  /* ---- Render ---- */

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>
      <View ref={containerRef as React.Ref<View>} style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepperWrap}>
            <Stepper
              steps={processSteps}
              currentStep={0}
              maxReachedStep={maxReachedStep}
              onStepPress={(i) => {
                const routes = ['/evidence', '/checklist', '/submit'] as const;
                router.push(routes[i]);
              }}
            />
          </View>

          {noPassphrase && (
            <Pressable onPress={() => router.push('/settings')} style={styles.warningRow}>
              <MaterialIcons name="lock-outline" size={16} color={t.warning} />
              <Text style={[styles.warningText, { color: t.fg2 }]}>
                Set up a passphrase in{' '}
                <Text style={{ color: t.primary }}>Settings</Text>
                {' '}to start uploading.
              </Text>
            </Pressable>
          )}

          {allFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={t.border} />
              <Text style={[styles.emptyTitle, { color: t.fg }]}>No files yet</Text>
              <Text style={[styles.emptySubtitle, { color: t.muted }]}>
                Tap{' '}
                <Text style={{ color: t.primary, fontWeight: fontWeight.semibold }}>Add evidence</Text>
                {' '}to import a chat export.
              </Text>
              <Pressable onPress={() => setHowToVisible(true)} style={styles.sheetLink}>
                <Text style={[styles.sheetLinkText, { color: t.primary }]}>
                  How to export from WhatsApp
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              {allFiles.map((file, index) => (
                <FileRow
                  key={file.id}
                  file={file}
                  borderColor={index < allFiles.length - 1 ? t.border : 'transparent'}
                  onDelete={() => handleDelete(file)}
                  onPress={
                    file.status === 'processed'
                      ? () => router.push({ pathname: '/import-detail', params: { id: file.id } })
                      : file.status === 'failed'
                        ? () => Alert.alert('Upload error', file.error ?? 'An unknown error occurred.')
                        : undefined
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Sticky bottom bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: t.bg,
              borderTopColor: t.border,
              paddingBottom: insets.bottom + spacing.base,
            },
          ]}
        >
          <View style={styles.bottomRow}>
            <Button
              label="Add evidence"
              variant="secondary"
              onPress={handleFabPress}
              style={styles.bottomRowBtn}
            />
            <Button
              label="Continue"
              disabled={!canContinue}
              onPress={() => router.push('/checklist')}
              style={styles.bottomRowBtn}
            />
          </View>
          <Button
            label="Save and exit"
            variant="ghost"
            onPress={() => router.replace('/')}
          />
        </View>
      </View>

      {/* How to export sheet */}
      <BottomSheet visible={howToVisible} onClose={() => setHowToVisible(false)}>
        <Text style={[styles.sheetTitle, { color: t.fg }]}>Export from WhatsApp</Text>

        {[
          'Open the chat in WhatsApp',
          'Tap the contact name at the top',
          'Scroll down and tap "Export Chat"',
          'Choose "Without Media"',
          'Save or share the .txt file',
        ].map((step, i) => (
          <View key={i} style={styles.instructionRow}>
            <Text style={[styles.instructionNum, { color: t.primary }]}>{i + 1}</Text>
            <Text style={[styles.instructionText, { color: t.fg2 }]}>{step}</Text>
          </View>
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
    gap: spacing.lg,
  },
  stepperWrap: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },

  /* Passphrase warning */
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['5xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
  },

  /* Sticky bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  bottomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomRowBtn: {
    flex: 1,
  },

  /* Sheet copy */
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  sheetLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sheetLinkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  /* Instructions */
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  instructionNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    width: 20,
    textAlign: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
