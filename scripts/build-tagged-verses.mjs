#!/usr/bin/env node
/**
 * build-tagged-verses.mjs
 *
 * Produces app/data/tagged-verses.json keyed by verse ID (e.g. "GEN.1.1")
 * where each value is an array of { w, s } tokens — w is the word (with
 * attached punctuation), s is the Strong's number ("H7225", "G2316") or null.
 *
 * Source: kaiserlik/kjv (per-book JSON with inline [H####]/[G####] tags).
 *   https://github.com/kaiserlik/kjv
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

// Map from our BOOK_ABBREV (3-letter, SBL-ish) to kaiserlik's repo abbreviations.
// Covers every case where they differ.
const KAISERLIK_ABBREV = {
  GEN: "Gen", EXO: "Exo", LEV: "Lev", NUM: "Num", DEU: "Deu",
  JOS: "Jos", JDG: "Jdg", RUT: "Rth",
  "1SA": "1Sa", "2SA": "2Sa", "1KI": "1Ki", "2KI": "2Ki",
  "1CH": "1Ch", "2CH": "2Ch", EZR: "Ezr", NEH: "Neh", EST: "Est",
  JOB: "Job", PSA: "Psa", PRO: "Pro", ECC: "Ecc", SNG: "Sng",
  ISA: "Isa", JER: "Jer", LAM: "Lam", EZK: "Eze", DAN: "Dan",
  HOS: "Hos", JOL: "Joe", AMO: "Amo", OBA: "Oba", JON: "Jon",
  MIC: "Mic", NAM: "Nah", HAB: "Hab", ZEP: "Zep", HAG: "Hag",
  ZEC: "Zec", MAL: "Mal",
  MAT: "Mat", MRK: "Mar", LUK: "Luk", JHN: "Jhn", ACT: "Act",
  ROM: "Rom", "1CO": "1Co", "2CO": "2Co", GAL: "Gal", EPH: "Eph",
  PHP: "Phl", COL: "Col", "1TH": "1Th", "2TH": "2Th",
  "1TI": "1Ti", "2TI": "2Ti", TIT: "Tit", PHM: "Phm",
  HEB: "Heb", JAS: "Jas",
  "1PE": "1Pe", "2PE": "2Pe",
  "1JN": "1Jo", "2JN": "2Jo", "3JN": "3Jo",
  JUD: "Jde", REV: "Rev",
};

const RAW_BASE = "https://raw.githubusercontent.com/kaiserlik/kjv/master";

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

// Some kaiserlik book JSONs contain malformed escapes in the non-English
// language fields (bg/ch/sp). Since we only need the `en` field we avoid
// JSON.parse on the whole document and instead extract `Xxx|C|V` -> en-text
// pairs directly with a tolerant regex.
//
// The shape is always:
//   "Xxx|C|V":{..."en":"<text>"...}
// where <text> is a JSON string (backslash-escaped). We match from `Xxx|C|V`
// up through the first top-level "en": "...", being careful with escapes.
function extractEnglishVerses(text, kAbbrev) {
  const out = {}; // "kAbbrev|C": { "kAbbrev|C|V": enText }

  // Find every verse-start token like "1Sa|3|4":{
  const verseKeyRegex = new RegExp(
    `"(${kAbbrev.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\|\\d+\\|\\d+)"\\s*:\\s*\\{`,
    "g"
  );

  let match;
  while ((match = verseKeyRegex.exec(text)) !== null) {
    const vKey = match[1];
    // After the opening brace, find `"en"`:
    const enStart = text.indexOf('"en"', match.index + match[0].length);
    if (enStart < 0) continue;
    // Find the `:` then the opening `"` of the value string.
    const colon = text.indexOf(":", enStart + 4);
    if (colon < 0) continue;
    let i = colon + 1;
    // Skip whitespace
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] !== '"') continue;
    i++;
    // Walk until unescaped closing `"`, respecting backslash escapes.
    let endQuote = -1;
    while (i < text.length) {
      const c = text[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === '"') {
        endQuote = i;
        break;
      }
      i++;
    }
    if (endQuote < 0) continue;
    const rawEn = text.slice(colon + 1, endQuote + 1).replace(/^\s*/, "");
    // rawEn is like: "text"  — JSON.parse it to unescape.
    let en;
    try {
      en = JSON.parse(rawEn);
    } catch {
      continue;
    }
    const parts = vKey.split("|");
    const chKey = `${parts[0]}|${parts[1]}`;
    if (!out[chKey]) out[chKey] = {};
    out[chKey][vKey] = en;
  }

  return out;
}

// Expand a parsed plan ref into verse IDs of the form `${abbrev}.${ch}.${v}`.
// For chapter-spans and cross-chapter ranges we use the per-book chapter
// counts from kaiserlik (books.json / chapter_count.json) — we'll look up
// chapter length from the already-loaded book data.
function expandRefToVerses(abbrev, bookDataEn, parsed) {
  const ids = [];
  if (!parsed.isStructured) return ids;

  const chapters = Object.keys(bookDataEn); // e.g. "Gen|1", "Gen|2", ...
  const chapterByNum = {};
  for (const ck of chapters) {
    const parts = ck.split("|");
    const n = Number(parts[1]);
    chapterByNum[n] = ck;
  }

  function addChapter(chN) {
    const ck = chapterByNum[chN];
    if (!ck) return;
    const vkeys = Object.keys(bookDataEn[ck]).sort((a, b) => {
      return Number(a.split("|")[2]) - Number(b.split("|")[2]);
    });
    for (const vk of vkeys) {
      const vn = Number(vk.split("|")[2]);
      ids.push(`${abbrev}.${chN}.${vn}`);
    }
  }

  function addRange(chN, startV, endV) {
    const ck = chapterByNum[chN];
    if (!ck) return;
    for (let v = startV; v <= endV; v++) {
      if (bookDataEn[ck][`${ck}|${v}`]) {
        ids.push(`${abbrev}.${chN}.${v}`);
      }
    }
  }

  if (parsed.kind === "verse") {
    ids.push(`${abbrev}.${parsed.startChapter}.${parsed.startVerse}`);
  } else if (parsed.kind === "range") {
    addRange(parsed.startChapter, parsed.startVerse, parsed.endVerse);
  } else if (parsed.kind === "cross-chapter-range") {
    // startChapter:startVerse -> endChapter:endVerse
    const { startChapter, startVerse, endChapter, endVerse } = parsed;
    for (let ch = startChapter; ch <= endChapter; ch++) {
      const ck = chapterByNum[ch];
      if (!ck) continue;
      const vkeys = Object.keys(bookDataEn[ck])
        .map((k) => Number(k.split("|")[2]))
        .sort((a, b) => a - b);
      const maxV = vkeys[vkeys.length - 1];
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

// Tokenize a kaiserlik en-verse string into [{w, s}].
//
// Kaiserlik marks each tagged word as   word[H1234]   or   word[G5555]
// Multiple tags on one word (e.g. "created[H1254][H853]") exist.
// Italicised words use <em>...</em> around plain words.
// Punctuation may appear inside a tag, e.g. "beginning,[H7225]" — sometimes,
// sometimes not. We normalize: strip HTML tags, then split on whitespace,
// and for each whitespace-token we peel off [H###]/[G###] runs and attach
// them to whatever word fragment they follow.
function tokenizeVerse(en) {
  // Strip <em> / </em> (italics marker)
  const noHtml = en.replace(/<\/?em>/g, "");
  const words = [];
  // Split on whitespace (but keep the word chunks intact)
  const chunks = noHtml.split(/\s+/).filter(Boolean);
  for (const chunk of chunks) {
    // A chunk may be `word[H1234]` or `word[H1234][H5555]` or `word,[H1234]`
    // or plain `word` or even `[H853]` (bare tag after a preceding word —
    // handled by attaching to the previous entry).
    const tagRegex = /\[([HG]\d+)\]/g;
    const strongsFound = [];
    let m;
    while ((m = tagRegex.exec(chunk)) !== null) {
      strongsFound.push(m[1]);
    }
    const plain = chunk.replace(tagRegex, "");

    if (plain === "" && strongsFound.length > 0) {
      // Bare tag: attach to previous word if any.
      if (words.length > 0) {
        const prev = words[words.length - 1];
        // If prev is untagged, take the first tag; else discard (avoid dup).
        if (prev.s === null) {
          prev.s = strongsFound[0];
        }
      }
      continue;
    }

    // Non-empty word. Attach the *first* tag (most specific); subsequent
    // tags (like H853 accusative marker) are ignored for display simplicity.
    const w = plain;
    const s = strongsFound.length > 0 ? strongsFound[0] : null;
    words.push({ w, s });
  }
  return words;
}

async function main() {
  // Collect the set of verse IDs we need, keyed by abbrev.
  const needByAbbrev = new Map(); // abbrev -> Set<string>(verseIds)

  const allPlanEntries = [
    ...READING_PLAN["Old Testament"],
    ...READING_PLAN["New Testament"],
  ];

  let skippedFreetext = 0;
  const freetextRefs = [];

  // First pass: parse refs (but we need book JSON to know chapter lengths).
  // So instead we'll do two phases: download every referenced book first,
  // then expand.
  const neededBooks = new Set();
  for (const entry of allPlanEntries) {
    const abbrev = BOOK_ABBREV[entry.book];
    if (!abbrev) continue;
    neededBooks.add(abbrev);
  }

  // Download every book JSON we need. Because some kaiserlik book files have
  // malformed escapes in non-English language fields (bg/ch/sp), we parse
  // tolerantly — extracting only the `en` field per verse via regex rather
  // than JSON.parsing the whole file.
  const bookCache = new Map(); // abbrev -> { kAbbrev, enBook }
  for (const abbrev of neededBooks) {
    const kAbbrev = KAISERLIK_ABBREV[abbrev];
    if (!kAbbrev) {
      console.warn(`No kaiserlik mapping for ${abbrev}; skipping`);
      continue;
    }
    const url = `${RAW_BASE}/${kAbbrev}.json`;
    process.stdout.write(`  fetching ${kAbbrev}.json… `);
    try {
      const raw = await fetchText(url);
      const enBook = extractEnglishVerses(raw, kAbbrev);
      const verseCount = Object.values(enBook).reduce(
        (n, ch) => n + Object.keys(ch).length,
        0
      );
      if (verseCount === 0) throw new Error("no verses extracted");
      bookCache.set(abbrev, { kAbbrev, enBook });
      console.log(`ok (${verseCount} verses)`);
    } catch (err) {
      console.log(`FAIL (${err.message})`);
    }
  }

  // Second pass: expand refs to verse ids.
  for (const entry of allPlanEntries) {
    const abbrev = BOOK_ABBREV[entry.book];
    const cached = bookCache.get(abbrev);
    if (!cached) continue;
    const { enBook } = cached;
    const parts = splitPlanRefs(entry.refs);
    for (const part of parts) {
      const parsed = parsePlanRef(part);
      if (!parsed.isStructured) {
        skippedFreetext++;
        freetextRefs.push(`${entry.book}: ${part}`);
        continue;
      }
      // Filter "any ... random proverbs" style chapter-spans — these are
      // meant as a sampling instruction, not a full-chapter read. Including
      // all of Proverbs 10–29 would blow up the bundle unnecessarily.
      if (/\b(random|any)\b/i.test(part)) {
        skippedFreetext++;
        freetextRefs.push(`${entry.book}: ${part} (sampling instruction)`);
        continue;
      }
      const ids = expandRefToVerses(abbrev, enBook, parsed);
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
    const { enBook } = cached;
    const kAbbrev = cached.kAbbrev;
    // Sort verse IDs by chapter then verse for stable output.
    const ids = [...idSet].sort((a, b) => {
      const [, ac, av] = a.split(".");
      const [, bc, bv] = b.split(".");
      return Number(ac) - Number(bc) || Number(av) - Number(bv);
    });
    for (const id of ids) {
      const [, chStr, vStr] = id.split(".");
      const ch = Number(chStr);
      const v = Number(vStr);
      const chKey = `${kAbbrev}|${ch}`;
      const vKey = `${kAbbrev}|${ch}|${v}`;
      const en = enBook[chKey]?.[vKey];
      if (!en) {
        untagged++;
        continue;
      }
      const tokens = tokenizeVerse(en);
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
