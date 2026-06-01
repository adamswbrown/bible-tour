import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Indexed 0..6 → iOS weekday 1..7 (Sunday..Saturday). The body of each
// reminder is fixed per weekday so users see a different message on
// different days without us relying on referencing the day by name —
// "Monday — keep going" would feel forced; rotating through generic
// encouragements feels more natural.
const WEEKLY_MESSAGES = [
  'Keep going — 66 books, one story.',
  "You're making progress through the whole Bible.",
  'Every book you read opens the story a little wider.',
  "One book at a time — you've got this.",
  'Five minutes today. Open the next book.',
  "Small steps — that's how the whole Bible gets read.",
  "Pick up where you left off. The story's waiting.",
];

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour = 9, minute = 0): Promise<void> {
  const granted = await requestPermission();
  if (!granted) return;

  // Wipe anything we'd previously scheduled — covers the toggle-off /
  // toggle-on flow, time changes, and old single-DAILY reminders from
  // earlier app versions.
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule one WEEKLY notification per weekday. iOS allows ~64
  // scheduled notifications per app; we're using 7. Each fires every
  // week at hour:minute on its weekday, so the user sees a different
  // body each day, cycling.
  for (let i = 0; i < 7; i++) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tour of the Bible',
        body: WEEKLY_MESSAGES[i],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: i + 1, // iOS: 1 = Sunday, 7 = Saturday
        hour,
        minute,
      },
    });
  }
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Memory verse reminder ──────────────────────────────────────────────────
// Independent of the tour reminder above. Identifier-scoped so toggling it
// doesn't disturb the per-weekday tour reminders. Caveat: if the user
// re-schedules the tour reminder, that flow calls cancelAllScheduledNotifications
// and wipes the memory reminder too — the settings UI re-schedules on toggle,
// which keeps the two in sync as long as the user revisits settings.
const MEMORY_REMINDER_ID = 'memory-daily-reminder';

export async function scheduleMemoryReminder(
  hour: number,
  minute: number,
): Promise<boolean> {
  const granted = await requestPermission();
  if (!granted) return false;

  await Notifications.cancelScheduledNotificationAsync(MEMORY_REMINDER_ID).catch(
    () => undefined,
  );

  await Notifications.scheduleNotificationAsync({
    identifier: MEMORY_REMINDER_ID,
    content: {
      title: 'Memory time',
      body: 'Open Bible Tour to practise a verse.',
      data: { type: 'memory-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return true;
}

export async function cancelMemoryReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MEMORY_REMINDER_ID).catch(
    () => undefined,
  );
}

// Schedules a one-shot notification ~5 s out so the user can verify
// permissions, banner copy, lock-screen behaviour, etc. without
// waiting for the 9 am daily reminder.
export async function sendTestNotification(): Promise<boolean> {
  const granted = await requestPermission();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tour of the Bible',
      body: "Test reminder — looking good. You're all set.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
  return true;
}
