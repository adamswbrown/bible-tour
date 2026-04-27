import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { C } from '../constants/colors';
import { fetchVerse, fetchAudioUrl, type VerseResult } from '../lib/api';
import { TRANSLATIONS, getTranslation } from '../lib/translations';
import { toVerseId, hasStudy, getTokens, getEntry } from '../lib/study';
import StrongsVerse from '../components/StrongsVerse';
import LexiconDrawer from '../components/LexiconDrawer';
import AudioPlayer from '../components/AudioPlayer';

export default function VerseScreen() {
  const params = useLocalSearchParams<{
    book: string;
    ref: string;
    translation: string;
  }>();
  const book = params.book ?? '';
  const refParam = params.ref ?? '';
  const initialTranslation = params.translation ?? 'kjv';

  const [translation, setTranslation] = useState(initialTranslation);
  const [result, setResult] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studyMode, setStudyMode] = useState(false);
  const [activeStrong, setActiveStrong] = useState<string | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const verseId = useMemo(() => toVerseId(book, refParam), [book, refParam]);
  const studyAvailable = hasStudy(verseId);
  const tokens = studyAvailable ? getTokens(verseId) : null;

  const t = getTranslation(translation);
  const isKjv = t.id === 'kjv';

  useEffect(() => {
    if (!book || !refParam) return;
    setLoading(true);
    setError(null);
    setResult(null);

    fetchVerse(book, refParam, translation)
      .then(setResult)
      .catch((e) => setError(e.message ?? 'unknown'))
      .finally(() => setLoading(false));
  }, [book, refParam, translation]);

  useEffect(() => {
    if (!book || !refParam) return;
    setAudioUrl(null);
    setAudioLoading(true);
    fetchAudioUrl(book, refParam)
      .then(setAudioUrl)
      .catch(() => setAudioUrl(null))
      .finally(() => setAudioLoading(false));
  }, [book, refParam]);

  const entry = activeStrong ? getEntry(activeStrong) : null;

  return (
    <>
      <Stack.Screen options={{ title: `${book} ${refParam}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.translationRow}>
          {TRANSLATIONS.map((tr) => (
            <TouchableOpacity
              key={tr.id}
              style={[styles.pill, tr.id === translation && styles.pillActive]}
              onPress={() => {
                setTranslation(tr.id);
                if (tr.id !== 'kjv') setStudyMode(false);
              }}
            >
              <Text style={[styles.pillText, tr.id === translation && styles.pillTextActive]}>
                {tr.abbr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AudioPlayer audioUrl={audioUrl} loading={audioLoading} />

        {studyAvailable && (
          <TouchableOpacity
            style={[styles.originalsBtn, studyMode && styles.originalsBtnOn]}
            onPress={() => {
              if (isKjv && studyMode) {
                setStudyMode(false);
              } else {
                setTranslation('kjv');
                setStudyMode(true);
              }
            }}
          >
            <Text style={[styles.originalsText, studyMode && styles.originalsTextOn]}>
              {studyMode ? 'Originals ✓' : 'Originals ▸'}
            </Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator color={C.yellow} size="large" style={styles.loader} />}

        {error && (
          <>
            <Text style={styles.errorTitle}>Could not load passage.</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <Text style={styles.errorDetail}>Translation: {t.abbr}</Text>
          </>
        )}

        {result && (
          <View style={styles.body}>
            <Text style={styles.reference}>
              {result.reference} · {t.abbr}
              {studyMode && isKjv && tokens && '  ·  Tap underlined words for lexicon'}
            </Text>

            {isKjv && studyMode && tokens ? (
              <StrongsVerse
                tokens={tokens}
                activeStrong={activeStrong}
                onWordPress={setActiveStrong}
              />
            ) : (
              <Text style={styles.verse}>{result.text || '(empty passage)'}</Text>
            )}

            {result.copyright && <Text style={styles.copyright}>{result.copyright}</Text>}
          </View>
        )}
      </ScrollView>

      <LexiconDrawer
        visible={!!activeStrong}
        strongsId={activeStrong}
        entry={entry}
        onClose={() => setActiveStrong(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.teal },
  content:          { padding: 16, paddingBottom: 48 },
  translationRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  pillActive:       { backgroundColor: C.yellow, borderColor: C.yellow },
  pillText:         { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  pillTextActive:   { color: C.tealDark },
  originalsBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 16,
  },
  originalsBtnOn:   { backgroundColor: C.done, borderColor: C.done },
  originalsText:    { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  originalsTextOn:  { color: C.white },
  loader:           { marginTop: 60 },
  errorTitle:       { color: '#f87171', fontSize: 16, fontWeight: '600', marginTop: 40 },
  errorDetail:      { color: C.textSecondary, fontSize: 13, marginTop: 8 },
  body:             { paddingTop: 8 },
  reference:        { fontSize: 12, fontWeight: '700', color: C.yellow, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  verse:            { fontSize: 18, lineHeight: 32, color: C.offWhite, fontWeight: '300' },
  originalsSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  originalsLabel:   { fontSize: 11, fontWeight: '700', color: C.textSecondary, letterSpacing: 1.2, marginBottom: 8 },
  copyright:        { fontSize: 11, color: C.textSecondary, marginTop: 24, lineHeight: 18 },
});
