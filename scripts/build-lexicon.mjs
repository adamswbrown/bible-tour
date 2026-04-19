#!/usr/bin/env node
/**
 * build-lexicon.mjs
 *
 * Fetches OpenScriptures Strong's Hebrew + Greek dictionaries (CC-BY-SA)
 * and emits a unified lexicon at app/data/lexicon.json keyed by Strong's #
 * (H#### / G####) with schema: { lemma, translit, pos, gloss, entry }.
 *
 * Source files are Node-JS `var ... = { ... }` assignments — we strip the
 * wrapper and JSON.parse the object literal.
 *
 * Usage:
 *   node scripts/build-lexicon.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "app/data/lexicon.json");

const HEBREW_URL =
  "https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js";
const GREEK_URL =
  "https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js";

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.text();
}

// Strip the `var name = { ... };` wrapper around the dictionary object.
// The file may have trailing newline / semicolon. We locate the first `{`
// and the matching final `}`.
function parseJsVarDict(text) {
  const openIdx = text.indexOf("{");
  const closeIdx = text.lastIndexOf("}");
  if (openIdx < 0 || closeIdx < 0 || closeIdx < openIdx) {
    throw new Error("Could not find object literal in source");
  }
  const slice = text.slice(openIdx, closeIdx + 1);
  return JSON.parse(slice);
}

// Strong's dict entries look like (Hebrew example):
//   { "lemma": "...", "xlit": "...", "pron": "...",
//     "derivation": "...", "strongs_def": "...", "kjv_def": "..." }
// We collapse to: { lemma, translit, pos, gloss, entry }
//
// `pos` is not present in Strong's data; we leave it empty ("").
// `gloss` -> short sense from kjv_def (cleaned).
// `entry` -> derivation + strongs_def + kjv_def joined.
function normalizeEntry(raw) {
  const lemma = raw.lemma || "";
  const translit = raw.xlit || raw.translit || "";
  const derivation = (raw.derivation || "").trim();
  const strongsDef = (raw.strongs_def || "").trim();
  const kjvDef = (raw.kjv_def || "").trim();

  // Gloss: first sense from kjv_def, stripped of leading/trailing punctuation.
  const glossRaw = kjvDef
    .replace(/\.$/, "")
    .split(/,\s*/)
    .slice(0, 4)
    .join(", ")
    .trim();

  // Entry: human-readable multi-paragraph definition.
  const entryParts = [];
  if (strongsDef) entryParts.push(strongsDef.replace(/^\s+|\s+$/g, ""));
  if (derivation) entryParts.push(`Derivation: ${derivation}`);
  if (kjvDef) entryParts.push(`KJV: ${kjvDef}`);
  const entry = entryParts.join("\n\n");

  return {
    lemma,
    translit,
    pos: "",
    gloss: glossRaw,
    entry,
  };
}

async function main() {
  console.log("Fetching OpenScriptures Hebrew dictionary…");
  const hebText = await fetchText(HEBREW_URL);
  const hebRaw = parseJsVarDict(hebText);

  console.log("Fetching OpenScriptures Greek dictionary…");
  const grkText = await fetchText(GREEK_URL);
  const grkRaw = parseJsVarDict(grkText);

  const out = {};
  let hebCount = 0;
  let grkCount = 0;

  for (const [key, raw] of Object.entries(hebRaw)) {
    out[key] = normalizeEntry(raw);
    hebCount++;
  }
  for (const [key, raw] of Object.entries(grkRaw)) {
    out[key] = normalizeEntry(raw);
    grkCount++;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 0), "utf8");

  console.log(
    `Wrote ${OUT} — Hebrew:${hebCount} Greek:${grkCount} total:${hebCount + grkCount}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
