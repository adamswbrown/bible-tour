import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TRANSLATION } from './translations';

const PROGRESS_KEY = 'bt:progress';
const MILESTONES_KEY = 'bt:tourMilestones';
const TRANSLATION_KEY = 'bt:translation';
const TRANSLATION_MIGRATED_KEY = 'bt:translation_migrated_v1';
const NOTIFS_KEY = 'bt:notifs';
const RESUME_KEY = 'bt:resume';

export type Progress = Record<number, boolean>;

// Last verse opened in the reader — mirrors the web app's bt:resume entry.
export type ResumeEntry = { book: string; ref: string; ts: number };

export async function getResume(): Promise<ResumeEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(RESUME_KEY);
    const entry = raw ? JSON.parse(raw) : null;
    return entry && entry.book && entry.ref ? entry : null;
  } catch {
    return null;
  }
}

export async function saveResume(book: string, ref: string): Promise<void> {
  try {
    const entry: ResumeEntry = { book, ref, ts: Date.now() };
    await AsyncStorage.setItem(RESUME_KEY, JSON.stringify(entry));
  } catch {}
}

export async function clearResume(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RESUME_KEY);
  } catch {}
}

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

export async function getEarnedMilestones(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(MILESTONES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setEarnedMilestones(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify(ids));
}

export async function getSavedTranslation(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(TRANSLATION_KEY);
    if (stored === 'kjv') {
      // One-time flip for users who landed on KJV before NIV became the
      // default — they never explicitly chose it. Anyone who re-picks KJV
      // after this migration keeps it: the flag stays set forever.
      const migrated = await AsyncStorage.getItem(TRANSLATION_MIGRATED_KEY);
      if (!migrated) {
        await AsyncStorage.setItem(TRANSLATION_KEY, DEFAULT_TRANSLATION);
        await AsyncStorage.setItem(TRANSLATION_MIGRATED_KEY, '1');
        return DEFAULT_TRANSLATION;
      }
    } else if (stored) {
      // Any non-KJV stored value is an explicit choice — mark migration
      // done so a later switch back to KJV is respected.
      const migrated = await AsyncStorage.getItem(TRANSLATION_MIGRATED_KEY);
      if (!migrated) await AsyncStorage.setItem(TRANSLATION_MIGRATED_KEY, '1');
    }
    return stored ?? DEFAULT_TRANSLATION;
  } catch {
    return DEFAULT_TRANSLATION;
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

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(PROGRESS_KEY);
  await AsyncStorage.removeItem(MILESTONES_KEY);
  await AsyncStorage.removeItem(RESUME_KEY);
}
