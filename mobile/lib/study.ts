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

// Expand a reading-plan ref like "12:2-3" or "8:5,7,10-12" into one entry per
// verse so Originals mode can show the whole range, not just the first verse.
export function toVerseIds(
  book: string,
  ref: string,
): { verseNum: number; verseId: string }[] {
  const abbrev = ABBREV_BY_NAME[book];
  if (!abbrev || !ref) return [];
  const m = String(ref).trim().match(/^(\d+):([\d,\-\s]+)/);
  if (!m) return [];
  const chapter = m[1];
  const out: { verseNum: number; verseId: string }[] = [];
  for (const seg of m[2].split(',')) {
    const range = seg.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!range) continue;
    const start = parseInt(range[1], 10);
    const end = range[2] ? parseInt(range[2], 10) : start;
    if (isNaN(start) || isNaN(end) || end < start) continue;
    for (let v = start; v <= end; v++) {
      out.push({ verseNum: v, verseId: `${abbrev}.${chapter}.${v}` });
    }
  }
  return out;
}

export function hasStudy(verseId: string | null): boolean {
  if (!verseId) return false;
  return Object.prototype.hasOwnProperty.call(TAGGED, verseId);
}

// True if ANY verse in the (possibly multi-verse) ref has lexicon data.
export function hasStudyForRef(book: string, ref: string): boolean {
  return toVerseIds(book, ref).some(({ verseId }) => hasStudy(verseId));
}

export function getTokens(verseId: string | null): StudyToken[] | null {
  if (!verseId) return null;
  return TAGGED[verseId] ?? null;
}

// Tokens for every verse in the range. Drops verses we don't have data for.
export function getTokensForRef(
  book: string,
  ref: string,
): { verseNum: number; tokens: StudyToken[] }[] {
  return toVerseIds(book, ref)
    .map(({ verseNum, verseId }) => ({ verseNum, tokens: getTokens(verseId) }))
    .filter((x): x is { verseNum: number; tokens: StudyToken[] } => x.tokens !== null);
}

export function getEntry(strongsId: string | null): LexiconEntry | null {
  if (!strongsId) return null;
  return LEXICON[strongsId] ?? null;
}
