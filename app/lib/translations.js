import { API_BOOK_NAMES, BOOK_ABBREV, BIBLEHUB_SLUGS, parsePlanRef } from "./bible";

export const TRANSLATIONS = [
  { id: "kjv", name: "King James Version", abbr: "KJV", apiCode: "kjv", youVersionId: 1, yvLicensed: false },
  { id: "niv", name: "New International Version", abbr: "NIV", apiCode: null, youVersionId: 111, yvLicensed: true,
    copyright: "Holy Bible, New International Version\u00ae, NIV\u00ae Copyright \u00a91973, 1978, 1984, 2011 by Biblica, Inc.\u00ae Used by permission. All rights reserved worldwide." },
  { id: "nirv", name: "New International Reader\u2019s Version", abbr: "NIrV", apiCode: null, youVersionId: 110, yvLicensed: true,
    copyright: "Copyright \u00a91995, 1996, 1998, 2014 by Biblica, Inc.\u00ae Used by permission. All rights reserved worldwide." },
  { id: "nivuk", name: "NIV (Anglicised)", abbr: "NIVUK", apiCode: null, youVersionId: 113, yvLicensed: true,
    copyright: "Holy Bible, New International Version\u00ae Anglicised, NIV\u00ae Copyright \u00a91979, 1984, 2011 by Biblica, Inc.\u00ae Used by permission. All rights reserved worldwide." },
  { id: "esv", name: "English Standard Version", abbr: "ESV", apiCode: null, youVersionId: 59, yvLicensed: false, esvLicensed: true,
    copyright: "Scripture quotations are from the ESV\u00ae Bible (The Holy Bible, English Standard Version\u00ae), copyright \u00a9 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved." },
  { id: "bsb", name: "Berean Standard Bible", abbr: "BSB", apiCode: null, youVersionId: 3034, yvLicensed: true,
    copyright: "The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. This text of God's Word has been dedicated to the public domain." },
  { id: "nkjv", name: "New King James Version", abbr: "NKJV", apiCode: null, youVersionId: 114, yvLicensed: false },
  { id: "nlt", name: "New Living Translation", abbr: "NLT", apiCode: null, youVersionId: 116, yvLicensed: false },
  { id: "csb", name: "Christian Standard Bible", abbr: "CSB", apiCode: null, youVersionId: 1713, yvLicensed: false },
  { id: "msg", name: "The Message", abbr: "MSG", apiCode: null, youVersionId: 97, yvLicensed: false },
  { id: "web", name: "World English Bible", abbr: "WEB", apiCode: "web", youVersionId: 206, yvLicensed: false },
  { id: "asv", name: "American Standard Version", abbr: "ASV", apiCode: "asv", youVersionId: 12, yvLicensed: false },
  { id: "drc", name: "Douay-Rheims (Challoner)", abbr: "DRC", apiCode: null, youVersionId: 55, yvLicensed: false, vulgatePsalms: true,
    // Public domain, so the link-out is a "we don't ship it yet", not a
    // licensing wall. Keeps the panel from calling it copyrighted.
    publicDomain: true },
  { id: "nabre", name: "New American Bible (Revised Edition)", abbr: "NABRE", apiCode: null, youVersionId: 463, yvLicensed: false },
  { id: "nrsvci", name: "NRSV Catholic Interconfessional", abbr: "NRSV-CI", apiCode: null, youVersionId: 2015, yvLicensed: false },
  { id: "original", name: "Original (Hebrew / Aramaic / Greek)", abbr: "ORIG", apiCode: null, youVersionId: 1, yvLicensed: false, original: true,
    copyright: "Hebrew and Aramaic text from the Westminster Leningrad Codex via Open Scriptures (CC BY 4.0). Greek text from the SBLGNT, edited by Michael W. Holmes, with MorphGNT morphology (CC BY-SA 4.0)." },
];

export const MAIN_DEFAULT_TRANSLATION = "niv";
export const EAGLE_DEFAULT_TRANSLATION = "niv";
export const MAIN_TRANSLATION_STORAGE_KEY = "bt:translation";
export const EAGLE_TRANSLATION_STORAGE_KEY = "bt:eagleTranslation";

export function getTranslation(translationId) {
  return TRANSLATIONS.find((translation) => translation.id === translationId) || TRANSLATIONS[0];
}

// bible.com versions whose Psalms follow the Greek/Vulgate numbering
// instead of the Hebrew (Masoretic) numbering the reading plan uses.
// Douay-Rheims is the only one we link to; verified against bible.com,
// where DRC1752 PSA.23 is the psalm most Bibles number 24.
const VULGATE_PSALM_VERSIONS = new Set([55]);

// Hebrew psalm number -> Vulgate/Septuagint psalm number. The traditions
// diverge because the Greek merges Hebrew 9-10 and 114-115, and splits
// Hebrew 116 and 147; everything between those seams is offset by one.
// The two split psalms need the verse to pick a side, so `verse` is
// consulted only there.
function hebrewPsalmToVulgate(chapter, verse) {
  if (chapter <= 8) return chapter;
  if (chapter <= 10) return 9;              // Hebrew 9-10 = Vulgate 9
  if (chapter <= 113) return chapter - 1;
  if (chapter <= 115) return 113;           // Hebrew 114-115 = Vulgate 113
  if (chapter === 116) return verse <= 9 ? 114 : 115;
  if (chapter <= 146) return chapter - 1;
  if (chapter === 147) return verse <= 11 ? 146 : 147;
  return chapter;                           // 148-150 line up again
}

export function buildYouVersionUrl(book, ref, translationId) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev) return null;
  const match = ref.match(/^(\d+):(.+)$/);
  if (!match) return null;
  const chapter = match[1];
  const verses = match[2];
  const bibleId = translationId || 111;

  // A Vulgate-numbered Psalter needs the chapter remapped, or the link
  // lands on the wrong psalm entirely. Those editions also count the
  // superscription as verse 1, so the verse numbers don't line up either
  // — link to the whole psalm rather than to a verse we'd get wrong.
  if (abbrev === "PSA" && VULGATE_PSALM_VERSIONS.has(Number(bibleId))) {
    const firstVerse = parseInt(verses, 10);
    const mapped = hebrewPsalmToVulgate(
      Number(chapter),
      Number.isFinite(firstVerse) ? firstVerse : 1
    );
    return `https://www.bible.com/bible/${bibleId}/${abbrev}.${mapped}`;
  }

  return `https://www.bible.com/bible/${bibleId}/${abbrev}.${chapter}.${verses}`;
}

// Bible Hub's interlinear for a reference — Hebrew/Aramaic for the Old
// Testament, Greek for the New, chosen by the book. Interlinear pages are
// per-verse, so a range links to the verse it starts at.
export function buildInterlinearUrl(book, ref) {
  const slug = BIBLEHUB_SLUGS[book];
  if (!slug) return null;
  const parsed = parsePlanRef(ref);
  if (!parsed.isStructured || !parsed.startChapter) return null;
  const base = `https://biblehub.com/interlinear/${slug}`;
  return parsed.startVerse
    ? `${base}/${parsed.startChapter}-${parsed.startVerse}.htm`
    : `${base}/${parsed.startChapter}.htm`;
}

export function buildApiQuery(book, ref) {
  const apiName = API_BOOK_NAMES[book] || book;
  return `${apiName} ${ref}`;
}

export function buildUsfmParts(book, ref) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev) return null;

  const dashMatch = ref.match(/^(\d+:\d+)-(\d+(?::\d+)?)$/);
  if (!dashMatch) {
    return [abbrev + "." + ref.replace(":", ".")];
  }

  const start = dashMatch[1];
  const end = dashMatch[2];
  if (end.includes(":")) {
    const [startCh, startV] = start.split(":");
    const [endCh, endV] = end.split(":");
    const parts = [];
    parts.push(abbrev + "." + startCh + "." + startV + "-200");
    for (let ch = parseInt(startCh, 10) + 1; ch < parseInt(endCh, 10); ch += 1) {
      parts.push(abbrev + "." + ch);
    }
    parts.push(abbrev + "." + endCh + ".1-" + endV);
    return parts;
  }

  return [abbrev + "." + start.replace(":", ".") + "-" + end];
}
