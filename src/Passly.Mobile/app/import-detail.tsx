import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, spacing, fontSize, fontWeight, radius, type ColorScheme } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePassphrase } from '@/hooks/use-passphrase';
import { useGetChatImportMessagesQuery } from '@/api/api';
import { Badge } from '@/components/ui/Badge';
import type { ChatMessageResponse } from '@/types';

const PAGE_SIZE = 100;

/* ------------------------------------------------------------------ */
/*  MessageBubble                                                      */
/* ------------------------------------------------------------------ */

function MessageBubble({
  message,
  prevMessage,
  colors: t,
}: {
  message: ChatMessageResponse;
  prevMessage: ChatMessageResponse | undefined;
  colors: (typeof colors)[ColorScheme];
}) {
  const showSender = !prevMessage || prevMessage.senderName !== message.senderName;
  const showDateBreak = !prevMessage || !isSameDay(prevMessage.timestamp, message.timestamp);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const dateLabel = formatDateLabel(message.timestamp);

  return (
    <>
      {showDateBreak && (
        <View style={bubbleStyles.dateBadge}>
          <Text style={[bubbleStyles.dateBadgeText, { color: t.muted, backgroundColor: t.surface2 }]}>
            {dateLabel}
          </Text>
        </View>
      )}
      <View style={[bubbleStyles.row, showSender && bubbleStyles.rowWithSender]}>
        {showSender && (
          <Text style={[bubbleStyles.sender, { color: t.primary }]}>
            {message.senderName}
          </Text>
        )}
        <View style={[bubbleStyles.bubble, { backgroundColor: t.surface2 }]}>
          <Text style={[bubbleStyles.content, { color: t.fg }]}>
            {message.content}
          </Text>
          <Text style={[bubbleStyles.time, { color: t.muted }]}>{time}</Text>
        </View>
      </View>
    </>
  );
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateLabel(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const bubbleStyles = StyleSheet.create({
  dateBadge: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dateBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
  },
  rowWithSender: {
    paddingTop: spacing.sm,
  },
  sender: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
    paddingHorizontal: spacing.xs,
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  content: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    flexShrink: 1,
  },
  time: {
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 'auto',
  },
});

/* ------------------------------------------------------------------ */
/*  MetadataHeader                                                     */
/* ------------------------------------------------------------------ */

function MetadataHeader({
  fileName,
  status,
  totalMessages,
  createdAt,
  colors: t,
  onBack,
}: {
  fileName: string;
  status: string;
  totalMessages: number;
  createdAt: string;
  colors: (typeof colors)[ColorScheme];
  onBack: () => void;
}) {
  const badgeVariant = status === 'Parsed' ? 'success' : status === 'Failed' ? 'danger' : 'warning';
  const badgeLabel = status === 'Parsed' ? 'Processed' : status;
  const importDate = new Date(createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={[headerStyles.container, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
      <View style={headerStyles.topRow}>
        <Pressable onPress={onBack} hitSlop={12} style={headerStyles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={t.fg} />
        </Pressable>
        <View style={headerStyles.titleWrap}>
          <Text style={[headerStyles.fileName, { color: t.fg }]} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      </View>
      <View style={headerStyles.metaRow}>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        <Text style={[headerStyles.metaText, { color: t.muted }]}>
          {totalMessages.toLocaleString()} messages
        </Text>
        <Text style={[headerStyles.metaDot, { color: t.muted }]}>&middot;</Text>
        <Text style={[headerStyles.metaText, { color: t.muted }]}>
          {importDate}
        </Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  titleWrap: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  metaDot: {
    fontSize: fontSize.xs,
  },
});

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export default function ImportDetailScreen() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { passphrase } = usePassphrase();

  const [allMessages, setAllMessages] = useState<ChatMessageResponse[]>([]);
  const [page, setPage] = useState(0);
  const loadedPages = useRef(new Set<number>());

  const { data, isLoading, isFetching, isError } = useGetChatImportMessagesQuery(
    {
      id: id ?? '',
      passphrase: passphrase ?? '',
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    },
    { skip: !id || !passphrase },
  );

  // Append new pages as they arrive
  if (data?.messages && !loadedPages.current.has(page)) {
    loadedPages.current.add(page);
    setAllMessages((prev) => {
      const existing = new Set(prev.map((m) => m.id));
      const newMessages = data.messages.filter((m) => !existing.has(m.id));
      return [...prev, ...newMessages];
    });
  }

  const hasMore = data ? allMessages.length < data.totalMessages : false;

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((p) => p + 1);
    }
  }, [isFetching, hasMore]);

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessageResponse; index: number }) => (
      <MessageBubble
        message={item}
        prevMessage={index > 0 ? allMessages[index - 1] : undefined}
        colors={t}
      />
    ),
    [allMessages, t],
  );

  const keyExtractor = useCallback((item: ChatMessageResponse) => item.id, []);

  if (isLoading && allMessages.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={40} color={t.dangerText} />
          <Text style={[styles.errorText, { color: t.fg }]}>Failed to load messages</Text>
          <Pressable onPress={() => router.back()} style={styles.errorBack}>
            <Text style={{ color: t.primary, fontWeight: fontWeight.medium }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>
      <MetadataHeader
        fileName={data?.fileName ?? ''}
        status={data?.status ?? ''}
        totalMessages={data?.totalMessages ?? 0}
        createdAt={data?.createdAt ?? ''}
        colors={t}
        onBack={() => router.back()}
      />
      <FlatList
        data={allMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetching && hasMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={t.muted} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: t.muted }]}>No messages found</Text>
            </View>
          ) : null
        }
      />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  errorBack: {
    paddingVertical: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});
