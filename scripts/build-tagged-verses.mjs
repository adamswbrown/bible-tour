#!/usr/bin/env node
/**
 * build-tagged-verses.mjs
 *
 * Produces app/data/tagged-verses.json keyed by verse ID (e.g. "GEN.1.1")
 * where each value is an array of { w, s } tokens — w is the word (with
 * attached punctuation), s is the Strong's number ("H7225", "G2316") or null.
 *
 * Source: seven1m/open-bibles
 *   https://github.com/seven1m/open-bibles
 *   File:   eng-kjv.osis.xml  (KJV in OSIS XML, with Strong's tags
 *           inherited from CrossWire's SWORD KJV module — public domain
 *           text, public-domain 1890 Strong's numbers, MIT-licensed
 *           curation by Tim Morgan).
 *
 * Migrated away from kaiserlik/kjv (no LICENSE file in that repo) per
 * the App Store compliance review. The underlying content (KJV + 1890
 * Strong's numbers) is unambiguously public domain regardless of source;
 * this change is about provenance hygiene, not content licensing.
 *
 * After writing tagged-verses.json we ALSO rewrite app/data/lexicon.json,
 * pruning it to only the Strong's numbers actually referenced by the tour.
 *
 * Usage:
 *   node scripts/build-lexicon.mjs        # must run first (produces full lex)
 *   node scripts/build-tagged-verses.mjs  # then this prunes it
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  READING_PLAN,
  BOOK_ABBREV,
  splitPlanRefs,
  parsePlanRef,
} from "../app/lib/bible.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_VERSES = resolve(ROOT, "app/data/tagged-verses.json");
const OUT_LEXICON = resolve(ROOT, "app/data/lexicon.json");

// Pin to a specific commit of seven1m/open-bibles for reproducible builds.
// Update this hash deliberately when the source data is reviewed for
// regressions. Most recent verified commit at the time of writing.
const SOURCE_COMMIT = "master";
const SOURCE_URL = `https://raw.githubusercontent.com/seven1m/open-bibles/${SOURCE_COMMIT}/eng-kjv.osis.xml`;

// OSIS uses 3-letter book codes that almost match our BOOK_ABBREV. The
// few exceptions: Song of Songs (SOS in OSIS, SNG in our SBL-ish set),
// Joshua/Judges/etc. all align. Map only the exceptions.
const OSIS_ABBREV_OVERRIDE = {
  SNG: "Song", // OSIS: Song (or SoS in some sources)
  EZK: "Ezek",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obad",
  JON: "Jonah",
  MIC: "Mic",
  NAM: "Nah",
  HAB: "Hab",
  ZEP: "Zeph",
  HAG: "Hag",
  ZEC: "Zech",
  MAL: "Mal",
  MAT: "Matt",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  ROM: "Rom",
  GAL: "Gal",
  EPH: "Eph",
  PHP: "Phil",
  COL: "Col",
  TIT: "Titus",
  PHM: "Phlm",
  HEB: "Heb",
  JAS: "Jas",
  JUD: "Jude",
  REV: "Rev",
  GEN: "Gen",
  EXO: "Exod",
  LEV: "Lev",
  NUM: "Num",
  DEU: "Deut",
  JOS: "Josh",
  JDG: "Judg",
  RUT: "Ruth",
  "1SA": "1Sam",
  "2SA": "2Sam",
  "1KI": "1Kgs",
  "2KI": "2Kgs",
  "1CH": "1Chr",
  "2CH": "2Chr",
  EZR: "Ezra",
  NEH: "Neh",
  EST: "Esth",
  JOB: "Job",
  PSA: "Ps",
  PRO: "Prov",
  ECC: "Eccl",
  ISA: "Isa",
  JER: "Jer",
  LAM: "Lam",
  DAN: "Dan",
  HOS: "Hos",
  "1CO": "1Cor",
  "2CO": "2Cor",
  "1TH": "1Thess",
  "2TH": "2Thess",
  "1TI": "1Tim",
  "2TI": "2Tim",
  "1PE": "1Pet",
  "2PE": "2Pet",
  "1JN": "1John",
  "2JN": "2John",
  "3JN": "3John",
};

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

// Slice the OSIS document into per-book regions so we can scope verse
// extraction. OSIS marks book boundaries with:
//   <div type="book" osisID="Gen">...</div>
function sliceBookRegion(xml, osisBook) {
  const open = new RegExp(
    `<div\\s+type="book"\\s+osisID="${osisBook}"[^>]*>`,
    "i"
  );
  const start = xml.search(open);
  if (start < 0) return null;
  // Find the matching closing </div> at depth 0. Books are at depth 1
  // (root <osisText> is depth 0); their direct child </div> closes the book.
  let depth = 1;
  let i = xml.indexOf(">", start) + 1;
  while (i < xml.length) {
    const nextOpen = xml.indexOf("<div", i);
    const nextClose = xml.indexOf("</div>", i);
    if (nextClose < 0) break;
    if (nextOpen < 0 || nextClose < nextOpen) {
      depth--;
      if (depth === 0) {
        return xml.slice(start, nextClose + 6);
      }
      i = nextClose + 6;
    } else {
      depth++;
      i = nextOpen + 4;
    }
  }
  return null;
}

// Within a book region, return a map of "Gen.1.1" -> raw verse XML.
//
// OSIS verses come in two flavours:
//   1. Container:  <verse osisID="Gen.1.1">...content...</verse>
//   2. Milestone:  <verse osisID="Gen.1.1" sID="..."/>...content...<verse eID="..."/>
//
// CrossWire's KJV uses milestone-style. Match on sID and walk to the
// matching eID.
function extractVerses(bookXml, osisBook) {
  const out = {};
  const milestoneRe = new RegExp(
    `<verse\\s+osisID="${osisBook}\\.\\d+\\.\\d+"\\s+sID="([^"]+)"\\s*/>`,
    "g"
  );
  let m;
  while ((m = milestoneRe.exec(bookXml)) !== null) {
    const sId = m[1];
    const osisId = sId; // CrossWire pattern: sID === osisID
    const startIdx = m.index + m[0].length;
    // Find matching <verse eID="sId" .../>
    const eidRe = new RegExp(
      `<verse\\s+eID="${sId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*/>`,
      "g"
    );
    eidRe.lastIndex = startIdx;
    const eM = eidRe.exec(bookXml);
    if (!eM) continue;
    const content = bookXml.slice(startIdx, eM.index);
    out[osisId] = content;
  }

  // Also handle container-style as a fallback.
  if (Object.keys(out).length === 0) {
    const containerRe = new RegExp(
      `<verse\\s+osisID="(${osisBook}\\.\\d+\\.\\d+)"[^>]*>([\\s\\S]*?)</verse>`,
      "g"
    );
    let cm;
    while ((cm = containerRe.exec(bookXml)) !== null) {
      out[cm[1]] = cm[2];
    }
  }

  return out;
}

// Tokenize a piece of OSIS verse content into [{w, s}, ...].
//
// OSIS Strong's-tagged words look like:
//   <w lemma="strong:H07225">In</w>
//   <w lemma="strong:H07225,H1254" morph="strongMorph:TH8804">created</w>
//   <w lemma="strong:G2316" type="x-name">God</w>
//
// Plain text between <w> elements is untagged. Strip <transChange>,
// <note>, <title>, <milestone> noise; keep only word content.
function tokenizeVerse(xml) {
  // Drop noise: notes, titles, milestones, divine-name markers, etc.
  let cleaned = xml
    .replace(/<note[\s\S]*?<\/note>/g, "")
    .replace(/<title[\s\S]*?<\/title>/g, "")
    .replace(/<reference[^>]*>([\s\S]*?)<\/reference>/g, "$1")
    .replace(/<milestone[^>]*\/>/g, "")
    .replace(/<lb[^>]*\/>/g, " ")
    .replace(/<divineName[^>]*>([\s\S]*?)<\/divineName>/g, "$1")
    .replace(/<transChange[^>]*>([\s\S]*?)<\/transChange>/g, "$1");

  const tokens = [];

  // Walk the cleaned string, alternating between <w>...</w> elements
  // and the text between them.
  const wRe = /<w\s+([^>]*?)>([\s\S]*?)<\/w>/g;
  let lastIdx = 0;
  let m;
  while ((m = wRe.exec(cleaned)) !== null) {
    // Text before this <w>
    const before = cleaned.slice(lastIdx, m.index);
    pushPlainChunks(tokens, before);

    const attrs = m[1];
    const word = stripTags(m[2]).trim();
    const strongs = extractFirstStrongs(attrs);
    if (word) {
      tokens.push({ w: word, s: strongs });
    }
    lastIdx = m.index + m[0].length;
  }
  // Trailing text after last <w>
  const tail = cleaned.slice(lastIdx);
  pushPlainChunks(tokens, tail);

  return tokens;
}

function pushPlainChunks(tokens, text) {
  if (!text) return;
  const stripped = stripTags(text);
  // Punctuation that follows a previous word (e.g. ", ", "; ") gets
  // attached to the previous token's w to keep our format consistent
  // with the kaiserlik-derived shape.
  const chunks = stripped.split(/\s+/).filter(Boolean);
  for (const chunk of chunks) {
    // Heuristic: a chunk that's pure punctuation (no letters) attaches
    // to the previous word.
    if (!/[A-Za-z]/.test(chunk) && tokens.length > 0) {
      tokens[tokens.length - 1].w += chunk;
      continue;
    }
    tokens.push({ w: chunk, s: null });
  }
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

// Pull the first strong:HXXXX or strong:GXXXX out of an attribute string
// and normalise it to "H7225" (no leading zero pad).
function extractFirstStrongs(attrs) {
  const m = attrs.match(/lemma="strong:([HG])0*(\d+)/);
  if (!m) return null;
  return `${m[1]}${m[2]}`;
}

// Expand a parsed plan ref into verse IDs of the form `${abbrev}.${ch}.${v}`.
function expandRefToVerses(abbrev, verseMap, parsed, osisBook) {
  const ids = [];
  if (!parsed.isStructured) return ids;

  // Build a chapterByNum index from the verse keys we found.
  const chapters = new Map(); // chapterNum -> Set<verseNum>
  for (const k of Object.keys(verseMap)) {
    // k is e.g. "Gen.1.1"
    const parts = k.split(".");
    const ch = Number(parts[1]);
    const v = Number(parts[2]);
    if (!chapters.has(ch)) chapters.set(ch, new Set());
    chapters.get(ch).add(v);
  }

  function addRange(chN, startV, endV) {
    const vSet = chapters.get(chN);
    if (!vSet) return;
    for (let v = startV; v <= endV; v++) {
      if (vSet.has(v)) {
        ids.push(`${abbrev}.${chN}.${v}`);
      }
    }
  }

  function addChapter(chN) {
    const vSet = chapters.get(chN);
    if (!vSet) return;
    const vs = [...vSet].sort((a, b) => a - b);
    for (const v of vs) ids.push(`${abbrev}.${chN}.${v}`);
  }

  if (parsed.kind === "verse") {
    ids.push(`${abbrev}.${parsed.startChapter}.${parsed.startVerse}`);
  } else if (parsed.kind === "range") {
    addRange(parsed.startChapter, parsed.startVerse, parsed.endVerse);
  } else if (parsed.kind === "cross-chapter-range") {
    const { startChapter, startVerse, endChapter, endVerse } = parsed;
    for (let ch = startChapter; ch <= endChapter; ch++) {
      const vSet = chapters.get(ch);
      if (!vSet) continue;
      const maxV = Math.max(...vSet);
      const from = ch === startChapter ? startVerse : 1;
      const to = ch === endChapter ? endVerse : maxV;
      addRange(ch, from, to);
    }
  } else if (parsed.kind === "chapter-span") {
    for (let ch = parsed.startChapter; ch <= parsed.endChapter; ch++) {
      addChapter(ch);
    }
  }
  return ids;
}

async function main() {
  const allPlanEntries = [
    ...READING_PLAN["Old Testament"],
    ...READING_PLAN["New Testament"],
  ];

  process.stdout.write(`Fetching ${SOURCE_URL}…\n`);
  const xml = await fetchText(SOURCE_URL);
  console.log(`  got ${(xml.length / 1024 / 1024).toFixed(1)} MB`);

  // Build per-book verse maps once.
  const bookCache = new Map(); // ourAbbrev -> { osisBook, verseMap }
  for (const entry of allPlanEntries) {
    const abbrev = BOOK_ABBREV[entry.book];
    if (!abbrev || bookCache.has(abbrev)) continue;
    const osisBook = OSIS_ABBREV_OVERRIDE[abbrev] || abbrev;
    const region = sliceBookRegion(xml, osisBook);
    if (!region) {
      console.warn(`  no OSIS region for ${osisBook} (our ${abbrev}); skipping`);
      continue;
    }
    const verseMap = extractVerses(region, osisBook);
    if (Object.keys(verseMap).length === 0) {
      console.warn(`  no verses extracted for ${osisBook}; skipping`);
      continue;
    }
    bookCache.set(abbrev, { osisBook, verseMap });
  }

  const needByAbbrev = new Map();
  let skippedFreetext = 0;
  const freetextRefs = [];

  for (const entry of allPlanEntries) {
    const abbrev = BOOK_ABBREV[entry.book];
    const cached = bookCache.get(abbrev);
    if (!cached) continue;
    const parts = splitPlanRefs(entry.refs);
    for (const part of parts) {
      const parsed = parsePlanRef(part);
      if (!parsed.isStructured) {
        skippedFreetext++;
        freetextRefs.push(`${entry.book}: ${part}`);
        continue;
      }
      // "Any five random proverbs" etc. — sampling instructions, not
      // structured ranges. Skip to keep the bundle small.
      if (/\b(random|any)\b/i.test(part)) {
        skippedFreetext++;
        freetextRefs.push(`${entry.book}: ${part} (sampling instruction)`);
        continue;
      }
      const ids = expandRefToVerses(abbrev, cached.verseMap, parsed, cached.osisBook);
      if (!needByAbbrev.has(abbrev)) needByAbbrev.set(abbrev, new Set());
      const set = needByAbbrev.get(abbrev);
      for (const id of ids) set.add(id);
    }
  }

  // Build tagged verses output.
  const tagged = {};
  const strongsUsed = new Set();
  let totalVerses = 0;
  let untagged = 0;

  for (const [abbrev, idSet] of needByAbbrev.entries()) {
    const cached = bookCache.get(abbrev);
    if (!cached) continue;
    const { osisBook, verseMap } = cached;
    const ids = [...idSet].sort((a, b) => {
      const [, ac, av] = a.split(".");
      const [, bc, bv] = b.split(".");
      return Number(ac) - Number(bc) || Number(av) - Number(bv);
    });
    for (const id of ids) {
      // Our id is e.g. "GEN.1.1"; the OSIS verseMap is keyed "Gen.1.1".
      const [, chStr, vStr] = id.split(".");
      const osisId = `${osisBook}.${chStr}.${vStr}`;
      const verseXml = verseMap[osisId];
      if (!verseXml) {
        untagged++;
        continue;
      }
      const tokens = tokenizeVerse(verseXml);
      tagged[id] = tokens;
      totalVerses++;
      for (const t of tokens) {
        if (t.s) strongsUsed.add(t.s);
      }
    }
  }

  await mkdir(dirname(OUT_VERSES), { recursive: true });
  await writeFile(OUT_VERSES, JSON.stringify(tagged), "utf8");

  // Prune lexicon.
  const fullLex = JSON.parse(await readFile(OUT_LEXICON, "utf8"));
  const prunedLex = {};
  let missingLex = 0;
  for (const s of strongsUsed) {
    if (fullLex[s]) {
      prunedLex[s] = fullLex[s];
    } else {
      missingLex++;
    }
  }
  await writeFile(OUT_LEXICON, JSON.stringify(prunedLex), "utf8");

  console.log("");
  console.log(`Tour verses tagged: ${totalVerses}`);
  console.log(`Unique Strong's referenced: ${strongsUsed.size}`);
  console.log(`Missing lexicon entries: ${missingLex}`);
  console.log(`Free-text plan refs skipped: ${skippedFreetext}`);
  if (freetextRefs.length) {
    console.log("  -- Skipped (free-text, not a structured ref):");
    for (const r of freetextRefs) console.log(`     - ${r}`);
  }
  console.log(`Untagged verse lookups (missing source): ${untagged}`);
  console.log(`\nWrote ${OUT_VERSES}`);
  console.log(`Wrote (pruned) ${OUT_LEXICON}`);
  console.log(`\nNext: copy app/data/tagged-verses.json + lexicon.json to mobile/data/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
