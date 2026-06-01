// Memory — a calm, scheduler-free surface for learning verses by heart.
//
// Mirrors app/lib/memory.js on web. AsyncStorage instead of localStorage,
// so the storage API is async. Fade-ladder and tokenizer are pure and
// copied verbatim.

import AsyncStorage from "@react-native-async-storage/async-storage";

export const MEMORY_STORAGE_KEY = "bt:memory";
export const REMINDER_STORAGE_KEY = "bt:memory:reminder";
export const PRACTICE_ONBOARDED_KEY = "bt:memory:practice-onboarded";

export type MemoryEntry = {
  book: string;
  verseRef: string;
  ref: string;
  added: number;
  // Timestamp when the user marked this verse as "known by heart". When
  // present, the verse is archived: still in the deck, but excluded from
  // the daily reminder pick and visually segregated in the UI. Missing /
  // 0 means active. Back-compat: pre-v3 entries lack this field — they
  // are treated as active by isLearned().
  learned?: number;
};

export type MemoryMap = Record<string, MemoryEntry>;

export type FadeMode = "full" | "initials" | "blanks";

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
};

export function memId(book: string, verseRef: string): string {
  return `${book} ${verseRef}`;
}

export async function loadMemory(): Promise<MemoryMap> {
  try {
    const raw = await AsyncStorage.getItem(MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveMemory(map: MemoryMap): Promise<void> {
  try {
    await AsyncStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // silent — matches web
  }
}

export function isSaved(map: MemoryMap, book: string, verseRef: string): boolean {
  return !!map[memId(book, verseRef)];
}

function makeEntry(book: string, verseRef: string): MemoryEntry {
  return { book, verseRef, ref: `${book} ${verseRef}`, added: Date.now() };
}

export async function addVerse(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  const id = memId(book, verseRef);
  if (!map[id]) {
    map[id] = makeEntry(book, verseRef);
    await saveMemory(map);
  }
  return map;
}

export async function removeVerse(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  delete map[memId(book, verseRef)];
  await saveMemory(map);
  return map;
}

export async function toggleVerse(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  const id = memId(book, verseRef);
  if (map[id]) delete map[id];
  else map[id] = makeEntry(book, verseRef);
  await saveMemory(map);
  return map;
}

export function memoryList(map: MemoryMap): MemoryEntry[] {
  return Object.values(map).sort((a, b) => (a.added || 0) - (b.added || 0));
}

export function memoryCount(map: MemoryMap): number {
  return Object.keys(map).length;
}

export function isLearned(entry: MemoryEntry): boolean {
  return !!entry.learned;
}

export function activeList(map: MemoryMap): MemoryEntry[] {
  return memoryList(map).filter((e) => !isLearned(e));
}

export function learnedList(map: MemoryMap): MemoryEntry[] {
  return memoryList(map).filter(isLearned);
}

export async function markLearned(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  const id = memId(book, verseRef);
  if (map[id]) {
    map[id] = { ...map[id], learned: Date.now() };
    await saveMemory(map);
  }
  return map;
}

export async function markActive(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  const id = memId(book, verseRef);
  if (map[id] && map[id].learned) {
    const { learned: _drop, ...rest } = map[id];
    map[id] = rest;
    await saveMemory(map);
  }
  return map;
}

// ── Fade ladder ────────────────────────────────────────────────────────────
const WORD_CORE = /^([^A-Za-z0-9]*)([A-Za-z0-9](?:.*[A-Za-z0-9])?)([^A-Za-z0-9]*)$/;

export function fadeWord(word: string, mode: FadeMode): string {
  if (mode === "full") return word;
  const m = word.match(WORD_CORE);
  if (!m) return word;
  const [, lead, core, trail] = m;
  if (mode === "initials") return lead + core[0] + trail;
  return lead + "_".repeat(Math.min(core.length, 8)) + trail;
}

export type WordToken = { word: string; index: number };

export function tokenizeVerse(text: string): WordToken[][] {
  const lines = text.split(/\n+/);
  const result: WordToken[][] = [];
  let flatIndex = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/).map((word) => ({ word, index: flatIndex++ }));
    result.push(words);
  }
  return result;
}

// ── Reminder settings ──────────────────────────────────────────────────────
export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_REMINDER };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_REMINDER, ...parsed };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

export async function saveReminder(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // silent
  }
}

// ── Practice onboarding flag ───────────────────────────────────────────────
// True once the user has long-pressed a word for the first time. Used to
// hide the "Tap / Hold / Swipe" explainer strip on subsequent practice
// sessions — once you've done it, you don't need the hint repeating on
// every verse card.
export async function loadPracticeOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PRACTICE_ONBOARDED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markPracticeOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(PRACTICE_ONBOARDED_KEY, "1");
  } catch {
    // silent
  }
}

export function pickRandomVerse(map: MemoryMap): MemoryEntry | null {
  // Reminder picker only surfaces active verses — once you've marked one
  // "known by heart" it falls out of the daily nudge rotation.
  const list = activeList(map);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
