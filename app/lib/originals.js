// Lookup helpers for the Original (Hebrew / Aramaic / Greek) translation.
// Data is keyed by English verse ID (e.g. "GEN.12.2", "JHN.3.16"); the
// build script handles the few English-to-Hebrew versification offsets
// so the caller doesn't need to know about them.

import originalVerses from "../data/original-verses.json";
import { BOOK_ABBREV } from "./bible";
import { parsePlanRef } from "./bible";

function abbrevFor(book) {
  return BOOK_ABBREV[book] || null;
}

// Expand a verseRef (e.g. "12:2", "12:2-3", "1:1-3") into an array of
// "ch.v" parts for the given book. Returns [] if the ref isn't structured.
function expandRef(verseRef) {
  const parsed = parsePlanRef(verseRef);
  if (!parsed.isStructured) return [];
  const out = [];
  if (parsed.kind === "verse") {
    out.push([parsed.startChapter, parsed.startVerse]);
  } else if (parsed.kind === "range") {
    for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
      out.push([parsed.startChapter, v]);
    }
  } else if (parsed.kind === "cross-chapter-range") {
    for (let ch = parsed.startChapter; ch <= parsed.endChapter; ch++) {
      const from = ch === parsed.startChapter ? parsed.startVerse : 1;
      const to = ch === parsed.endChapter ? parsed.endVerse : 200;
      for (let v = from; v <= to; v++) out.push([ch, v]);
    }
  } else if (parsed.kind === "chapter-span") {
    for (let ch = parsed.startChapter; ch <= parsed.endChapter; ch++) {
      for (let v = 1; v <= 200; v++) out.push([ch, v]);
    }
  }
  return out;
}

// Returns an array of { verse, text, lang } for the requested (book, ref)
// using only verses present in the bundled original-text data. Verses we
// don't ship (e.g. unreachable in a cross-chapter span) are skipped, not
// padded. Returns [] when nothing matches; callers should treat that as
// "this verse isn't available in the Original translation."
export function getOriginalVerses(book, verseRef) {
  const abbrev = abbrevFor(book);
  if (!abbrev) return [];
  const parts = expandRef(verseRef);
  if (parts.length === 0) return [];
  const out = [];
  for (const [ch, v] of parts) {
    const key = `${abbrev}.${ch}.${v}`;
    const hit = originalVerses[key];
    if (hit) out.push({ verse: String(v), text: hit.text, lang: hit.lang });
  }
  return out;
}
