import { BOOKS, type Book } from './readingPlan';

export type Translation = {
  id: string;
  name: string;
  abbr: string;
  youVersionId: number;
  yvLicensed: boolean;
  esvLicensed?: boolean;
  copyrighted?: boolean; // true → no inline render, deep-link to YouVersion only
  copyright?: string;
};

export const TRANSLATIONS: Translation[] = [
  {
    id: 'kjv', name: 'King James Version', abbr: 'KJV',
    youVersionId: 1, yvLicensed: false,
  },
  {
    id: 'niv', name: 'New International Version', abbr: 'NIV',
    youVersionId: 111, yvLicensed: true,
    copyright: 'Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  },
  {
    id: 'nirv', name: "New International Reader's Version", abbr: 'NIrV',
    youVersionId: 110, yvLicensed: true,
    copyright: 'Copyright ©1995, 1996, 1998, 2014 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  },
  {
    id: 'nivuk', name: 'NIV (Anglicised)', abbr: 'NIVUK',
    youVersionId: 113, yvLicensed: true,
    copyright: 'Holy Bible, New International Version® Anglicised, NIV® Copyright ©1979, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  },
  {
    id: 'esv', name: 'English Standard Version', abbr: 'ESV',
    youVersionId: 59, yvLicensed: false, esvLicensed: true,
    copyright: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
  },
  {
    id: 'nkjv', name: 'New King James Version', abbr: 'NKJV',
    youVersionId: 114, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'nlt', name: 'New Living Translation', abbr: 'NLT',
    youVersionId: 116, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'csb', name: 'Christian Standard Bible', abbr: 'CSB',
    youVersionId: 1713, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'msg', name: 'The Message', abbr: 'MSG',
    youVersionId: 97, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'web', name: 'World English Bible', abbr: 'WEB',
    youVersionId: 206, yvLicensed: false,
  },
  {
    id: 'asv', name: 'American Standard Version', abbr: 'ASV',
    youVersionId: 12, yvLicensed: false,
  },
];

export const DEFAULT_TRANSLATION = 'niv';

export function getTranslation(id: string): Translation {
  return TRANSLATIONS.find(t => t.id === id) ?? TRANSLATIONS[0];
}

const ABBREV_BY_NAME = Object.fromEntries(
  BOOKS.map((b: Book) => [b.book, b.abbrev]),
) as Record<string, string>;

// Builds a bible.com deep link for a passage. iOS users with the
// YouVersion app installed open it natively; others get the website.
export function buildYouVersionUrl(
  book: string,
  ref: string,
  translationId: number,
): string | null {
  const abbrev = ABBREV_BY_NAME[book];
  if (!abbrev) return null;
  const m = ref.match(/^(\d+):(.+)$/);
  if (!m) return null;
  const chapter = m[1];
  const verses = m[2];
  return `https://www.bible.com/bible/${translationId || 111}/${abbrev}.${chapter}.${verses}`;
}
