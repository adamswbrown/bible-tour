import { useCallback, useEffect, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../constants/colors';
import { SECTIONS, type Book } from '../../lib/readingPlan';
import { getProgress, setBookDone, getSavedTranslation, type Progress } from '../../lib/progress';

export default function ChecklistScreen() {
  const [progress, setProgress] = useState<Progress>({});
  const [translation, setTranslation] = useState('kjv');

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
      getSavedTranslation().then(setTranslation);
    }, []),
  );

  async function toggle(book: Book) {
    const updated = await setBookDone(book.id, !progress[book.id]);
    setProgress({ ...updated });
  }

  const done = Object.keys(progress).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tour of the Bible</Text>
        <Text style={styles.headerSub}>
          {done} / 66 books · {translation.toUpperCase()}
        </Text>
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={item => String(item.id)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <BookRow
            book={item}
            done={!!progress[item.id]}
            translation={translation}
            onToggle={() => toggle(item)}
          />
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

function BookRow({
  book,
  done,
  translation,
  onToggle,
}: {
  book: Book;
  done: boolean;
  translation: string;
  onToggle: () => void;
}) {
  const refs = book.refs.split(/\s+and\s+|,\s*/).filter(r => /^\d+:\S+$/.test(r.trim()));

  return (
    <View style={[styles.row, done && styles.rowDone]}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggle} hitSlop={8}>
        <View style={[styles.checkboxInner, done && styles.checkboxDone]}>
          {done && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.rowContent}>
        <Text style={[styles.bookName, done && styles.bookNameDone]}>{book.book}</Text>

        <View style={styles.refs}>
          {refs.map((ref, i) => (
            <TouchableOpacity
              key={i}
              onPress={() =>
                router.push({
                  pathname: '/verse',
                  params: { book: book.book, ref: ref.trim(), translation },
                })
              }
            >
              <Text style={styles.refChip}>{ref.trim()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {book.note && <Text style={styles.note}>{book.note}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.tealDark },
  header:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.yellow },
  headerSub:   { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  list:        { paddingBottom: 40 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: C.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6,
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowDone:       { backgroundColor: C.doneBg },
  checkbox:      { paddingTop: 2, marginRight: 12 },
  checkboxInner: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.tealLight,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone:  { backgroundColor: C.done, borderColor: C.done },
  checkmark:     { color: C.white, fontSize: 13, fontWeight: '700' },
  rowContent:    { flex: 1 },
  bookName:      { fontSize: 15, fontWeight: '600', color: C.offWhite },
  bookNameDone:  { color: C.done },
  refs:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  refChip: {
    fontSize: 12, color: C.yellow,
    backgroundColor: 'rgba(255,203,33,0.12)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  note: { fontSize: 11, color: C.textSecondary, marginTop: 4, fontStyle: 'italic' },
});
