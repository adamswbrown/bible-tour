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
