import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, SectionList, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { C } from '../../constants/colors';
import {
  loadMemory,
  memoryList,
  memoryCount,
  removeVerse,
  toggleVerse,
  pickRandomVerse,
  isSaved,
  type MemoryEntry,
  type MemoryMap,
} from '../../lib/memory';
import { librarySections, LIBRARY_TOTAL } from '../../lib/library';

type Segment = 'deck' | 'library';

export default function MemoryTab() {
  const [segment, setSegment] = useState<Segment>('deck');
  const [map, setMap] = useState<MemoryMap>({});
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string }>();

  const entries = useMemo(() => memoryList(map), [map]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadMemory().then((next) => {
        if (cancelled) return;
        setMap(next);

        if (params.autoplay === '1') {
          router.setParams({ autoplay: undefined });
          const pick = pickRandomVerse(next);
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
    setMap(next);
  };

  const onToggleLibrary = async (book: string, verseRef: string) => {
    const next = await toggleVerse(book, verseRef);
    setMap(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentRow}>
        <SegmentButton label="Deck" active={segment === 'deck'} onPress={() => setSegment('deck')} />
        <SegmentButton label="Library" active={segment === 'library'} onPress={() => setSegment('library')} />
      </View>
      {segment === 'deck' ? (
        <DeckPanel entries={entries} onOpen={onOpen} onDelete={onDelete} />
      ) : (
        <LibraryPanel map={map} onToggle={onToggleLibrary} />
      )}
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function DeckPanel({
  entries,
  onOpen,
  onDelete,
}: {
  entries: MemoryEntry[];
  onOpen: (e: MemoryEntry) => void;
  onDelete: (e: MemoryEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <View style={[styles.panel, styles.empty]}>
        <Text style={styles.emptyTitle}>No verses yet</Text>
        <Text style={styles.emptyText}>
          Tap the ☆ in the verse reader, or pick from the Library above.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.panel}>
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

type LibraryRowItem = { book: string; ref: string };

function LibraryPanel({
  map,
  onToggle,
}: {
  map: MemoryMap;
  onToggle: (b: string, r: string) => void;
}) {
  const sections = useMemo(
    () =>
      librarySections().map((s) => ({
        title: s.title,
        data: s.data.flatMap<LibraryRowItem>((book) =>
          book.refs.map((ref) => ({ book: book.book, ref })),
        ),
      })),
    [],
  );
  const savedCount = memoryCount(map);

  return (
    <SectionList<LibraryRowItem, { title: string }>
      sections={sections}
      keyExtractor={(item) => `${item.book} ${item.ref}`}
      stickySectionHeadersEnabled
      style={styles.panel}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{section.title.toUpperCase()}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const prev = index > 0 ? section.data[index - 1] : null;
        const showBookHeader = !prev || prev.book !== item.book;
        const saved = isSaved(map, item.book, item.ref);
        return (
          <View>
            {showBookHeader && <Text style={styles.bookHeader}>{item.book}</Text>}
            <Pressable
              onPress={() => onToggle(item.book, item.ref)}
              style={styles.libraryRow}
              accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${item.book} ${item.ref}`}
            >
              <Text style={styles.libraryRef}>{item.ref}</Text>
              <Text style={[styles.starGlyph, saved && styles.starGlyphSaved]}>
                {saved ? '★' : '☆'}
              </Text>
            </Pressable>
          </View>
        );
      }}
      ListFooterComponent={
        <Text style={styles.libraryFooter}>
          Saved {savedCount} of {LIBRARY_TOTAL}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.teal },
  panel: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.yellow, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: C.tealDark,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  segmentBtnActive: { backgroundColor: C.yellow, borderColor: C.yellow },
  segmentText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  segmentTextActive: { color: C.tealDark },
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: C.tealDark,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 1.2,
  },
  bookHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: C.yellow,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: C.teal,
  },
  libraryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: C.teal,
  },
  libraryRef: { fontSize: 15, color: C.offWhite },
  starGlyph: { fontSize: 18, color: C.textSecondary },
  starGlyphSaved: { color: C.yellow },
  libraryFooter: {
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
});
