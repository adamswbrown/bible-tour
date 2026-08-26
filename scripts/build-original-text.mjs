#!/usr/bin/env node
/**
 * build-original-text.mjs
 *
 * Produces app/data/original-verses.json — one entry per verse in the
 * reading plan, in the original language (Hebrew or Aramaic for OT,
 * Greek for NT).
 *
 * Shape:
 *   { "GEN.12.2": { "lang": "hbo", "text": "וְאֶֽעֶשְׂךָ֙ ..." },
 *     "DAN.2.44": { "lang": "arc", "text": "וּֽבְיוֹמֵיה֞וֹן דִּ֧י ..." },
 *     "JHN.3.16": { "lang": "grc", "text": "Οὕτως γὰρ ἠγάπησεν ..." },
 *     ... }
 *
 * lang is an ISO 639-3 code: hbo (Ancient Hebrew), arc (Imperial
 * Aramaic), grc (Ancient Greek). Aramaic is detected per verse from the
 * OSHB morphology rather than hardcoded by reference — see
 * extractHebrewVerse.
 *
 * Sources:
 *   - Hebrew OT: openscriptures/morphhb (Westminster Leningrad Codex,
 *     OSIS XML, CC-BY 4.0).
 *   - Greek NT:  morphgnt/sblgnt (SBLGNT text + MorphGNT morphology,
 *     CC-BY-SA 4.0 for the morphology; SBL Greek text under SBLGNT EULA,
 *     free for non-commercial use with attribution).
 *
 * Versification: Hebrew chapter/verse numbers diverge from English in a
 * handful of places (Psalm titles count as v.1 in Hebrew; Malachi has
 * three chapters where English has four; Joel has four chapters where
 * English has three after Joel 2:27). For each English ref in the plan
 * that has a known offset, ENGLISH_TO_HEBREW maps it to the Hebrew ref.
 * Only the offsets actually triggered by plan refs are listed.
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
const OUT = resolve(ROOT, "app/data/original-verses.json");

const OSHB_BASE = "https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc";
const MORPHGNT_BASE = "https://raw.githubusercontent.com/morphgnt/sblgnt/master";

// OSHB file naming (matches OSIS short codes used in tagged-verses script).
const OSHB_FILE = {
  GEN: "Gen",   EXO: "Exod",  LEV: "Lev",   NUM: "Num",   DEU: "Deut",
  JOS: "Josh",  JDG: "Judg",  RUT: "Ruth",  "1SA": "1Sam", "2SA": "2Sam",
  "1KI": "1Kgs", "2KI": "2Kgs", "1CH": "1Chr", "2CH": "2Chr",
  EZR: "Ezra",  NEH: "Neh",   EST: "Esth",  JOB: "Job",   PSA: "Ps",
  PRO: "Prov",  ECC: "Eccl",  SNG: "Song",  ISA: "Isa",   JER: "Jer",
  LAM: "Lam",   EZK: "Ezek",  DAN: "Dan",   HOS: "Hos",   JOL: "Joel",
  AMO: "Amos",  OBA: "Obad",  JON: "Jonah", MIC: "Mic",   NAM: "Nah",
  HAB: "Hab",   ZEP: "Zeph",  HAG: "Hag",   ZEC: "Zech",  MAL: "Mal",
};

// MorphGNT file naming. NN-Code-morphgnt.txt for NN in 61..87.
const MORPHGNT_FILE = {
  MAT: "61-Mt",   MRK: "62-Mk",   LUK: "63-Lk",   JHN: "64-Jn",   ACT: "65-Ac",
  ROM: "66-Ro",   "1CO": "67-1Co", "2CO": "68-2Co", GAL: "69-Ga",  EPH: "70-Eph",
  PHP: "71-Php",  COL: "72-Col",  "1TH": "73-1Th", "2TH": "74-2Th", "1TI": "75-1Ti",
  "2TI": "76-2Ti", TIT: "77-Tit", PHM: "78-Phm",  HEB: "79-Heb",  JAS: "80-Jas",
  "1PE": "81-1Pe", "2PE": "82-2Pe", "1JN": "83-1Jn", "2JN": "84-2Jn", "3JN": "85-3Jn",
  JUD: "86-Jud",  REV: "87-Re",
};

const OT_ABBREVS = new Set(Object.keys(OSHB_FILE));
const NT_ABBREVS = new Set(Object.keys(MORPHGNT_FILE));

// English-to-Hebrew ref overrides for refs the plan actually contains
// where the English/Hebrew verse numbering differs. The build will log a
// warning if any plan ref would target a verse beyond a book's Hebrew
// chapter count (e.g. Mal 4 doesn't exist in Hebrew).
//
// Key format: "ABBREV.ch.v" (English); value: "ch.v" (Hebrew).
const ENGLISH_TO_HEBREW = {
  // Psalms with musical superscriptions: Hebrew counts the title as v.1,
  // so English v.N = Hebrew v.(N+1). Only Ps 46 in the plan.
  "PSA.46.1": "46.2",
  // Malachi: Hebrew has 3 chapters; English ch.4 = Hebrew 3:19-24.
  // Plan has Mal 4:2 = Hebrew 3:20.
  "MAL.4.2": "3.20",
};

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

// ── OSHB Hebrew parsing ────────────────────────────────────────────────
//
// OSHB verses look like:
//   <verse osisID="Gen.1.1">
//     <w lemma="b/7225" n="1.1.1" morph="HR/Ncfsa">בְּ/רֵאשִׁ֖ית</w>
//     <w lemma="1254 a" n="1.1.2" morph="HVqp3ms">בָּרָ֣א</w>
//     ...
//     <seg type="x-sof-pasuq">׃</seg>
//     <seg type="x-pe">׃ פ</seg>?
//   </verse>
//
// We strip the leading-prefix "/" separators that OSHB uses inside <w>
// to mark morpheme boundaries (e.g. "בְּ/רֵאשִׁ֖ית" = "בְּרֵאשִׁ֖ית"),
// concatenate words with a single space, and append soph pasuq.

function extractHebrewVerse(bookXml, chapter, verse) {
  const openRe = new RegExp(
    `<verse\\s+osisID="[^"]*\\.${chapter}\\.${verse}"[^>]*>`,
    "i"
  );
  const openMatch = bookXml.match(openRe);
  if (!openMatch) return null;
  const start = openMatch.index + openMatch[0].length;
  const closeIdx = bookXml.indexOf("</verse>", start);
  if (closeIdx < 0) return null;
  const inner = bookXml.slice(start, closeIdx);

  const tokens = [];
  let hebrewWords = 0;
  let aramaicWords = 0;
  const wordRe = /<w\b([^>]*)>([\s\S]*?)<\/w>/g;
  let m;
  while ((m = wordRe.exec(inner)) !== null) {
    const word = m[2].replace(/\//g, "").trim();
    if (!word) continue;
    tokens.push(word);
    const morph = /morph="([^"]*)"/.exec(m[1]);
    if (morph) {
      if (morph[1].startsWith("A")) aramaicWords += 1;
      else if (morph[1].startsWith("H")) hebrewWords += 1;
    }
  }
  // Append soph pasuq if present.
  const sof = /<seg\s+type="x-sof-pasuq"[^>]*>([^<]*)<\/seg>/.exec(inner);
  let text = tokens.join(" ");
  if (sof && sof[1]) text += sof[1];
  if (!text) return null;

  // OSHB prefixes every morph code with the word's language: "H…" for
  // Hebrew, "A…" for Aramaic. Daniel 2:4b-7:28, Ezra 4:8-6:18 and
  // 7:12-26, Jeremiah 10:11 and two words of Genesis 31:47 are Aramaic.
  // Daniel 2:4 straddles the switch, so go with whichever language owns
  // most of the verse rather than assuming it is uniform.
  const lang = aramaicWords > hebrewWords ? "arc" : "hbo";
  return { text, lang };
}

// ── MorphGNT Greek parsing ─────────────────────────────────────────────
//
// Each line is one word, whitespace-separated columns:
//   bbccvv  pos  parsing  text  word  normalized  lemma
// e.g.:
//   430316 RA ----NSM- Οὕτως Οὕτως οὕτως οὕτως
//
// We group lines by verse ID and join column 4 (text with punctuation)
// with single spaces.

// SBLGNT marks textual variants with characters from the Unicode
// "Supplemental Punctuation" block (U+2E00..U+2E7F) — e.g. ⸀ (U+2E20)
// flags a single-word variant, ⸂⸃ bracket multi-word variants. These
// are editorial apparatus, not part of the verse for reading purposes.
function stripApparatusMarks(s) {
  return s.replace(/[⸀-⹿]/g, "");
}

function parseMorphGntFile(content) {
  const verses = new Map(); // "ch.v" -> string[]
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const cols = line.split(/\s+/);
    if (cols.length < 4) continue;
    const ref = cols[0];
    // bbccvv → ch = ref[2..4], v = ref[4..6] (right-aligned). Verses can
    // exceed 99 in some places (e.g. Luke 1:80 is fine, but the spec uses
    // a strict 2+2+2 layout). Treat as bb=2, cc=2, vv=2.
    if (!/^\d{6}$/.test(ref)) continue;
    const ch = String(Number(ref.slice(2, 4)));
    const v = String(Number(ref.slice(4, 6)));
    const word = stripApparatusMarks(cols[3]);
    if (!word) continue;
    const key = `${ch}.${v}`;
    if (!verses.has(key)) verses.set(key, []);
    verses.get(key).push(word);
  }
  const out = {};
  for (const [k, words] of verses) out[k] = words.join(" ");
  return out;
}

// ── Plan walking ──────────────────────────────────────────────────────

function expandRef(parsed) {
  const ids = []; // [ "ch.v", ... ]
  if (!parsed.isStructured) return ids;
  if (parsed.kind === "verse") {
    ids.push(`${parsed.startChapter}.${parsed.startVerse}`);
  } else if (parsed.kind === "range") {
    for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
      ids.push(`${parsed.startChapter}.${v}`);
    }
  } else if (parsed.kind === "cross-chapter-range") {
    // Cross-chapter ranges: enumerate per-chapter but cap at a reasonable
    // upper bound; the build will simply skip refs that don't exist in
    // the source. We don't know each chapter's verse count up front for
    // Hebrew/Greek, so cap at 200 and let lookups silently miss.
    for (let ch = parsed.startChapter; ch <= parsed.endChapter; ch++) {
      const from = ch === parsed.startChapter ? parsed.startVerse : 1;
      const to = ch === parsed.endChapter ? parsed.endVerse : 200;
      for (let v = from; v <= to; v++) ids.push(`${ch}.${v}`);
    }
  } else if (parsed.kind === "chapter-span") {
    for (let ch = parsed.startChapter; ch <= parsed.endChapter; ch++) {
      for (let v = 1; v <= 200; v++) ids.push(`${ch}.${v}`);
    }
  }
  return ids;
}

async function main() {
  const allPlanEntries = [
    ...READING_PLAN["Old Testament"],
    ...READING_PLAN["New Testament"],
  ];

  // Collect English refs by abbrev.
  const wantedByAbbrev = new Map(); // abbrev -> Set<"ch.v">
  let skippedFreetext = 0;
  for (const entry of allPlanEntries) {
    const abbrev = BOOK_ABBREV[entry.book];
    if (!abbrev) continue;
    for (const part of splitPlanRefs(entry.refs)) {
      const parsed = parsePlanRef(part);
      if (!parsed.isStructured) { skippedFreetext++; continue; }
      if (/\b(random|any)\b/i.test(part)) { skippedFreetext++; continue; }
      const ids = expandRef(parsed);
      if (!wantedByAbbrev.has(abbrev)) wantedByAbbrev.set(abbrev, new Set());
      for (const id of ids) wantedByAbbrev.get(abbrev).add(id);
    }
  }

  const out = {};
  let otFound = 0, otMissing = 0, ntFound = 0, ntMissing = 0;
  let aramaicFound = 0;
  const missing = [];

  // Hebrew OT.
  for (const [abbrev, idSet] of wantedByAbbrev) {
    if (!OT_ABBREVS.has(abbrev)) continue;
    const file = OSHB_FILE[abbrev];
    const url = `${OSHB_BASE}/${file}.xml`;
    process.stdout.write(`OSHB ${file}…\n`);
    const xml = await fetchText(url);
    for (const id of idSet) {
      const englishKey = `${abbrev}.${id}`;
      const hebrewRef = ENGLISH_TO_HEBREW[englishKey] || id;
      const [ch, v] = hebrewRef.split(".");
      const extracted = extractHebrewVerse(xml, ch, v);
      if (extracted) {
        out[englishKey] = { lang: extracted.lang, text: extracted.text };
        if (extracted.lang === "arc") aramaicFound++;
        otFound++;
      } else {
        otMissing++;
        missing.push(`${englishKey} (Heb ${hebrewRef})`);
      }
    }
  }

  // Greek NT.
  for (const [abbrev, idSet] of wantedByAbbrev) {
    if (!NT_ABBREVS.has(abbrev)) continue;
    const file = MORPHGNT_FILE[abbrev];
    const url = `${MORPHGNT_BASE}/${file}-morphgnt.txt`;
    process.stdout.write(`MorphGNT ${file}…\n`);
    const content = await fetchText(url);
    const verseMap = parseMorphGntFile(content);
    for (const id of idSet) {
      const key = `${abbrev}.${id}`;
      const text = verseMap[id];
      if (text) {
        out[key] = { lang: "grc", text };
        ntFound++;
      } else {
        ntMissing++;
        missing.push(key);
      }
    }
  }

  await mkdir(dirname(OUT), { recursive: true });
  // Stable ordering: sort keys by book order then ch.v numerically.
  const orderedAbbrevs = [...wantedByAbbrev.keys()];
  const orderedKeys = Object.keys(out).sort((a, b) => {
    const [aA, aC, aV] = a.split(".");
    const [bA, bC, bV] = b.split(".");
    const aI = orderedAbbrevs.indexOf(aA);
    const bI = orderedAbbrevs.indexOf(bA);
    if (aI !== bI) return aI - bI;
    return Number(aC) - Number(bC) || Number(aV) - Number(bV);
  });
  const ordered = {};
  for (const k of orderedKeys) ordered[k] = out[k];
  await writeFile(OUT, JSON.stringify(ordered), "utf8");

  console.log("");
  console.log(`OT verses: ${otFound} found (${aramaicFound} Aramaic), ${otMissing} missing`);
  console.log(`NT verses: ${ntFound} found, ${ntMissing} missing`);
  console.log(`Free-text plan refs skipped: ${skippedFreetext}`);
  if (missing.length) {
    console.log("Missing refs:");
    for (const m of missing) console.log(`  ${m}`);
  }
  const bytes = (await readFile(OUT)).length;
  console.log(`\nWrote ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
