import { ScrollView, StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useCallback, useState, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useShareIntent } from 'expo-share-intent';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeviceId } from '@/hooks/use-device-id';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useGetChatImportsQuery, useUploadChatExportMutation } from '@/api/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Stepper, ProgressBar } from '@/components/ui/Stepper';
import { SettingsFab } from '@/components/ui/AppHeader';
import type { ChatImportSummaryResponse } from '@/types';

const processSteps = [
  { label: 'Get started' },
  { label: 'Import evidence' },
  { label: 'Review' },
];

type LocalUpload = {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
};

function statusToBadge(status: string): { variant: 'success' | 'danger' | 'warning'; label: string } {
  switch (status) {
    case 'Parsed':
      return { variant: 'success', label: 'Processed' };
    case 'Failed':
      return { variant: 'danger', label: 'Error' };
    default:
      return { variant: 'warning', label: 'Processing' };
  }
}

export default function EvidenceScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  const deviceId = useDeviceId();
  const { passphrase, isLoaded: passphraseLoaded } = usePassphrase();
  const [shouldPoll, setShouldPoll] = useState(false);
  const { data: imports = [], isLoading } = useGetChatImportsQuery(deviceId ?? '', {
    skip: !deviceId,
    pollingInterval: shouldPoll ? 3000 : 0,
  });
  const [uploadChatExport] = useUploadChatExportMutation();
  const [localUploads, setLocalUploads] = useState<Record<string, LocalUpload>>({});

  useEffect(() => {
    const hasInProgress = imports.some(
      (i: ChatImportSummaryResponse) => i.status !== 'Parsed' && i.status !== 'Failed'
    );
    setShouldPoll(hasInProgress);
  }, [imports]);
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef<View>(null);
  const { shareIntent, resetShareIntent } = useShareIntent();

  const uploadFile = useCallback(async (fileUri: string, fileName: string, mimeType: string) => {
    if (!deviceId || !passphrase) return;

    const uploadKey = `${fileName}-${Date.now()}`;
    setLocalUploads((prev) => ({ ...prev, [uploadKey]: { fileName, status: 'uploading' } }));

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      } else {
        // React Native FormData expects { uri, name, type } for files
        formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);
      }

      formData.append('deviceId', deviceId);
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
  }, [deviceId, passphrase, uploadChatExport]);

  useEffect(() => {
    if (shareIntent?.files?.length) {
      for (const file of shareIntent.files) {
        uploadFile(file.path, file.fileName ?? 'shared-file.txt', file.mimeType ?? 'text/plain');
      }
      resetShareIntent();
    }
  }, [shareIntent, uploadFile, resetShareIntent]);

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
    const el = dropRef.current as unknown as HTMLElement | null;
    if (!el) return;

    const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragActive(true); };
    const onDragLeave = () => setDragActive(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer?.files.length) handleDrop(e.dataTransfer.files);
    };

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [handleDrop]);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'application/zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    if (!passphrase) {
      router.push('/settings');
      return;
    }

    const asset = result.assets[0];
    await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'text/plain');
  };

  // Remove local uploads once the server knows about them (match by fileName)
  const serverFileNames = new Set(imports.map((imp: ChatImportSummaryResponse) => imp.fileName));

  const localBadge = (u: LocalUpload): { variant: 'success' | 'danger' | 'warning'; label: string } => {
    switch (u.status) {
      case 'uploading': return { variant: 'warning', label: 'Uploading' };
      case 'success':   return { variant: 'warning', label: 'Processing' };
      case 'error':     return { variant: 'danger',  label: 'Error' };
    }
  };

  const allFiles: { id: string; name: string; badge: { variant: 'success' | 'danger' | 'warning'; label: string }; error?: string }[] = [
    ...imports.map((imp: ChatImportSummaryResponse) => ({
      id: imp.id,
      name: imp.fileName,
      badge: statusToBadge(imp.status),
    })),
    ...Object.entries(localUploads)
      .filter(([, u]) => !serverFileNames.has(u.fileName))
      .map(([key, u]) => ({
        id: key,
        name: u.fileName,
        badge: localBadge(u),
        error: u.error,
      })),
  ];

  const doneCount = imports.filter((f: ChatImportSummaryResponse) => f.status === 'Parsed').length;
  const noPassphrase = passphraseLoaded && !passphrase;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepperWrap}>
          <Stepper steps={processSteps} currentStep={1} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.title, { color: t.fg }]}>Import evidence</Text>
          <Text style={[styles.subtitle, { color: t.fg2 }]}>
            Upload WhatsApp chat exports to analyze your communication timeline.
          </Text>
        </View>

        {noPassphrase && (
          <Alert variant="warning">
            Set an encryption passphrase in Settings before uploading files.
          </Alert>
        )}

        <Alert variant="info">
          To export a WhatsApp chat: open the chat, tap the contact name, select
          "Export Chat," then choose "Without Media."
        </Alert>

        <Pressable
          ref={dropRef as React.Ref<View>}
          onPress={handlePickFile}
          style={[
            styles.uploadArea,
            { borderColor: dragActive ? t.primary : t.borderStrong, backgroundColor: dragActive ? t.primaryMuted : t.surface },
          ]}
        >
          <Text style={styles.uploadIcon}>{'\u{1F4C1}'}</Text>
          <Text style={[styles.uploadTitle, { color: t.fg }]}>
            {dragActive ? 'Drop files here' : 'Tap or drop chat files here'}
          </Text>
          <Text style={[styles.uploadHint, { color: t.muted }]}>
            Accepts .txt and .zip files
          </Text>
        </Pressable>

        {allFiles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.fg }]}>
                Uploaded files
              </Text>
              <Text style={[styles.sectionMeta, { color: t.muted }]}>
                {doneCount} of {imports.length} processed
              </Text>
            </View>

            {imports.length > 0 && (
              <ProgressBar
                value={doneCount}
                max={imports.length}
                variant={doneCount === imports.length ? 'success' : 'primary'}
              />
            )}

            {allFiles.map((file) => (
              <Card key={file.id}>
                <CardBody>
                  <View style={styles.fileRow}>
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: t.fg }]}>
                        {file.name}
                      </Text>
                      {file.error && (
                        <Text style={[styles.fileMeta, { color: t.danger }]}>
                          {file.error}
                        </Text>
                      )}
                    </View>
                    <Badge variant={file.badge.variant}>
                      {file.badge.label}
                    </Badge>
                  </View>
                </CardBody>
              </Card>
            ))}

            <Button
              label="Continue to review"
              disabled={doneCount < imports.length || imports.length === 0}
              onPress={() => router.push('/checklist')}
            />
          </View>
        )}
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
    gap: spacing.lg,
  },
  stepperWrap: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionMeta: {
    fontSize: fontSize.sm,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  uploadHint: {
    fontSize: fontSize.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  fileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fileMeta: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
