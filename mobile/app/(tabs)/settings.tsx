import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { C } from '../../constants/colors';
import { TRANSLATIONS } from '../../lib/translations';
import {
  clearProgress,
  getSavedTranslation,
  saveTranslation,
  getNotificationsEnabled,
  setNotificationsEnabled,
  getProgress,
} from '../../lib/progress';
import { scheduleDailyReminder, cancelReminder, sendTestNotification } from '../../lib/notifications';

export default function SettingsScreen() {
  const [translation, setTranslationState] = useState('kjv');
  const [notifsEnabled, setNotifsState] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getSavedTranslation().then(setTranslationState);
      getNotificationsEnabled().then(setNotifsState);
      getProgress().then((p) => setDoneCount(Object.keys(p).length));
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

  function sendFeedback() {
    const subject = encodeURIComponent('[Bible Tour] Feedback');
    const body = encodeURIComponent(
      `\n\n\n— — — — — — — — — — — —\n` +
        `Please describe the bug or feature above this line.\n\n` +
        `App: Tour of the Bible (${Platform.OS})\n`,
    );
    Linking.openURL(`mailto:bibletour@askadam.cloud?subject=${subject}&body=${body}`);
  }

  function confirmReset() {
    Alert.alert(
      'Reset progress?',
      `This will uncheck all ${doneCount} ${doneCount === 1 ? 'book' : 'books'} you've marked as read. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearProgress();
            setDoneCount(0);
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Default translation</Text>
      <Text style={styles.sectionHint}>
        The translation each verse opens in. You can switch translations inside any passage.
      </Text>
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
      {__DEV__ && (
        <TouchableOpacity
          style={styles.row}
          onPress={async () => {
            const ok = await sendTestNotification();
            if (!ok) {
              Alert.alert(
                'Notifications off',
                'iOS Settings → Tour of the Bible → Notifications to allow them.',
              );
              return;
            }
            Alert.alert(
              'Test sent',
              'A test notification will arrive in about 5 seconds. Lock your phone or switch apps to see it on the lock screen.',
            );
          }}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Send test notification</Text>
            <Text style={styles.rowSub}>Dev only · fires in ~5 seconds</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.section}>Progress</Text>
      <TouchableOpacity
        style={styles.row}
        onPress={confirmReset}
        disabled={doneCount === 0}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, doneCount === 0 && styles.disabled]}>
            Reset progress
          </Text>
          <Text style={styles.rowSub}>
            {doneCount === 0
              ? 'Nothing to reset yet.'
              : `Currently ${doneCount} of 66 books marked as read.`}
          </Text>
        </View>
        {doneCount > 0 && <Text style={styles.destructive}>Reset</Text>}
      </TouchableOpacity>

      <Text style={styles.section}>About</Text>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/about')}>
        <Text style={styles.rowTitle}>Credits & Licences</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={sendFeedback}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Send feedback</Text>
          <Text style={styles.rowSub}>Email bibletour@askadam.cloud</Text>
        </View>
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
  sectionHint: {
    fontSize: 12, color: C.textSecondary, lineHeight: 18,
    paddingHorizontal: 16, paddingBottom: 12,
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
  destructive:  { fontSize: 13, color: '#f87171', fontWeight: '600' },
  disabled:     { color: C.textSecondary },
  disclaimer:   { fontSize: 12, color: C.textSecondary, textAlign: 'center', padding: 24 },
});
