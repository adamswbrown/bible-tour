import canonData from "../data/canon.json";

export const CANON_SOURCE = canonData._source || null;

export function getVerseCount(bookAbbrev, chapter) {
  const entry = canonData.books?.[bookAbbrev];
  if (!entry) return null;

  const idx = Number(chapter) - 1;
  const count = entry.verseCounts?.[idx];
  return Number.isFinite(count) ? count : null;
}

export function getChapterCount(bookAbbrev) {
  const entry = canonData.books?.[bookAbbrev];
  return entry?.chapterCount ?? null;
}
