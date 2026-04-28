// Study Mode helpers — bridges (book, verseRef) → tagged tokens + lexicon entries.
// The data JSONs are statically imported so Next.js includes them in the bundle.

import taggedVerses from "../data/tagged-verses.json";
import lexicon from "../data/lexicon.json";
import { BOOK_ABBREV } from "./bible";

// Is there a tagged copy of this verseId (e.g. "JHN.3.16")?
export function hasStudy(verseId) {
  if (!verseId) return false;
  return Object.prototype.hasOwnProperty.call(taggedVerses, verseId);
}

// Array of { w, s } tokens, or null if not covered.
export function getTokens(verseId) {
  if (!verseId) return null;
  return taggedVerses[verseId] || null;
}

// Lexicon entry ({ lemma, translit, pos, gloss, entry }) or null.
export function getEntry(strongsId) {
  if (!strongsId) return null;
  return lexicon[strongsId] || null;
}

// Convert the app's (book, verseRef) pair into a tagged-verses key.
//   toVerseId("Genesis", "12:2")   → "GEN.12.2"
//   toVerseId("Genesis", "12:2-3") → "GEN.12.2"  (range → first verse only)
// Returns null if the book isn't recognised or the ref can't be parsed.
export function toVerseId(book, ref) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev || !ref) return null;
  // Accept "ch:v", "ch:v-v2", "ch:v-ch2:v2"; take the starting ch:v.
  const match = String(ref).trim().match(/^(\d+):(\d+)/);
  if (!match) return null;
  return `${abbrev}.${match[1]}.${match[2]}`;
}

// Expand a reading-plan ref into every verse ID it covers. Lets the
// Originals view tokenize the whole passage instead of just the first
// verse. Handles single verses ("3:16") and same-chapter ranges
// ("20:1-17"). Cross-chapter ranges aren't used by any current
// reading-plan ref; if encountered, we fall back to the starting
// verse so the UI still shows something.
export function toVerseIds(book, ref) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev || !ref) return [];

  const r = String(ref).trim();

  const single = r.match(/^(\d+):(\d+)$/);
  if (single) return [`${abbrev}.${single[1]}.${single[2]}`];

  const sameCh = r.match(/^(\d+):(\d+)-(\d+)$/);
  if (sameCh) {
    const c = sameCh[1];
    const start = Number(sameCh[2]);
    const end = Number(sameCh[3]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
    const ids = [];
    for (let v = start; v <= end; v += 1) ids.push(`${abbrev}.${c}.${v}`);
    return ids;
  }

  const id = toVerseId(book, ref);
  return id ? [id] : [];
}
