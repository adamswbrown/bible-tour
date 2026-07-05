// Lookup helpers for the Original (Hebrew / Greek) translation — the
// mobile mirror of app/lib/originals.js. Data is keyed by English verse
// ID (e.g. "GEN.12.2", "JHN.3.16"); the build script bakes in the few
// English-to-Hebrew versification offsets, so callers always pass
// English references.
import originalVerses from '../data/original-verses.json';
import { BOOKS, type Book } from './readingPlan';
import { toVerseIds } from './study';

export type OriginalVerse = { verse: string; text: string; lang: 'hbo' | 'grc' };

const ORIGINALS = originalVerses as Record<string, { lang: string; text: string }>;

const ABBREV_BY_NAME = Object.fromEntries(
  BOOKS.map((b: Book) => [b.book, b.abbrev]),
) as Record<string, string>;

// Returns { verse, text, lang } for every verse of the (book, ref) present
// in the bundled data. Verses we don't ship are skipped, not padded.
// Returns [] when nothing matches — callers should treat that as "this
// verse isn't available in the Original translation."
export function getOriginalVerses(book: string, ref: string): OriginalVerse[] {
  const abbrev = ABBREV_BY_NAME[book];
  if (!abbrev) return [];

  // Cross-chapter ranges ("1:26-2:3") aren't handled by study.ts's
  // single-chapter expander — walk the chapters with the same 200-verse
  // cap the web uses. Missing keys fall out in the lookup below.
  const ids: { verseNum: number; verseId: string }[] = [];
  const cross = String(ref).trim().match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (cross) {
    const startCh = parseInt(cross[1], 10);
    const startV = parseInt(cross[2], 10);
    const endCh = parseInt(cross[3], 10);
    const endV = parseInt(cross[4], 10);
    for (let ch = startCh; ch <= endCh; ch++) {
      const from = ch === startCh ? startV : 1;
      const to = ch === endCh ? endV : 200;
      for (let v = from; v <= to; v++) {
        ids.push({ verseNum: v, verseId: `${abbrev}.${ch}.${v}` });
      }
    }
  } else {
    ids.push(...toVerseIds(book, ref));
  }

  const out: OriginalVerse[] = [];
  for (const { verseNum, verseId } of ids) {
    const hit = ORIGINALS[verseId];
    if (hit) out.push({ verse: String(verseNum), text: hit.text, lang: hit.lang as 'hbo' | 'grc' });
  }
  return out;
}
