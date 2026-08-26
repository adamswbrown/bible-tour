import { BOOKS, type Book } from './readingPlan';

export type Translation = {
  id: string;
  name: string;
  abbr: string;
  youVersionId: number;
  yvLicensed: boolean;
  esvLicensed?: boolean;
  copyrighted?: boolean; // true → no inline render, deep-link to YouVersion only
  original?: boolean; // true → render bundled Hebrew/Aramaic/Greek text, no network fetch
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
    id: 'bsb', name: 'Berean Standard Bible', abbr: 'BSB',
    youVersionId: 3034, yvLicensed: true,
    copyright: 'The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. This text of God’s Word has been dedicated to the public domain.',
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
  {
    id: 'drc', name: 'Douay-Rheims (Challoner)', abbr: 'DRC',
    youVersionId: 55, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'nabre', name: 'New American Bible (Revised Edition)', abbr: 'NABRE',
    youVersionId: 463, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'nrsvci', name: 'NRSV Catholic Interconfessional', abbr: 'NRSV-CI',
    youVersionId: 2015, yvLicensed: false, copyrighted: true,
  },
  {
    id: 'original', name: 'Original (Hebrew / Aramaic / Greek)', abbr: 'ORIG',
    youVersionId: 1, yvLicensed: false, original: true,
    copyright: 'Hebrew and Aramaic text from the Westminster Leningrad Codex via Open Scriptures (CC BY 4.0). Greek text from the SBLGNT, edited by Michael W. Holmes, with MorphGNT morphology (CC BY-SA 4.0).',
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
// bible.com versions whose Psalms follow the Greek/Vulgate numbering
// instead of the Hebrew (Masoretic) numbering the reading plan uses.
// Mirrors app/lib/translations.js.
const VULGATE_PSALM_VERSIONS = new Set([55]);

// Hebrew psalm number -> Vulgate/Septuagint psalm number. The traditions
// diverge because the Greek merges Hebrew 9-10 and 114-115, and splits
// Hebrew 116 and 147; everything between those seams is offset by one.
function hebrewPsalmToVulgate(chapter: number, verse: number): number {
  if (chapter <= 8) return chapter;
  if (chapter <= 10) return 9;
  if (chapter <= 113) return chapter - 1;
  if (chapter <= 115) return 113;
  if (chapter === 116) return verse <= 9 ? 114 : 115;
  if (chapter <= 146) return chapter - 1;
  if (chapter === 147) return verse <= 11 ? 146 : 147;
  return chapter;
}

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
  const bibleId = translationId || 111;

  // A Vulgate-numbered Psalter needs the chapter remapped, or the link
  // lands on the wrong psalm. Those editions also count the
  // superscription as verse 1, so link to the whole psalm rather than to
  // a verse we'd get wrong.
  if (abbrev === 'PSA' && VULGATE_PSALM_VERSIONS.has(Number(bibleId))) {
    const firstVerse = parseInt(verses, 10);
    const mapped = hebrewPsalmToVulgate(
      Number(chapter),
      Number.isFinite(firstVerse) ? firstVerse : 1,
    );
    return `https://www.bible.com/bible/${bibleId}/${abbrev}.${mapped}`;
  }

  return `https://www.bible.com/bible/${bibleId}/${abbrev}.${chapter}.${verses}`;
}

// Bible Hub files its interlinear pages under a slugged book name:
// lowercase, underscores, numbered books as "1_samuel". Song of Songs is
// the one book Bible Hub files somewhere our name doesn't predict.
const BIBLEHUB_SLUG_OVERRIDES: Record<string, string> = { 'Song of Songs': 'songs' };

function bibleHubSlug(book: string): string {
  const override = BIBLEHUB_SLUG_OVERRIDES[book];
  if (override) return override;
  return book
    .replace(/^III\s+/, '3 ')
    .replace(/^II\s+/, '2 ')
    .replace(/^I\s+/, '1 ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Bible Hub's interlinear for a reference — Hebrew/Aramaic for the Old
// Testament, Greek for the New, chosen by the book. Interlinear pages are
// per-verse, so a range links to the verse it starts at.
export function buildInterlinearUrl(book: string, ref: string): string | null {
  if (!ABBREV_BY_NAME[book]) return null;
  const m = String(ref).trim().match(/^(\d+):(\d+)/);
  if (!m) return null;
  return `https://biblehub.com/interlinear/${bibleHubSlug(book)}/${m[1]}-${m[2]}.htm`;
}
