import { ActivityIndicator, StyleSheet } from 'react-native';

import { useGetStatusQuery } from '@/api/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const { data: status, isLoading, error } = useGetStatusQuery();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Passly</ThemedText>

      {isLoading && <ActivityIndicator size="large" style={styles.loader} />}

      {error && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Error</ThemedText>
          <ThemedText>
            {"status" in error ? `HTTP ${error.status}` : error.message}
          </ThemedText>
        </ThemedView>
      )}

      {status && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">API Status</ThemedText>
          <ThemedView style={styles.row}>
            <ThemedText type="defaultSemiBold">Version</ThemedText>
            <ThemedText>{status.version}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.row}>
            <ThemedText type="defaultSemiBold">Database</ThemedText>
            <ThemedText>{status.databaseConnected ? 'Connected' : 'Disconnected'}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.row}>
            <ThemedText type="defaultSemiBold">Timestamp</ThemedText>
            <ThemedText>{new Date(status.timestamp).toLocaleString()}</ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    gap: 16,
  },
  loader: {
    marginTop: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
