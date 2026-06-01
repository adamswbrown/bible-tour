import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { C } from '../../constants/colors';
import {
  loadMemory,
  memoryList,
  removeVerse,
  pickRandomVerse,
  type MemoryEntry,
} from '../../lib/memory';

export default function MemoryTab() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string }>();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadMemory().then((map) => {
        if (cancelled) return;
        setEntries(memoryList(map));

        if (params.autoplay === '1') {
          router.setParams({ autoplay: undefined });
          const pick = pickRandomVerse(map);
          if (pick) {
            router.push({
              pathname: '/practice',
              params: { book: pick.book, ref: pick.verseRef },
            });
          }
        }
      });
      return () => {
        cancelled = true;
      };
    }, [params.autoplay, router]),
  );

  const onOpen = (entry: MemoryEntry) => {
    router.push({
      pathname: '/practice',
      params: { book: entry.book, ref: entry.verseRef },
    });
  };

  const onDelete = async (entry: MemoryEntry) => {
    const next = await removeVerse(entry.book, entry.verseRef);
    setEntries(memoryList(next));
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyTitle}>No verses yet</Text>
        <Text style={styles.emptyText}>
          Tap the ☆ in the verse reader to save verses you want to memorise.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>
        {entries.length} {entries.length === 1 ? 'verse' : 'verses'} saved
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.ref}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => onDelete(item)}
                style={styles.deleteAction}
                accessibilityLabel={`Delete ${item.ref}`}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
          >
            <Pressable onPress={() => onOpen(item)} style={styles.row}>
              <Text style={styles.ref}>{item.ref}</Text>
              <Text style={styles.added}>
                {new Date(item.added).toLocaleDateString()}
              </Text>
            </Pressable>
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.teal },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.yellow, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  count: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: C.teal,
  },
  ref: { fontSize: 17, color: C.offWhite, fontWeight: '500' },
  added: { fontSize: 12, color: C.textSecondary },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 20 },
  deleteAction: {
    backgroundColor: '#b94a48',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteText: { color: C.white, fontWeight: '700' },
});
