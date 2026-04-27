const BASE = 'https://bible-tour.vercel.app';

export type VerseResult = {
  text: string;
  reference: string;
  copyright?: string;
  translation?: string;
};

export async function fetchVerse(
  book: string,
  ref: string,
  translationId: string,
): Promise<VerseResult> {
  const params = new URLSearchParams({ book, ref, translation: translationId });
  const res = await fetch(`${BASE}/api/verse?${params}`);
  if (!res.ok) throw new Error(`verse fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchVerseEsv(book: string, ref: string): Promise<VerseResult> {
  const params = new URLSearchParams({ book, ref });
  const res = await fetch(`${BASE}/api/verse-esv?${params}`);
  if (!res.ok) throw new Error(`ESV fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAudioUrl(book: string, ref: string): Promise<string> {
  const params = new URLSearchParams({ book, ref });
  const res = await fetch(`${BASE}/api/verse-audio?${params}`);
  if (!res.ok) throw new Error(`audio fetch failed: ${res.status}`);
  const data = await res.json();
  return data.url as string;
}
