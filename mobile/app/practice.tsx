import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/colors';
import { fetchVerse } from '../lib/api';
import {
  fadeWord,
  loadMemory,
  memoryList,
  tokenizeVerse,
  type FadeMode,
  type MemoryEntry,
} from '../lib/memory';

type Difficulty = Extract<FadeMode, 'initials' | 'blanks'>;

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'initials', label: 'Initials' },
  { id: 'blanks', label: 'Blanks' },
];

export default function PracticeScreen() {
  const params = useLocalSearchParams<{ book: string; ref: string }>();
  const initialBook = params.book ?? '';
  const initialRef = params.ref ?? '';

  const { width } = useWindowDimensions();
  const flatRef = useRef<FlatList<MemoryEntry>>(null);
  const [deck, setDeck] = useState<MemoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadMemory().then((m) => {
      if (cancelled) return;
      const list = memoryList(m);
      setDeck(list);
      const startIndex = list.findIndex(
        (e) => e.book === initialBook && e.verseRef === initialRef,
      );
      const safeIndex = startIndex >= 0 ? startIndex : 0;
      setCurrentIndex(safeIndex);
      if (safeIndex > 0) {
        requestAnimationFrame(() => {
          flatRef.current?.scrollToIndex({ index: safeIndex, animated: false });
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialBook, initialRef]);

  const currentEntry = deck[currentIndex];
  const title = currentEntry ? `${currentEntry.book} ${currentEntry.verseRef}` : 'Practice';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View style={styles.container}>
        <PageDots count={deck.length} current={currentIndex} />
        <FlatList
          ref={flatRef}
          data={deck}
          keyExtractor={(e) => e.ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          initialNumToRender={1}
          windowSize={3}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            if (idx !== currentIndex) setCurrentIndex(idx);
          }}
          renderItem={({ item }) => <VerseCard entry={item} width={width} />}
        />
      </View>
    </>
  );
}

function PageDots({ count, current }: { count: number; current: number }) {
  if (count <= 1) return null;
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

function VerseCard({ entry, width }: { entry: MemoryEntry; width: number }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('initials');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [gotIt, setGotIt] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setText(null);

    fetchVerse(entry.book, entry.verseRef, 'esv')
      .then((res) => {
        if (cancelled) return;
        if (res.text) setText(res.text);
        else setError(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entry.book, entry.verseRef]);

  const tokens = useMemo(() => (text ? tokenizeVerse(text) : []), [text]);
  const totalTokens = useMemo(
    () => tokens.reduce((n, line) => n + line.length, 0),
    [tokens],
  );
  const complete = totalTokens > 0 && gotIt.size === totalTokens;

  const onDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    setRevealed(new Set());
  };

  const toggleRevealed = (i: number) => {
    if (gotIt.has(i)) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleGotIt = (i: number) => {
    setGotIt((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
        setRevealed((rprev) => {
          if (!rprev.has(i)) return rprev;
          const r = new Set(rprev);
          r.delete(i);
          return r;
        });
      }
      return next;
    });
  };

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.modeRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d.id}
            onPress={() => onDifficultyChange(d.id)}
            style={[styles.modePill, difficulty === d.id && styles.modePillActive]}
          >
            <Text style={[styles.modeText, difficulty === d.id && styles.modeTextActive]}>
              {d.label}
              {difficulty === d.id && complete ? '  ✓' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading && <ActivityIndicator color={C.yellow} size="large" style={styles.loader} />}
        {error && !loading && (
          <Text style={styles.errorText}>Could not load verse — check your connection.</Text>
        )}
        {text &&
          tokens.map((line, li) => (
            <Text key={li} style={styles.line}>
              {line.map((tok, i) => {
                const isGotIt = gotIt.has(tok.index);
                const isRevealed = revealed.has(tok.index);
                const rendered =
                  isGotIt || isRevealed ? tok.word : fadeWord(tok.word, difficulty);
                const wordStyle = isGotIt
                  ? styles.gotIt
                  : isRevealed
                  ? styles.peeked
                  : undefined;
                return (
                  <Text
                    key={tok.index}
                    onPress={() => toggleRevealed(tok.index)}
                    onLongPress={() => toggleGotIt(tok.index)}
                    style={wordStyle}
                  >
                    {i > 0 ? ' ' : ''}
                    {rendered}
                  </Text>
                );
              })}
            </Text>
          ))}
        {text && (
          <Text style={styles.hint}>Tap a word to peek. Long-press once you know it.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.teal },
  card: { flex: 1, paddingTop: 4 },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.yellow },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  modePillActive: { backgroundColor: C.yellow, borderColor: C.yellow },
  modeText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  modeTextActive: { color: C.tealDark },
  body: { padding: 20, paddingBottom: 40 },
  loader: { marginTop: 40 },
  line: {
    fontSize: 19,
    lineHeight: 32,
    color: C.offWhite,
    fontWeight: '300',
    marginBottom: 8,
  },
  peeked: { color: C.yellow, fontWeight: '500' },
  gotIt: { color: C.textSecondary, fontWeight: '300' },
  errorText: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  hint: {
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 32,
    fontStyle: 'italic',
  },
});
