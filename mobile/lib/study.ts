import taggedVerses from '../data/tagged-verses.json';
import lexicon from '../data/lexicon.json';
import { BOOKS, type Book } from './readingPlan';

export type StudyToken = { w: string; s: string | null };
export type LexiconEntry = {
  lemma?: string;
  translit?: string;
  pos?: string;
  gloss?: string;
  entry?: string;
};

const ABBREV_BY_NAME = Object.fromEntries(
  BOOKS.map((b: Book) => [b.book, b.abbrev]),
) as Record<string, string>;

const TAGGED = taggedVerses as Record<string, StudyToken[]>;
const LEXICON = lexicon as Record<string, LexiconEntry>;

export function toVerseId(book: string, ref: string): string | null {
  const abbrev = ABBREV_BY_NAME[book];
  if (!abbrev || !ref) return null;
  const m = String(ref).trim().match(/^(\d+):(\d+)/);
  if (!m) return null;
  return `${abbrev}.${m[1]}.${m[2]}`;
}

// Expand a reading-plan ref into every verse ID it covers so the
// Originals view can render the full passage instead of just the
// first verse. Handles single verses ("3:16") and same-chapter
// ranges ("20:1-17"). Cross-chapter ranges aren't used by any
// current reading-plan ref; for those we fall back to the first
// verse so the UI still shows something.
export function toVerseIds(book: string, ref: string): string[] {
  const abbrev = ABBREV_BY_NAME[book];
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
    const ids: string[] = [];
    for (let v = start; v <= end; v += 1) ids.push(`${abbrev}.${c}.${v}`);
    return ids;
  }

  // Fallback for unrecognised shapes — keep behaviour predictable.
  const id = toVerseId(book, ref);
  return id ? [id] : [];
}

export function hasStudy(verseId: string | null): boolean {
  if (!verseId) return false;
  return Object.prototype.hasOwnProperty.call(TAGGED, verseId);
}

export function getTokens(verseId: string | null): StudyToken[] | null {
  if (!verseId) return null;
  return TAGGED[verseId] ?? null;
}

export function getEntry(strongsId: string | null): LexiconEntry | null {
  if (!strongsId) return null;
  return LEXICON[strongsId] ?? null;
}
