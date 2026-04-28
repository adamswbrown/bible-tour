#!/usr/bin/env node
/**
 * build-canon.mjs
 *
 * Generates app/data/canon.json — a static lookup of per-chapter verse counts
 * for every book of the KJV. Replaces runtime calls to IQ Bible's
 * GetVerseCount endpoint (RapidAPI) with a build-time-baked file.
 *
 * Source: thiagobodruk/bible (KJV, public domain), pinned by commit hash.
 * Standard canonical 66-book order — joined to app/lib/bible.js by position.
 *
 * Output shape (keyed by our 3-letter SBL-style abbrev):
 *   {
 *     "_source": { ... },
 *     "books": {
 *       "GEN": { "name": "Genesis", "chapterCount": 50, "verseCounts": [31, 25, ...] },
 *       ...
 *     }
 *   }
 *
 * Usage: node scripts/build-canon.mjs
 */

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BOOKS } from "../app/lib/bible.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "app/data/canon.json");

// Pinned commit so builds are reproducible. Update intentionally.
const COMMIT = "49a869c278bcd91ced78a5d64fe2d92ac812e2ca";
const SOURCE_URL = `https://raw.githubusercontent.com/thiagobodruk/bible/${COMMIT}/json/en_kjv.json`;

async function fetchKjv() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}): ${SOURCE_URL}`);
  }
  // The upstream file is UTF-8 with a BOM.
  const text = (await res.text()).replace(/^﻿/, "");
  return JSON.parse(text);
}

async function main() {
  console.log("Fetching KJV from thiagobodruk/bible...");
  const kjv = await fetchKjv();

  if (!Array.isArray(kjv) || kjv.length !== 66) {
    throw new Error(`Expected 66 books, got ${kjv?.length}`);
  }
  if (BOOKS.length !== 66) {
    throw new Error(`app/lib/bible.js BOOKS has ${BOOKS.length} entries, expected 66`);
  }

  const books = {};
  for (let i = 0; i < 66; i += 1) {
    const ours = BOOKS[i];
    const upstream = kjv[i];

    if (!Array.isArray(upstream.chapters)) {
      throw new Error(`Book ${ours.book}: upstream missing chapters[]`);
    }

    const verseCounts = upstream.chapters.map((ch) => {
      if (!Array.isArray(ch)) {
        throw new Error(`${ours.book}: chapter is not an array`);
      }
      return ch.length;
    });

    books[ours.abbrev] = {
      name: ours.book,
      chapterCount: verseCounts.length,
      verseCounts,
    };
  }

  const out = {
    _source: {
      repo: "thiagobodruk/bible",
      file: "json/en_kjv.json",
      commit: COMMIT,
      url: SOURCE_URL,
      license: "Public domain (KJV)",
      generatedAt: new Date().toISOString(),
    },
    books,
  };

  await writeFile(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");

  const totalChapters = Object.values(books).reduce((n, b) => n + b.chapterCount, 0);
  const totalVerses = Object.values(books).reduce(
    (n, b) => n + b.verseCounts.reduce((m, v) => m + v, 0),
    0
  );
  console.log(`Wrote ${OUT}`);
  console.log(`66 books / ${totalChapters} chapters / ${totalVerses} verses`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
