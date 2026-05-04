import canon from "../data/canon.json";

/**
 * Returns the static canon entry for a book, or null if missing.
 * Books are keyed by canonical name (matching the `book` field in BOOKS).
 */
export function getCanonEntry(book) {
  if (!book) return null;
  return canon[book] || null;
}

/**
 * Returns the verse count for a given book + chapter (1-indexed),
 * or null if the book or chapter is missing.
 */
export function getCanonVerseCount(book, chapter) {
  const entry = getCanonEntry(book);
  if (!entry) return null;

  const index = Number(chapter);
  if (!Number.isInteger(index) || index < 1) return null;

  const count = entry.verseCounts[index - 1];
  return Number.isFinite(count) ? count : null;
}

/**
 * Returns the chapter count for a given book, or null if missing.
 */
export function getCanonChapterCount(book) {
  const entry = getCanonEntry(book);
  if (!entry) return null;
  return Number.isFinite(entry.chapterCount) ? entry.chapterCount : null;
}
