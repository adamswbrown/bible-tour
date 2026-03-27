const BASE_BOOKS = [
  { id: 1, testament: "Old Testament", book: "Genesis", abbrev: "GEN", refs: "12:2-3 and 50:20" },
  { id: 2, testament: "Old Testament", book: "Exodus", abbrev: "EXO", refs: "3:7-8 and 20:1-17" },
  { id: 3, testament: "Old Testament", book: "Leviticus", abbrev: "LEV", refs: "19:1-2" },
  { id: 4, testament: "Old Testament", book: "Numbers", abbrev: "NUM", refs: "14:33-34" },
  { id: 5, testament: "Old Testament", book: "Deuteronomy", abbrev: "DEU", refs: "6:4-5" },
  { id: 6, testament: "Old Testament", book: "Joshua", abbrev: "JOS", refs: "1:6 and 24:15" },
  { id: 7, testament: "Old Testament", book: "Judges", abbrev: "JDG", refs: "21:25" },
  { id: 8, testament: "Old Testament", book: "Ruth", abbrev: "RUT", refs: "1:16" },
  { id: 9, testament: "Old Testament", book: "I Samuel", abbrev: "1SA", apiName: "1 Samuel", refs: "8:5, 15:22 and 16:7" },
  { id: 10, testament: "Old Testament", book: "II Samuel", abbrev: "2SA", apiName: "2 Samuel", refs: "7:16" },
  { id: 11, testament: "Old Testament", book: "I Kings", abbrev: "1KI", apiName: "1 Kings", refs: "9:1-9 and 18:21" },
  { id: 12, testament: "Old Testament", book: "II Kings", abbrev: "2KI", apiName: "2 Kings", refs: "17:13-14" },
  { id: 13, testament: "Old Testament", book: "I Chronicles", abbrev: "1CH", apiName: "1 Chronicles", refs: "29:10-11" },
  { id: 14, testament: "Old Testament", book: "II Chronicles", abbrev: "2CH", apiName: "2 Chronicles", refs: "7:14" },
  { id: 15, testament: "Old Testament", book: "Ezra", abbrev: "EZR", refs: "1:3 and 7:10" },
  { id: 16, testament: "Old Testament", book: "Nehemiah", abbrev: "NEH", refs: "1:4-11 and 2:18" },
  { id: 17, testament: "Old Testament", book: "Esther", abbrev: "EST", refs: "4:14-16" },
  { id: 18, testament: "Old Testament", book: "Job", abbrev: "JOB", refs: "1:21" },
  { id: 19, testament: "Old Testament", book: "Psalms", abbrev: "PSA", refs: "23:1 and 46:1" },
  { id: 20, testament: "Old Testament", book: "Proverbs", abbrev: "PRO", refs: "1:7, 9:10 and any five random proverbs from chapters 10-29" },
  { id: 21, testament: "Old Testament", book: "Ecclesiastes", abbrev: "ECC", refs: "1:2 and 12:13" },
  { id: 22, testament: "Old Testament", book: "Song of Songs", abbrev: "SNG", apiName: "Song of Solomon", refs: "8:6-7" },
  { id: 23, testament: "Old Testament", book: "Isaiah", abbrev: "ISA", refs: "1:18 and 52:13-53:12" },
  { id: 24, testament: "Old Testament", book: "Jeremiah", abbrev: "JER", refs: "3:12-13 and 31:33" },
  { id: 25, testament: "Old Testament", book: "Lamentations", abbrev: "LAM", refs: "3:22-23" },
  { id: 26, testament: "Old Testament", book: "Ezekiel", abbrev: "EZK", refs: "36:26" },
  { id: 27, testament: "Old Testament", book: "Daniel", abbrev: "DAN", refs: "2:44 and 7:13-14" },
  { id: 28, testament: "Old Testament", book: "Hosea", abbrev: "HOS", refs: "6:6" },
  { id: 29, testament: "Old Testament", book: "Joel", abbrev: "JOL", refs: "2:13-14" },
  { id: 30, testament: "Old Testament", book: "Amos", abbrev: "AMO", refs: "5:24 and 7:7-8" },
  { id: 31, testament: "Old Testament", book: "Obadiah", abbrev: "OBA", refs: "1:13-15 and 1:21" },
  { id: 32, testament: "Old Testament", book: "Jonah", abbrev: "JON", refs: "4:2" },
  { id: 33, testament: "Old Testament", book: "Micah", abbrev: "MIC", refs: "6:8" },
  { id: 34, testament: "Old Testament", book: "Nahum", abbrev: "NAM", refs: "1:7-8" },
  { id: 35, testament: "Old Testament", book: "Habakkuk", abbrev: "HAB", refs: "2:4" },
  { id: 36, testament: "Old Testament", book: "Zephaniah", abbrev: "ZEP", refs: "3:17" },
  { id: 37, testament: "Old Testament", book: "Haggai", abbrev: "HAG", refs: "1:8" },
  { id: 38, testament: "Old Testament", book: "Zechariah", abbrev: "ZEC", refs: "9:9-10" },
  { id: 39, testament: "Old Testament", book: "Malachi", abbrev: "MAL", refs: "3:1 and 4:2" },
  { id: 40, testament: "New Testament", book: "Matthew", abbrev: "MAT", refs: "5:17, 16:6 and 28:18-20", note: "If you have extra time, also read 5:1-29" },
  { id: 41, testament: "New Testament", book: "Mark", abbrev: "MRK", refs: "1:1 and 10:45" },
  { id: 42, testament: "New Testament", book: "Luke", abbrev: "LUK", refs: "19:10 and 24:1-12" },
  { id: 43, testament: "New Testament", book: "John", abbrev: "JHN", refs: "1:1-3, 3:16, 14:6 and 20:31" },
  { id: 44, testament: "New Testament", book: "Acts", abbrev: "ACT", refs: "1:8 and 2:38" },
  { id: 45, testament: "New Testament", book: "Romans", abbrev: "ROM", refs: "1:16-17, 3:23, 6:23 and 10:9" },
  { id: 46, testament: "New Testament", book: "I Corinthians", abbrev: "1CO", apiName: "1 Corinthians", refs: "1:10 and 15:3-4" },
  { id: 47, testament: "New Testament", book: "II Corinthians", abbrev: "2CO", apiName: "2 Corinthians", refs: "5:17 and 5:20" },
  { id: 48, testament: "New Testament", book: "Galatians", abbrev: "GAL", refs: "2:16, 5:1 and 5:22-26" },
  { id: 49, testament: "New Testament", book: "Ephesians", abbrev: "EPH", refs: "2:8-10 and 6:10-17" },
  { id: 50, testament: "New Testament", book: "Philippians", abbrev: "PHP", refs: "2:5-11" },
  { id: 51, testament: "New Testament", book: "Colossians", abbrev: "COL", refs: "1:15-18" },
  { id: 52, testament: "New Testament", book: "I Thessalonians", abbrev: "1TH", apiName: "1 Thessalonians", refs: "4:16-18" },
  { id: 53, testament: "New Testament", book: "II Thessalonians", abbrev: "2TH", apiName: "2 Thessalonians", refs: "2:15 and 3:13" },
  { id: 54, testament: "New Testament", book: "I Timothy", abbrev: "1TI", apiName: "1 Timothy", refs: "1:15, 2:5-6 and 3:15" },
  { id: 55, testament: "New Testament", book: "II Timothy", abbrev: "2TI", apiName: "2 Timothy", refs: "4:7-8" },
  { id: 56, testament: "New Testament", book: "Titus", abbrev: "TIT", refs: "2:11-15" },
  { id: 57, testament: "New Testament", book: "Philemon", abbrev: "PHM", refs: "1:15-16" },
  { id: 58, testament: "New Testament", book: "Hebrews", abbrev: "HEB", refs: "4:4 and 12:1" },
  { id: 59, testament: "New Testament", book: "James", abbrev: "JAS", refs: "1:22" },
  { id: 60, testament: "New Testament", book: "I Peter", abbrev: "1PE", apiName: "1 Peter", refs: "1:3-5 and 2:9-12" },
  { id: 61, testament: "New Testament", book: "II Peter", abbrev: "2PE", apiName: "2 Peter", refs: "1:3-7 and 3:9" },
  { id: 62, testament: "New Testament", book: "I John", abbrev: "1JN", apiName: "1 John", refs: "1:5-7" },
  { id: 63, testament: "New Testament", book: "II John", abbrev: "2JN", apiName: "2 John", refs: "1:6" },
  { id: 64, testament: "New Testament", book: "III John", abbrev: "3JN", apiName: "3 John", refs: "1:8" },
  { id: 65, testament: "New Testament", book: "Jude", abbrev: "JUD", refs: "1:3 and 1:23-24" },
  { id: 66, testament: "New Testament", book: "Revelation", abbrev: "REV", refs: "1:7-8, 21:5 and 22:20-21" },
];

export function slugifyBookName(book) {
  return book
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumericBookName(book) {
  return book
    .replace(/^III\s+/, "3 ")
    .replace(/^II\s+/, "2 ")
    .replace(/^I\s+/, "1 ");
}

export const BOOKS = BASE_BOOKS.map((entry) => ({
  ...entry,
  slug: slugifyBookName(entry.book),
  numericSlug: slugifyBookName(toNumericBookName(entry.book)),
}));

export const TOTAL = BOOKS.length;

export const READING_PLAN = {
  "Old Testament": BOOKS.filter((book) => book.testament === "Old Testament").map(({ book, refs, note }) => ({ book, refs, note })),
  "New Testament": BOOKS.filter((book) => book.testament === "New Testament").map(({ book, refs, note }) => ({ book, refs, note })),
};

export const BOOK_ABBREV = Object.fromEntries(BOOKS.map(({ book, abbrev }) => [book, abbrev]));

export const API_BOOK_NAMES = Object.fromEntries(
  BOOKS.filter(({ apiName }) => apiName).map(({ book, apiName }) => [book, apiName])
);

export const BOOK_IDS = Object.fromEntries(BOOKS.map(({ book, id }) => [book, id]));

export const BOOKS_BY_NAME = Object.fromEntries(BOOKS.map((entry) => [entry.book, entry]));

export const BOOKS_BY_SLUG = BOOKS.reduce((acc, entry) => {
  acc[entry.slug] = entry;
  acc[entry.numericSlug] = entry;
  return acc;
}, {});

export function getBookEntry(value) {
  return BOOKS_BY_NAME[value] || BOOKS_BY_SLUG[value] || null;
}

export function getBookPath(book) {
  const entry = BOOKS_BY_NAME[book];
  return entry ? `/eagle/${entry.slug}` : null;
}

export function splitPlanRefs(refs) {
  return refs
    .split(/\s+and\s+|,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parsePlanRef(text) {
  const value = text.trim();

  const chapterSpanMatch = value.match(/chapters?\s+(\d+)-(\d+)/i);
  if (chapterSpanMatch) {
    return {
      text: value,
      kind: "chapter-span",
      isStructured: true,
      startChapter: Number(chapterSpanMatch[1]),
      endChapter: Number(chapterSpanMatch[2]),
      startVerse: null,
      endVerse: null,
    };
  }

  const crossChapterMatch = value.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (crossChapterMatch) {
    return {
      text: value,
      kind: "cross-chapter-range",
      isStructured: true,
      startChapter: Number(crossChapterMatch[1]),
      startVerse: Number(crossChapterMatch[2]),
      endChapter: Number(crossChapterMatch[3]),
      endVerse: Number(crossChapterMatch[4]),
    };
  }

  const sameChapterRangeMatch = value.match(/^(\d+):(\d+)-(\d+)$/);
  if (sameChapterRangeMatch) {
    return {
      text: value,
      kind: "range",
      isStructured: true,
      startChapter: Number(sameChapterRangeMatch[1]),
      startVerse: Number(sameChapterRangeMatch[2]),
      endChapter: Number(sameChapterRangeMatch[1]),
      endVerse: Number(sameChapterRangeMatch[3]),
    };
  }

  const singleVerseMatch = value.match(/^(\d+):(\d+)$/);
  if (singleVerseMatch) {
    return {
      text: value,
      kind: "verse",
      isStructured: true,
      startChapter: Number(singleVerseMatch[1]),
      startVerse: Number(singleVerseMatch[2]),
      endChapter: Number(singleVerseMatch[1]),
      endVerse: Number(singleVerseMatch[2]),
    };
  }

  return {
    text: value,
    kind: "text",
    isStructured: false,
    startChapter: null,
    startVerse: null,
    endChapter: null,
    endVerse: null,
  };
}

export function parsePlanRefs(refs) {
  return splitPlanRefs(refs).map(parsePlanRef);
}
