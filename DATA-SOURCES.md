# Data sources

Study Mode bundles open biblical text and lexicon data at build time. Sources:

## STEPBible — Tyndale House Brief Lexicons
- **URL**: https://github.com/STEPBible/STEPBible-Data
- **Files used**: `TBESH` (Hebrew, BDB-abridged), `TBESG` (Greek, Thayer's-abridged)
- **License**: CC BY 4.0 — attribution required
- **Attribution**: "Lexicon data © Tyndale House, Cambridge (STEPBible.org), CC BY 4.0"

## OpenScriptures — KJV with Strong's
- **URL**: https://github.com/openscriptures/  (exact repo TBD by data pipeline agent)
- **License**: Public domain (KJV text + Strong's Concordance both PD)
- **Attribution**: not required but given as courtesy

## Build pipeline
- `scripts/build-lexicon.mjs` fetches STEPBible TSVs, emits `app/data/lexicon.json`
- `scripts/build-tagged-verses.mjs` fetches KJV+Strong's, filters to tour verses, emits `app/data/tagged-verses.json`, prunes lexicon to referenced Strong's numbers
- Run both: `npm run build:data`

## Coverage
MVP ships tagged data for the ~500 verses in the tour reading plan. Full-Bible coverage is planned for v2 via code-splitting the lexicon by book.
