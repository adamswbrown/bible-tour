# Data sources

Originals mode bundles open biblical text and lexicon data at build time.

## kaiserlik/kjv — KJV text with Strong's tags

- **URL**: https://github.com/kaiserlik/kjv
- **File format**: per-book JSON with inline `word[H####]` / `word[G####]` tags
- **License**: the underlying content is public domain
  - King James Version text (1769 Blayney revision) is public domain worldwide (Crown copyright honored in the UK; PD everywhere else this app ships)
  - Strong's Concordance (1890) is public domain
  - The combination — "KJV with Strong's numbers tagged per word" — is therefore public domain wherever the *tagging compilation* doesn't claim copyright
- **License file**: the kaiserlik repo itself does **not** declare a LICENSE file. We've satisfied ourselves that the underlying data is uncontestably PD (see above) and document the provenance here. App Store / Play Store submissions reference this section.
- **CC0 alternative identified for v1.1**: [luvlylavnder/bible-app-data](https://github.com/luvlylavnder/bible-app-data) (CC0 1.0) ships interlinear Strong's data for all 66 books in JSON. Format is phrase-level and ordered by source-language word position rather than English reading order, so swapping requires a join-based pipeline (plain KJV from `thiagobodruk/bible` for English ordering + luvlylavnder for Strong's tags, aligned by substring-match). Estimated ~1–2 hours focused work plus diff-testing. Tracked as a follow-up; not blocking v1 submission.
- **Attribution**: not legally required; given as courtesy in Credits

## Open Scriptures — Strong's Hebrew & Greek dictionaries

- **URL**: https://github.com/openscriptures/strongs
- **Files used**: `hebrew/strongs-hebrew-dictionary.js`, `greek/strongs-greek-dictionary.js`
- **License**: CC BY-SA 3.0
- **Attribution (required)**: rendered in the app's Lexicon drawer footer —
  > "Strong's dictionary from Open Scriptures (CC BY-SA 3.0)"
- **Share-alike note**: derivatives of the dictionary text must also be CC BY-SA 3.0. The lexicon JSON we ship is a filtered subset of the same dictionary data and is redistributed under the same terms.

## Coverage

MVP ships tagged data for **234 verses** from the tour reading plan, covering every tour book. The Proverbs "any five random proverbs from chapters 10-29" entry is skipped (would balloon the bundle). Bundle sizes:

- `app/data/tagged-verses.json` — 143 KB (234 verses, ~1,500 Strong's tags)
- `app/data/lexicon.json` — 339 KB (1,029 pruned entries)
- Combined: ~482 KB raw / ~123 KB gzipped

Full-Bible coverage is planned for v2 via code-splitting the lexicon by book.

## Build pipeline

- `scripts/build-lexicon.mjs` fetches the Open Scriptures Hebrew and Greek dictionaries, parses them, and emits the full `app/data/lexicon.json`.
- `scripts/build-tagged-verses.mjs` fetches per-book JSONs from kaiserlik/kjv, extracts verse tokens for every reference in `app/lib/bible.js → READING_PLAN`, emits `app/data/tagged-verses.json`, and prunes `lexicon.json` down to only the Strong's numbers actually referenced.
- Run both: `npm run build:data`

## Known limitations

- `pos` (part of speech) is empty for all entries — the Open Scriptures dictionaries omit it.
- Multi-Strong's tags on one word (e.g. `created[H1254][H853]`) use the first (primary) tag; markers like the Hebrew accusative H853 are dropped to reduce visual noise.
