import { BOOKS, type Book } from './readingPlan';
import { getTranslation } from './translations';

const BASE = 'https://bible-tour.vercel.app';

export type VerseResult = {
  text: string;
  reference: string;
  copyright?: string;
};

const ABBREV_BY_NAME = Object.fromEntries(
  BOOKS.map((b: Book) => [b.book, b.abbrev]),
) as Record<string, string>;

const API_NAME_BY_BOOK = Object.fromEntries(
  BOOKS.map((b: Book) => [b.book, b.apiName ?? b.book]),
) as Record<string, string>;

export function buildUsfmParts(book: string, ref: string): string[] | null {
  const abbrev = ABBREV_BY_NAME[book];
  if (!abbrev) return null;

  const dash = ref.match(/^(\d+:\d+)-(\d+(?::\d+)?)$/);
  if (!dash) {
    return [`${abbrev}.${ref.replace(':', '.')}`];
  }

  const start = dash[1];
  const end = dash[2];
  if (end.includes(':')) {
    const [startCh, startV] = start.split(':');
    const [endCh, endV] = end.split(':');
    const parts: string[] = [];
    parts.push(`${abbrev}.${startCh}.${startV}-200`);
    for (let ch = parseInt(startCh, 10) + 1; ch < parseInt(endCh, 10); ch += 1) {
      parts.push(`${abbrev}.${ch}`);
    }
    parts.push(`${abbrev}.${endCh}.1-${endV}`);
    return parts;
  }

  return [`${abbrev}.${start.replace(':', '.')}-${end}`];
}

async function fetchYouVersion(
  book: string,
  ref: string,
  bibleId: number,
): Promise<string> {
  const parts = buildUsfmParts(book, ref);
  if (!parts) throw new Error('Could not build USFM');

  const chunks = await Promise.all(
    parts.map(async (usfm) => {
      const res = await fetch(
        `${BASE}/api/verse?bible_id=${bibleId}&usfm=${encodeURIComponent(usfm)}`,
      );
      if (!res.ok) throw new Error(`YouVersion fetch failed: ${res.status}`);
      const data = await res.json();
      return ((data.content || data.text) ?? '').trim();
    }),
  );

  return chunks.filter(Boolean).join('\n\n');
}

async function fetchEsv(book: string, ref: string): Promise<string> {
  const params = new URLSearchParams({ book, ref });
  const res = await fetch(`${BASE}/api/verse-esv?${params}`);
  if (!res.ok) throw new Error(`ESV fetch failed: ${res.status}`);
  const data = await res.json();
  return data.text || '';
}

async function fetchBibleApi(
  book: string,
  ref: string,
  apiCode: string,
): Promise<string> {
  const apiName = API_NAME_BY_BOOK[book] ?? book;
  const query = encodeURIComponent(`${apiName} ${ref}`);
  const res = await fetch(`https://bible-api.com/${query}?translation=${apiCode}`);
  if (!res.ok) throw new Error(`bible-api fetch failed: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data.verses) && data.verses.length > 0) {
    return data.verses.map((v: { text: string }) => v.text.trim()).join('\n\n');
  }
  return (data.text || '').trim();
}

export async function fetchVerse(
  book: string,
  ref: string,
  translationId: string,
): Promise<VerseResult> {
  const t = getTranslation(translationId);
  const reference = `${book} ${ref}`;

  // Copyrighted translations have no inline render path — verse.tsx
  // shows a YouVersion deep-link button instead.
  if (t.copyrighted) {
    return { text: '', reference, copyright: t.copyright };
  }

  let text = '';
  if (t.esvLicensed) {
    text = await fetchEsv(book, ref);
  } else if (t.yvLicensed) {
    text = await fetchYouVersion(book, ref, t.youVersionId);
  } else {
    const apiCode =
      t.id === 'kjv' ? 'kjv' : t.id === 'web' ? 'web' : t.id === 'asv' ? 'asv' : null;
    if (apiCode) {
      text = await fetchBibleApi(book, ref, apiCode);
    } else {
      text = await fetchYouVersion(book, ref, t.youVersionId);
    }
  }

  return { text, reference, copyright: t.copyright };
}
