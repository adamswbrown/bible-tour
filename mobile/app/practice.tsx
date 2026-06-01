import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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

const MODES: { id: FadeMode; label: string }[] = [
  { id: 'full', label: 'Full' },
  { id: 'initials', label: 'Initials' },
  { id: 'blanks', label: 'Blanks' },
];

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book: string; ref: string }>();
  const book = params.book ?? '';
  const refParam = params.ref ?? '';

  const [deck, setDeck] = useState<MemoryEntry[]>([]);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<FadeMode>('full');
  const [peeked, setPeeked] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadMemory().then((map) => setDeck(memoryList(map)));
  }, []);

  useEffect(() => {
    if (!book || !refParam) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setText(null);
    setMode('full');
    setPeeked(new Set());

    fetchVerse(book, refParam, 'esv')
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
  }, [book, refParam]);

  const currentIndex = deck.findIndex(
    (e) => e.book === book && e.verseRef === refParam,
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < deck.length - 1;

  const step = useCallback(
    (delta: number) => {
      const target = deck[currentIndex + delta];
      if (!target) return;
      router.setParams({ book: target.book, ref: target.verseRef });
    },
    [deck, currentIndex, router],
  );

  const togglePeek = (index: number) => {
    setPeeked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: `${book} ${refParam}` }} />
      <View style={styles.container}>
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => {
                setMode(m.id);
                setPeeked(new Set());
              }}
              style={[styles.modePill, mode === m.id && styles.modePillActive]}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === m.id && styles.modeTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loading && (
            <ActivityIndicator color={C.yellow} size="large" style={styles.loader} />
          )}
          {error && !loading && (
            <Text style={styles.errorText}>
              Could not load verse — check your connection.
            </Text>
          )}
          {text &&
            tokenizeVerse(text).map((line, li) => (
              <Text key={li} style={styles.line}>
                {line.map((tok, i) => {
                  const shown = mode === 'full' || peeked.has(tok.index);
                  const rendered = shown ? tok.word : fadeWord(tok.word, mode);
                  return (
                    <Text
                      key={tok.index}
                      onPress={() => togglePeek(tok.index)}
                      style={
                        shown && mode !== 'full' ? styles.peeked : undefined
                      }
                    >
                      {i > 0 ? ' ' : ''}
                      {rendered}
                    </Text>
                  );
                })}
              </Text>
            ))}
        </ScrollView>

        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => step(-1)}
            disabled={!hasPrev}
            style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
            accessibilityLabel="Previous verse"
          >
            <Text style={[styles.navBtnText, !hasPrev && styles.navBtnTextDisabled]}>
              ‹ Previous
            </Text>
          </TouchableOpacity>
          <Text style={styles.position}>
            {currentIndex >= 0 ? `${currentIndex + 1} / ${deck.length}` : ''}
          </Text>
          <TouchableOpacity
            onPress={() => step(1)}
            disabled={!hasNext}
            style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
            accessibilityLabel="Next verse"
          >
            <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>
              Next ›
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Close practice"
          hitSlop={12}
        >
          <Text style={styles.closeText}>Done</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.teal, paddingTop: 16 },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
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
  line: { fontSize: 19, lineHeight: 32, color: C.offWhite, fontWeight: '300', marginBottom: 8 },
  peeked: { color: C.yellow, fontWeight: '500' },
  errorText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 40 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontSize: 13, fontWeight: '700', color: C.yellow },
  navBtnTextDisabled: { color: C.textSecondary },
  position: { fontSize: 12, color: C.textSecondary, fontWeight: '600' },
  closeBtn: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 24,
  },
  closeText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
});
