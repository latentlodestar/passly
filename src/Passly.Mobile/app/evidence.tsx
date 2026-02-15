import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Stepper, ProgressBar } from '@/components/ui/Stepper';
import { SettingsFab } from '@/components/ui/AppHeader';

const processSteps = [
  { label: 'Get started' },
  { label: 'Import evidence' },
  { label: 'Review' },
];

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'processing' | 'done' | 'error';
}

export default function EvidenceScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();

  const [files] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'WhatsApp Chat - Partner.txt',
      size: '2.4 MB',
      status: 'done',
    },
    {
      id: '2',
      name: 'WhatsApp Chat - Family Group.txt',
      size: '1.1 MB',
      status: 'processing',
    },
  ]);

  const doneCount = files.filter((f) => f.status === 'done').length;

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

        <Alert variant="info">
          To export a WhatsApp chat: open the chat, tap the contact name, select
          "Export Chat," then choose "Without Media."
        </Alert>

        <Pressable
          style={[
            styles.uploadArea,
            { borderColor: t.borderStrong, backgroundColor: t.surface },
          ]}
        >
          <Text style={styles.uploadIcon}>{'\u{1F4C1}'}</Text>
          <Text style={[styles.uploadTitle, { color: t.fg }]}>
            Tap to import chat files
          </Text>
          <Text style={[styles.uploadHint, { color: t.muted }]}>
            Accepts .txt and .zip files
          </Text>
        </Pressable>

        {files.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.fg }]}>
                Uploaded files
              </Text>
              <Text style={[styles.sectionMeta, { color: t.muted }]}>
                {doneCount} of {files.length} processed
              </Text>
            </View>

            <ProgressBar
              value={doneCount}
              max={files.length}
              variant={doneCount === files.length ? 'success' : 'primary'}
            />

            {files.map((file) => (
              <Card key={file.id}>
                <CardBody>
                  <View style={styles.fileRow}>
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: t.fg }]}>
                        {file.name}
                      </Text>
                      <Text style={[styles.fileMeta, { color: t.muted }]}>
                        {file.size}
                      </Text>
                    </View>
                    <Badge
                      variant={
                        file.status === 'done'
                          ? 'success'
                          : file.status === 'error'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {file.status === 'done'
                        ? 'Processed'
                        : file.status === 'error'
                          ? 'Error'
                          : 'Processing'}
                    </Badge>
                  </View>
                </CardBody>
              </Card>
            ))}

            <Button
              label="Continue to review"
              disabled={doneCount < files.length}
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
