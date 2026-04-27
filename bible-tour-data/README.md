# bible-tour-data

Public-domain biblical reference data bundled into the [Tour of the Bible](https://bible-tour.vercel.app) app, redistributed here under the same licence as the upstream sources so any of it can be reused.

## What's in here

### `lexicon.json`

A pruned subset of the Open Scriptures Strong's Hebrew & Greek dictionaries, containing **only the entries referenced by the Tour of the Bible reading plan** (~1,000 entries from the full ~9,000+ entries of the upstream dictionary).

Each entry is keyed by Strong's number (e.g. `H7225`, `G2316`) and contains:

```json
{
  "lemma": "Hebrew or Greek headword",
  "translit": "transliteration",
  "pos": "part of speech (often empty)",
  "gloss": "short English gloss",
  "entry": "full lexicon entry"
}
```

## Licence

This work is licensed under the **Creative Commons Attribution-ShareAlike 3.0 Unported License (CC BY-SA 3.0)** — see [`LICENSE`](./LICENSE) for the legal code or visit [creativecommons.org/licenses/by-sa/3.0](https://creativecommons.org/licenses/by-sa/3.0/) for a human-readable summary.

The licence inherits from the upstream source, which is also CC BY-SA 3.0. ShareAlike means: anything derived from this data must also be made available under CC BY-SA 3.0 (or a compatible licence).

## Attribution

Required by CC BY-SA 3.0. Use this credit line wherever you redistribute the data:

> Strong's dictionary from [Open Scriptures](https://github.com/openscriptures/strongs) (CC BY-SA 3.0). Pruned subset via [Tour of the Bible](https://bible-tour.vercel.app).

## Upstream

The unmodified original full dictionaries:

- [openscriptures/strongs](https://github.com/openscriptures/strongs) — Hebrew and Greek Strong's dictionaries in JSON format, CC BY-SA 3.0.

The pruning logic (which entries we keep) lives in [`scripts/build-tagged-verses.mjs`](https://github.com/adamswbrown/bible-tour/blob/main/scripts/build-tagged-verses.mjs) of the parent repo. To regenerate from upstream:

```bash
node scripts/build-lexicon.mjs       # downloads + builds full lexicon
node scripts/build-tagged-verses.mjs  # prunes to entries we use
cp app/data/lexicon.json bible-tour-data/lexicon.json
```

## Why this directory exists

The Tour of the Bible iOS and Android apps bundle this lexicon at build time so the lookup works offline. App-store binary distribution counts as redistribution under CC BY-SA 3.0's ShareAlike clause, so the redistributed subset has to be made available under the same licence — that's what this directory is for.

The mobile app's "Credits & Licences" screen links here so any user (or App Store reviewer) can see the source data and licence.
