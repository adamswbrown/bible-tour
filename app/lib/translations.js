import { API_BOOK_NAMES, BOOK_ABBREV } from "./bible";

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
  { id: "nkjv", name: "New King James Version", abbr: "NKJV", apiCode: null, youVersionId: 114, yvLicensed: false },
  { id: "nlt", name: "New Living Translation", abbr: "NLT", apiCode: null, youVersionId: 116, yvLicensed: false },
  { id: "csb", name: "Christian Standard Bible", abbr: "CSB", apiCode: null, youVersionId: 1713, yvLicensed: false },
  { id: "msg", name: "The Message", abbr: "MSG", apiCode: null, youVersionId: 97, yvLicensed: false },
  { id: "web", name: "World English Bible", abbr: "WEB", apiCode: "web", youVersionId: 206, yvLicensed: false },
  { id: "asv", name: "American Standard Version", abbr: "ASV", apiCode: "asv", youVersionId: 12, yvLicensed: false },
];

export const MAIN_DEFAULT_TRANSLATION = "kjv";
export const EAGLE_DEFAULT_TRANSLATION = "niv";
export const MAIN_TRANSLATION_STORAGE_KEY = "bt:translation";
export const EAGLE_TRANSLATION_STORAGE_KEY = "bt:eagleTranslation";

export function getTranslation(translationId) {
  return TRANSLATIONS.find((translation) => translation.id === translationId) || TRANSLATIONS[0];
}

export function buildYouVersionUrl(book, ref, translationId) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev) return null;
  const match = ref.match(/^(\d+):(.+)$/);
  if (!match) return null;
  const chapter = match[1];
  const verses = match[2];
  const bibleId = translationId || 111;
  return `https://www.bible.com/bible/${bibleId}/${abbrev}.${chapter}.${verses}`;
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
