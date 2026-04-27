import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = 'bt:progress';
const TRANSLATION_KEY = 'bt:translation';
const NOTIFS_KEY = 'bt:notifs';

export type Progress = Record<number, boolean>;

export async function getProgress(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setBookDone(bookId: number, done: boolean): Promise<Progress> {
  const progress = await getProgress();
  if (done) {
    progress[bookId] = true;
  } else {
    delete progress[bookId];
  }
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export async function getSavedTranslation(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(TRANSLATION_KEY)) ?? 'kjv';
  } catch {
    return 'kjv';
  }
}

export async function saveTranslation(id: string): Promise<void> {
  await AsyncStorage.setItem(TRANSLATION_KEY, id);
}

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(NOTIFS_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFS_KEY, enabled ? 'true' : 'false');
}
