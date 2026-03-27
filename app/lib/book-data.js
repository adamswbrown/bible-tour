import bookInfoData from "../data/book-info.json";
import chapterSummariesData from "../data/chapter-summaries.json";

export const CHAPTER_SUMMARY_ATTRIBUTION = chapterSummariesData._attribution || null;
export const CHAPTER_SUMMARY_SOURCE = chapterSummariesData._source || null;

export function normalizeBookInfo(raw) {
  if (!raw) return null;

  const info = Array.isArray(raw) ? raw[0] : raw;
  if (!info || typeof info !== "object") return null;

  const normalized = { ...info };
  const chapterCount = Number(info.chapterCount);
  if (Number.isFinite(chapterCount) && chapterCount > 0) {
    normalized.chapterCount = chapterCount;
  }

  return normalized;
}

export function hasMeaningfulBookInfo(info) {
  if (!info) return false;

  return Boolean(
    info.author ||
      info.date ||
      info.audience ||
      info.purpose ||
      info.introduction ||
      info.introduction_long ||
      info.summary ||
      info.intro
  );
}

export function getLocalBookInfo(book) {
  // Support both flat { "Book": {...} } and nested { books: { "Book": {...} } } shapes
  const raw = bookInfoData.books?.[book] ?? bookInfoData[book];
  return normalizeBookInfo(raw);
}

export function getChapterSummaries(book) {
  const summaries = chapterSummariesData.books?.[book];
  if (!summaries || typeof summaries !== "object") return [];

  return Object.entries(summaries)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([chapter, summary]) => ({
      chapter: Number(chapter),
      summary,
    }));
}
