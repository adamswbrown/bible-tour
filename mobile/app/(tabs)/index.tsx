import { useCallback, useState } from 'react';
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
import { SECTIONS, OT_BOOKS, NT_BOOKS, type Book } from '../../lib/readingPlan';
import {
  getProgress,
  setBookDone,
  getSavedTranslation,
  getEarnedMilestones,
  setEarnedMilestones,
  type Progress,
} from '../../lib/progress';
import { TOUR_MILESTONES, earnedFor, type Milestone } from '../../lib/milestones';
import CelebrationModal from '../../components/CelebrationModal';
import { DEFAULT_TRANSLATION } from '../../lib/translations';

export default function ChecklistScreen() {
  const [progress, setProgress] = useState<Progress>({});
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [celebration, setCelebration] = useState<Milestone | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProgress().then((p) => {
        setProgress(p);
        // Silent backfill: existing readers who already crossed thresholds get
        // their badges without a surprise pop-up. New crossings are handled in
        // toggle(), where done actually changes.
        getEarnedMilestones().then((stored) => {
          const merged = Array.from(new Set([...stored, ...earnedFor(Object.keys(p).length)]));
          setEarnedIds(merged);
          if (merged.length !== stored.length) setEarnedMilestones(merged);
        });
      });
      getSavedTranslation().then(setTranslation);
    }, []),
  );

  async function toggle(book: Book) {
    const updated = await setBookDone(book.id, !progress[book.id]);
    setProgress({ ...updated });

    const newlyEarned = earnedFor(Object.keys(updated).length).filter(
      (id) => !earnedIds.includes(id),
    );
    if (newlyEarned.length > 0) {
      const merged = [...earnedIds, ...newlyEarned];
      setEarnedIds(merged);
      await setEarnedMilestones(merged);
      const last = TOUR_MILESTONES.filter((m) => newlyEarned.includes(m.id)).pop();
      if (last) setCelebration(last);
    }
  }

  const done = Object.keys(progress).length;
  const otDone = OT_BOOKS.filter((b) => progress[b.id]).length;
  const ntDone = NT_BOOKS.filter((b) => progress[b.id]).length;
  const pct = Math.round((done / 66) * 100);

  return (
    <View style={styles.container}>
      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <ProgressHeader
            done={done}
            otDone={otDone}
            ntDone={ntDone}
            pct={pct}
            translation={translation}
            earnedIds={earnedIds}
          />
        }
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
      <CelebrationModal milestone={celebration} onClose={() => setCelebration(null)} />
    </View>
  );
}

function ProgressHeader({
  done,
  otDone,
  ntDone,
  pct,
  translation,
  earnedIds,
}: {
  done: number;
  otDone: number;
  ntDone: number;
  pct: number;
  translation: string;
  earnedIds: string[];
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tour of the Bible</Text>
      <Text style={styles.headerSub}>{translation.toUpperCase()}</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressTopRow}>
          <Text style={styles.bigNumber}>{done}</Text>
          <Text style={styles.bigLabel}>of 66 books · {pct}%</Text>
        </View>

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%` as any }]} />
        </View>

        <View style={styles.statRow}>
          <Stat label="Old Testament" value={otDone} total={39} />
          <Stat label="New Testament" value={ntDone} total={27} />
        </View>

        <BadgeShelf earnedIds={earnedIds} />

        {done === 66 && (
          <Text style={styles.completeText}>You've read every book. Well done. ✦</Text>
        )}
      </View>
    </View>
  );
}

function BadgeShelf({ earnedIds }: { earnedIds: string[] }) {
  return (
    <View style={styles.badgeShelf}>
      {TOUR_MILESTONES.map((m) => {
        const earned = earnedIds.includes(m.id);
        return (
          <View key={m.id} style={styles.badge}>
            <View style={[styles.badgeDisc, earned ? styles.badgeDiscOn : styles.badgeDiscOff]}>
              <Text style={[styles.badgePct, earned ? styles.badgePctOn : styles.badgePctOff]}>
                {m.pct}%
              </Text>
            </View>
            <Text style={[styles.badgeLabel, earned && styles.badgeLabelOn]} numberOfLines={1}>
              {m.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Stat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statTotal}>/{total}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  const refs = book.refs
    .split(/\s+and\s+|,\s*/)
    .filter((r) => /^\d+:\S+$/.test(r.trim()));

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
  container:    { flex: 1, backgroundColor: C.tealDark },
  list:         { paddingBottom: 40 },
  header:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle:  { fontSize: 24, fontWeight: '800', color: C.yellow },
  headerSub:    { fontSize: 12, color: C.textSecondary, marginTop: 2, letterSpacing: 1 },

  progressCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1, borderColor: C.border,
  },
  progressTopRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  bigNumber:    { fontSize: 36, fontWeight: '800', color: C.offWhite, lineHeight: 38 },
  bigLabel:     { fontSize: 14, color: C.textSecondary, marginLeft: 10 },
  bar:          { height: 6, backgroundColor: C.tealDark, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  barFill:      { height: '100%', backgroundColor: C.yellow, borderRadius: 3 },
  statRow:      { flexDirection: 'row', gap: 14 },
  stat:         { flex: 1 },
  statValue:    { fontSize: 18, fontWeight: '700', color: C.offWhite },
  statTotal:    { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  statLabel:    { fontSize: 11, color: C.textSecondary, marginTop: 2, letterSpacing: 0.6 },
  completeText: { color: C.done, fontWeight: '600', textAlign: 'center', marginTop: 12, fontSize: 13 },

  badgeShelf: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  badge: { flex: 1, alignItems: 'center' },
  badgeDisc: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeDiscOn:  { backgroundColor: 'rgba(255,203,33,0.16)', borderColor: C.yellow },
  badgeDiscOff: { backgroundColor: C.tealDark, borderColor: C.border },
  badgePct:     { fontSize: 12, fontWeight: '800' },
  badgePctOn:   { color: C.yellow },
  badgePctOff:  { color: C.textSecondary },
  badgeLabel:   { fontSize: 9, color: C.textSecondary, marginTop: 5, letterSpacing: 0.2 },
  badgeLabelOn: { color: C.offWhite, fontWeight: '600' },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: C.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 6,
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
