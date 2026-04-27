import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { C } from '../../constants/colors';
import { TRANSLATIONS } from '../../lib/translations';
import { getSavedTranslation, saveTranslation, getNotificationsEnabled, setNotificationsEnabled } from '../../lib/progress';
import { scheduleDailyReminder, cancelReminder } from '../../lib/notifications';

export default function SettingsScreen() {
  const [translation, setTranslationState] = useState('kjv');
  const [notifsEnabled, setNotifsState] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSavedTranslation().then(setTranslationState);
      getNotificationsEnabled().then(setNotifsState);
    }, []),
  );

  async function pickTranslation(id: string) {
    await saveTranslation(id);
    setTranslationState(id);
  }

  async function toggleNotifs(value: boolean) {
    setNotifsState(value);
    await setNotificationsEnabled(value);
    if (value) {
      await scheduleDailyReminder(9, 0);
    } else {
      await cancelReminder();
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Translation</Text>
      {TRANSLATIONS.map(t => (
        <TouchableOpacity
          key={t.id}
          style={[styles.row, translation === t.id && styles.rowSelected]}
          onPress={() => pickTranslation(t.id)}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{t.abbr}</Text>
            <Text style={styles.rowSub}>{t.name}</Text>
          </View>
          {translation === t.id && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.section}>Notifications</Text>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Daily reminder</Text>
          <Text style={styles.rowSub}>A gentle nudge at 9 am</Text>
        </View>
        <Switch
          value={notifsEnabled}
          onValueChange={toggleNotifs}
          trackColor={{ true: C.done }}
          thumbColor={C.white}
        />
      </View>

      <Text style={styles.section}>About</Text>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/about')}>
        <Text style={styles.rowTitle}>Credits & Licences</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Not affiliated with or endorsed by The Ten Minute Bible Hour.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.tealDark },
  content:     { paddingBottom: 48 },
  section:     {
    fontSize: 11, fontWeight: '700', color: C.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowSelected:  { backgroundColor: C.doneBg },
  rowText:      { flex: 1 },
  rowTitle:     { fontSize: 15, fontWeight: '600', color: C.offWhite },
  rowSub:       { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  check:        { fontSize: 18, color: C.done, fontWeight: '700' },
  chevron:      { fontSize: 20, color: C.textSecondary },
  disclaimer:   { fontSize: 12, color: C.textSecondary, textAlign: 'center', padding: 24 },
});
