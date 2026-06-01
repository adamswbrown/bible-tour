import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/colors';
import { fetchVerse } from '../lib/api';
import { fadeWord, tokenizeVerse, type FadeMode } from '../lib/memory';

type Difficulty = Extract<FadeMode, 'initials' | 'blanks'>;

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'initials', label: 'Initials' },
  { id: 'blanks', label: 'Blanks' },
];

export default function PracticeScreen() {
  const params = useLocalSearchParams<{ book: string; ref: string }>();
  const book = params.book ?? '';
  const refParam = params.ref ?? '';

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>('initials');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [gotIt, setGotIt] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!book || !refParam) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setText(null);
    setDifficulty('initials');
    setRevealed(new Set());
    setGotIt(new Set());

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
    <>
      <Stack.Screen options={{ title: `${book} ${refParam}` }} />
      <View style={styles.container}>
        <View style={styles.modeRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => onDifficultyChange(d.id)}
              style={[styles.modePill, difficulty === d.id && styles.modePillActive]}
            >
              <Text
                style={[styles.modeText, difficulty === d.id && styles.modeTextActive]}
              >
                {d.label}
                {difficulty === d.id && complete ? '  ✓' : ''}
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
            <Text style={styles.hint}>
              Tap a word to peek. Long-press once you know it.
            </Text>
          )}
        </ScrollView>
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
