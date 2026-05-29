// Memory — a calm, scheduler-free surface for learning verses by heart.
//
// We deliberately keep no review schedule, no due dates, and no grading.
// The deck is just "verses I want to memorise"; the practice surface (the
// fade ladder + ESV audio) lives in /memory. All state is localStorage,
// matching the rest of the app — no backend, no accounts.
//
// Shape of bt:memory:
//   { [id]: { book, verseRef, ref, added } }
// where id is `${book} ${verseRef}` (e.g. "John 3:16").

export const MEMORY_STORAGE_KEY = "bt:memory";

export function memId(book, verseRef) {
  return `${book} ${verseRef}`;
}

export function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMemory(map) {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function isSaved(map, book, verseRef) {
  return !!map[memId(book, verseRef)];
}

function makeEntry(book, verseRef) {
  return { book, verseRef, ref: `${book} ${verseRef}`, added: Date.now() };
}

export function addVerse(book, verseRef) {
  const map = loadMemory();
  const id = memId(book, verseRef);
  if (!map[id]) {
    map[id] = makeEntry(book, verseRef);
    saveMemory(map);
  }
  return map;
}

export function removeVerse(book, verseRef) {
  const map = loadMemory();
  delete map[memId(book, verseRef)];
  saveMemory(map);
  return map;
}

export function toggleVerse(book, verseRef) {
  const map = loadMemory();
  const id = memId(book, verseRef);
  if (map[id]) delete map[id];
  else map[id] = makeEntry(book, verseRef);
  saveMemory(map);
  return map;
}

// Oldest-saved first — the deck reads like a list you've been building.
export function memoryList(map) {
  return Object.values(map).sort((a, b) => (a.added || 0) - (b.added || 0));
}

export function memoryCount(map) {
  return Object.keys(map).length;
}

// ── Fade ladder ────────────────────────────────────────────────────────────
// The heart of the practice surface. We split the verse into word tokens and
// transform each word's alphanumeric core while preserving its surrounding
// punctuation, so "loved," stays "L," in initials mode and "_____," in blanks.

const WORD_CORE = /^([^A-Za-z0-9]*)([A-Za-z0-9](?:.*[A-Za-z0-9])?)([^A-Za-z0-9]*)$/;

export function fadeWord(word, mode) {
  if (mode === "full") return word;
  const m = word.match(WORD_CORE);
  if (!m) return word; // pure punctuation (em dash, etc.) — leave as-is
  const [, lead, core, trail] = m;
  if (mode === "initials") return lead + core[0] + trail;
  // blanks — underscore run roughly matching the word length, capped so very
  // long words don't blow out the line
  return lead + "_".repeat(Math.min(core.length, 8)) + trail;
}

// Splits ESV prose into lines (preserving paragraph/poetry breaks) and then
// into whitespace-separated word tokens, assigning each word a stable flat
// index so the practice view can track which individual words have been
// "peeked" (tapped to reveal).
export function tokenizeVerse(text) {
  const lines = text.split(/\n+/);
  const result = [];
  let flatIndex = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/).map((word) => ({ word, index: flatIndex++ }));
    result.push(words);
  }
  return result;
}
