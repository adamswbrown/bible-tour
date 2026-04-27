import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { C } from '../constants/colors';
import { fetchVerse, fetchVerseEsv, type VerseResult } from '../lib/api';
import { getTranslation } from '../lib/translations';

export default function VerseScreen() {
  const { book, ref, translation = 'kjv' } = useLocalSearchParams<{
    book: string;
    ref: string;
    translation: string;
  }>();

  const [result, setResult] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = getTranslation(translation);

  useEffect(() => {
    if (!book || !ref) return;
    setLoading(true);
    setError(null);

    const load = t.esvLicensed
      ? fetchVerseEsv(book, ref)
      : fetchVerse(book, ref, translation);

    load
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [book, ref, translation]);

  return (
    <>
      <Stack.Screen options={{ title: `${book} ${ref}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator color={C.yellow} size="large" style={styles.loader} />}

        {error && <Text style={styles.error}>Could not load passage. Check your connection.</Text>}

        {result && (
          <>
            <Text style={styles.reference}>{result.reference}</Text>
            <Text style={styles.verse}>{result.text}</Text>
            {result.copyright && (
              <Text style={styles.copyright}>{result.copyright}</Text>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.teal },
  content:    { padding: 24, paddingBottom: 48 },
  loader:     { marginTop: 60 },
  error:      { color: '#f87171', textAlign: 'center', marginTop: 40 },
  reference:  { fontSize: 13, fontWeight: '700', color: C.yellow, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  verse:      { fontSize: 20, lineHeight: 32, color: C.offWhite, fontWeight: '300' },
  copyright:  { fontSize: 11, color: C.textSecondary, marginTop: 32, lineHeight: 18 },
});
