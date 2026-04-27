import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../constants/colors';
import { OT_BOOKS, NT_BOOKS } from '../../lib/readingPlan';
import { getProgress, type Progress } from '../../lib/progress';

export default function ProgressScreen() {
  const [progress, setProgress] = useState<Progress>({});

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
    }, []),
  );

  const done = Object.keys(progress).length;
  const otDone = OT_BOOKS.filter(b => progress[b.id]).length;
  const ntDone = NT_BOOKS.filter(b => progress[b.id]).length;
  const pct = Math.round((done / 66) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Progress</Text>

      <View style={styles.big}>
        <Text style={styles.bigNumber}>{done}</Text>
        <Text style={styles.bigLabel}>of 66 books</Text>
      </View>

      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.pct}>{pct}% complete</Text>

      <View style={styles.row}>
        <Stat label="Old Testament" value={otDone} total={39} />
        <Stat label="New Testament" value={ntDone} total={27} />
      </View>

      {done === 66 && (
        <View style={styles.complete}>
          <Text style={styles.completeText}>
            You've read every book. Well done. ✦
          </Text>
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>{value}<Text style={styles.statTotal}>/{total}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.tealDark, padding: 24 },
  heading:      { fontSize: 22, fontWeight: '800', color: C.yellow, marginBottom: 32 },
  big:          { alignItems: 'center', marginBottom: 24 },
  bigNumber:    { fontSize: 72, fontWeight: '800', color: C.offWhite, lineHeight: 80 },
  bigLabel:     { fontSize: 16, color: C.textSecondary },
  bar:          { height: 8, backgroundColor: C.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill:      { height: '100%', backgroundColor: C.yellow, borderRadius: 4 },
  pct:          { fontSize: 13, color: C.textSecondary, marginBottom: 32 },
  row:          { flexDirection: 'row', gap: 16 },
  stat:         { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 16 },
  statNumber:   { fontSize: 32, fontWeight: '700', color: C.offWhite },
  statTotal:    { fontSize: 18, color: C.textSecondary },
  statLabel:    { fontSize: 12, color: C.textSecondary, marginTop: 4 },
  complete:     { marginTop: 32, padding: 16, backgroundColor: C.doneBg, borderRadius: 12, borderWidth: 1, borderColor: C.doneBorder },
  completeText: { color: C.done, fontWeight: '600', textAlign: 'center' },
});
