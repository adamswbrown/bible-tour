import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ENCOURAGEMENTS = [
  'Keep going — 66 books, one story.',
  "You're making progress through the whole Bible.",
  'Every book you read opens the story a little wider.',
  'One book at a time — you've got this.',
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
  await Notifications.cancelAllScheduledNotificationsAsync();
  const body = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Tour of the Bible', body },
    trigger: {
      hour,
      minute,
      repeats: true,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    },
  });
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
