// Library — flat, addressable catalogue of curated verse refs.
//
// Ported from app/lib/bible.js (parsePlanRef + READING_PLAN derivation).
// Mobile keeps the source of truth in BOOKS; this module just unwraps the
// "refs" string per book into individually-addressable entries that the
// Memory tab's Library segment can render and toggle.

import { BOOKS } from './readingPlan';

export type ParsedRefKind =
  | 'verse'
  | 'range'
  | 'cross-chapter-range'
  | 'chapter-span'
  | 'text';

export type ParsedRef = {
  text: string;
  kind: ParsedRefKind;
  isStructured: boolean;
};

function splitPlanRefs(refs: string): string[] {
  return refs
    .split(/\s+and\s+|,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parsePlanRef(text: string): ParsedRef {
  const value = text.trim();

  if (/chapters?\s+\d+-\d+/i.test(value)) {
    return { text: value, kind: 'chapter-span', isStructured: true };
  }
  if (/^\d+:\d+-\d+:\d+$/.test(value)) {
    return { text: value, kind: 'cross-chapter-range', isStructured: true };
  }
  if (/^\d+:\d+-\d+$/.test(value)) {
    return { text: value, kind: 'range', isStructured: true };
  }
  if (/^\d+:\d+$/.test(value)) {
    return { text: value, kind: 'verse', isStructured: true };
  }
  return { text: value, kind: 'text', isStructured: false };
}

export function parsePlanRefs(refs: string): ParsedRef[] {
  return splitPlanRefs(refs).map(parsePlanRef);
}

export type LibraryRef = {
  section: 'Old Testament' | 'New Testament';
  book: string;
  verseRef: string;
};

// Filter mirrors the web's PICKER: drop chapter-spans (not individually
// addressable in the verse reader) and the fuzzy "text" kind (e.g.
// "any five random proverbs from chapters 10-29").
export const LIBRARY_REFS: LibraryRef[] = (() => {
  const out: LibraryRef[] = [];
  for (const entry of BOOKS) {
    for (const p of parsePlanRefs(entry.refs)) {
      if (p.isStructured && p.kind !== 'chapter-span') {
        out.push({ section: entry.testament, book: entry.book, verseRef: p.text });
      }
    }
  }
  return out;
})();

export type LibrarySection = {
  title: string;
  data: { book: string; refs: string[] }[];
};

export function librarySections(): LibrarySection[] {
  const bySection = new Map<string, Map<string, string[]>>();
  for (const r of LIBRARY_REFS) {
    if (!bySection.has(r.section)) bySection.set(r.section, new Map());
    const byBook = bySection.get(r.section)!;
    if (!byBook.has(r.book)) byBook.set(r.book, []);
    byBook.get(r.book)!.push(r.verseRef);
  }
  return Array.from(bySection.entries()).map(([title, byBook]) => ({
    title,
    data: Array.from(byBook.entries()).map(([book, refs]) => ({ book, refs })),
  }));
}

export const LIBRARY_TOTAL = LIBRARY_REFS.length;
