import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { C } from '../constants/colors';
import { fetchVerse } from '../lib/api';
import {
  fadeWord,
  isLearned,
  loadMemory,
  loadPracticeOnboarded,
  markLearned,
  markActive,
  markPracticeOnboarded,
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

  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatRef = useRef<FlatList<MemoryEntry>>(null);
  const [deck, setDeck] = useState<MemoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplainer, setShowExplainer] = useState(true);

  useEffect(() => {
    loadPracticeOnboarded().then((seen) => setShowExplainer(!seen));
  }, []);

  const dismissExplainer = () => {
    if (!showExplainer) return;
    setShowExplainer(false);
    markPracticeOnboarded();
  };

  const advanceOrExit = (idx: number) => {
    // Try to move to the next still-in-deck verse; if we're at the end,
    // fall back to the previous; if the deck is empty after the change,
    // close the screen.
    const nextIdx = idx + 1 < deck.length ? idx + 1 : idx > 0 ? idx - 1 : -1;
    if (nextIdx < 0) {
      router.back();
      return;
    }
    setCurrentIndex(nextIdx);
    requestAnimationFrame(() => {
      flatRef.current?.scrollToIndex({ index: nextIdx, animated: true });
    });
  };

  const onMarkLearned = async (entry: MemoryEntry) => {
    const next = await markLearned(entry.book, entry.verseRef);
    const list = memoryList(next);
    setDeck(list);
    // The just-learned verse stays in the deck array (we still show learned
    // entries when Library tab brings them up), but practice screen only
    // shows whatever was loaded — for v1 of this feature we just advance.
    advanceOrExit(currentIndex);
  };

  const onMarkActive = async (entry: MemoryEntry) => {
    const next = await markActive(entry.book, entry.verseRef);
    setDeck(memoryList(next));
  };

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
          renderItem={({ item }) => (
            <VerseCard
              entry={item}
              width={width}
              showExplainer={showExplainer}
              onFirstLongPress={dismissExplainer}
              onMarkLearned={() => onMarkLearned(item)}
              onMarkActive={() => onMarkActive(item)}
            />
          )}
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

function VerseCard({
  entry,
  width,
  showExplainer,
  onFirstLongPress,
  onMarkLearned,
  onMarkActive,
}: {
  entry: MemoryEntry;
  width: number;
  showExplainer: boolean;
  onFirstLongPress: () => void;
  onMarkLearned: () => void;
  onMarkActive: () => void;
}) {
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
    onFirstLongPress();
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

      {showExplainer && (
        <View style={styles.howRow}>
          <Text style={styles.howText}>
            <Text style={styles.howBold}>Tap</Text> a word to peek ·{' '}
            <Text style={styles.howBold}>Hold</Text> when you know it ·{' '}
            <Text style={styles.howBold}>Swipe</Text> for the next verse
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        {loading && <ActivityIndicator color={C.yellow} size="large" style={styles.loader} />}
        {error && !loading && (
          <Text style={styles.errorText}>Could not load verse — check your connection.</Text>
        )}
        {text &&
          tokens.map((line, li) => (
            <View key={li} style={styles.line}>
              {line.map((tok) => {
                const isGotIt = gotIt.has(tok.index);
                const isRevealed = revealed.has(tok.index);
                const rendered =
                  isGotIt || isRevealed ? tok.word : fadeWord(tok.word, difficulty);
                const wordStyle = isGotIt
                  ? styles.wordTextGotIt
                  : isRevealed
                  ? styles.wordTextPeeked
                  : styles.wordText;
                return (
                  <Pressable
                    key={tok.index}
                    onPress={() => toggleRevealed(tok.index)}
                    onLongPress={() => toggleGotIt(tok.index)}
                    style={styles.wordHit}
                    hitSlop={4}
                  >
                    <Text style={wordStyle}>{rendered}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        {text && (
          <View style={styles.actionsRow}>
            {isLearned(entry) ? (
              <Pressable onPress={onMarkActive} style={styles.actionBtnSecondary}>
                <Text style={styles.actionBtnSecondaryText}>
                  ↺ Practise this one again
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={onMarkLearned} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>✓ Know by heart</Text>
              </Pressable>
            )}
          </View>
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
  body: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 40 },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  wordHit: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  wordText: {
    fontSize: 20,
    lineHeight: 26,
    color: C.offWhite,
    fontWeight: '300',
  },
  wordTextPeeked: {
    fontSize: 20,
    lineHeight: 26,
    color: C.yellow,
    fontWeight: '500',
  },
  wordTextGotIt: {
    fontSize: 20,
    lineHeight: 26,
    color: C.textSecondary,
    fontWeight: '300',
  },
  errorText: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  howRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  howText: {
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  howBold: { color: C.offWhite, fontWeight: '700' },
  actionsRow: {
    marginTop: 32,
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: C.done,
  },
  actionBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionBtnSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  actionBtnSecondaryText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
