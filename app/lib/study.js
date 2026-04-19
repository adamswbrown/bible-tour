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
