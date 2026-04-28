// On-device LRU cache for ESV verse text.
//
// Why this exists: Crossway's ESV API terms cap on-device caching at 500
// verses per user. We cache to (a) honor offline reads of recently-read
// passages, (b) cut needless proxy traffic, and (c) make sure we never
// exceed the 500-verse ceiling under load.
//
// Design:
//  - Hot tier: an in-memory Map. Map preserves insertion order; on every
//    read we re-insert to mark the entry as most-recently-used.
//  - Cold tier: AsyncStorage under a single JSON key. Hydrated once at
//    app start; persisted via a debounced flush after every mutation.
//  - Eviction is by *verse count*, not entry count. A 12-verse range
//    counts for 12 toward the cap. Oldest entries drop first.
//  - 30-day TTL on entries; expired entries are treated as misses and
//    pruned during hydrate.
//
// Only ESV passes through this cache — public-domain translations have
// no cache cap and don't need bookkeeping.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bt:esv-cache:v1';
const MAX_VERSES = 500;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FLUSH_DEBOUNCE_MS = 500;

type Entry = {
  text: string;
  verseCount: number;
  fetchedAt: number;
};

// In-memory store. Map iteration order = insertion order = LRU order
// (oldest first, newest last).
const memory = new Map<string, Entry>();
let totalVerses = 0;
let hydrated = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function cacheKey(book: string, ref: string): string {
  return `${book}|${ref}`;
}

// Approximate the verse count for a ref string. Cache eviction is the
// only consumer of this number, so a slight over-estimate on cross-
// chapter spans is fine — it just means we evict a hair earlier.
export function countVerses(ref: string): number {
  // "3:16" → 1
  const single = ref.match(/^\d+:\d+$/);
  if (single) return 1;

  // "3:16-18" (same chapter) → 18 - 16 + 1
  const sameCh = ref.match(/^(\d+):(\d+)-(\d+)$/);
  if (sameCh) {
    const start = Number(sameCh[2]);
    const end = Number(sameCh[3]);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      return end - start + 1;
    }
  }

  // "3:16-4:2" cross-chapter — without canon data on-device, treat
  // every cross-chapter span as a generous over-estimate. The reading
  // plan rarely uses these and erring high is safer for the cap.
  const crossCh = ref.match(/^\d+:\d+-\d+:\d+$/);
  if (crossCh) return 50;

  // "1" (whole chapter) — over-estimate.
  const wholeCh = ref.match(/^\d+$/);
  if (wholeCh) return 50;

  // Anything we don't recognise — count as 5 to be safe.
  return 5;
}

export async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: { entries: [string, Entry][] } = JSON.parse(raw);
      const now = Date.now();
      for (const [key, entry] of data.entries) {
        if (now - entry.fetchedAt < TTL_MS && entry.text) {
          memory.set(key, entry);
          totalVerses += entry.verseCount;
        }
      }
      // Defensive: if a stale persisted blob is over the cap, prune now.
      pruneToCap();
    }
  } catch {
    // Corrupt blob — start fresh rather than blocking app launch.
  }
  hydrated = true;
}

export function get(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;

  if (Date.now() - entry.fetchedAt >= TTL_MS) {
    memory.delete(key);
    totalVerses -= entry.verseCount;
    scheduleFlush();
    return null;
  }

  // LRU touch: re-insert so this entry is now the newest.
  memory.delete(key);
  memory.set(key, entry);
  return entry.text;
}

export function set(key: string, text: string, verseCount: number): void {
  if (!text) return;

  const existing = memory.get(key);
  if (existing) {
    totalVerses -= existing.verseCount;
    memory.delete(key);
  }

  const entry: Entry = { text, verseCount, fetchedAt: Date.now() };
  memory.set(key, entry);
  totalVerses += verseCount;

  pruneToCap();
  scheduleFlush();
}

function pruneToCap(): void {
  // Drop oldest entries until we're at or below the verse cap.
  const iter = memory.keys();
  while (totalVerses > MAX_VERSES) {
    const next = iter.next();
    if (next.done) break;
    const key = next.value;
    const entry = memory.get(key);
    if (!entry) break;
    memory.delete(key);
    totalVerses -= entry.verseCount;
  }
}

export async function clear(): Promise<void> {
  memory.clear();
  totalVerses = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — clear is idempotent from the user's POV.
  }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushNow, FLUSH_DEBOUNCE_MS);
}

async function flushNow(): Promise<void> {
  flushTimer = null;
  try {
    const entries = Array.from(memory.entries());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ entries }));
  } catch {
    // If persistence fails, the in-memory cache still works for the
    // current session.
  }
}

// Test / debug helper. Not used by production code.
export function _stats() {
  return { entries: memory.size, totalVerses, max: MAX_VERSES };
}
