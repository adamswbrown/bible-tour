# Feasibility: Catholic & Orthodox English Bibles, and links to the original languages

Research note responding to reader feedback:

> 1. Could English translations of Catholic and Orthodox Bibles be included?
> 2. Could there be links to the original Hebrew, Aramaic, and Greek?

Status: research only — no code changed. Last updated: 2026-08-26.

---

## Verdicts up front

| Ask | Verdict | Rough effort |
|---|---|---|
| **1a.** Catholic/Orthodox *translations* of the 66 books we already have | **Yes — cheap.** Link-out works today with zero licensing; inline needs a per-version grant | Half a day (link-out) |
| **1b.** Catholic/Orthodox *canon* — the deuterocanonical books themselves | **Technically yes, but it's a product decision, not an engineering one.** No reading plan exists for them, and "66" is baked into progress and milestones | 1–2 weeks, plus editorial work we'd have to author ourselves |
| **2a.** Original Hebrew/Greek | **Already shipped** — the ORIG translation covers all 234 tour verses | Done |
| **2b.** Aramaic specifically | **Real gap, small fix.** We already *display* Aramaic — we just label it "Hebrew" | ~1 hour + data rebuild |
| **2c.** Outbound links to interlinears | **Yes — cheap.** We already deep-link Blue Letter Bible for lexicon entries | Half a day |

The single highest value-per-hour item on this list is **2b**. The reader has, without knowing it, spotted an actual mislabelling bug.

---

## Question 2 — the original languages

### What already ships

`app/lib/translations.js` has carried an `original` translation since [#40](https://github.com/adamswbrown/bible-tour/pull/40), and it reached mobile in [#44](https://github.com/adamswbrown/bible-tour/pull/44):

- **Hebrew OT** — Westminster Leningrad Codex via [openscriptures/morphhb](https://github.com/openscriptures/morphhb) (CC BY 4.0)
- **Greek NT** — SBLGNT with MorphGNT morphology (CC BY-SA 4.0 morphology; SBLGNT text free for non-commercial use)
- Built by `scripts/build-original-text.mjs` into `app/data/original-verses.json`
- Coverage: **234 verses — 120 Hebrew, 114 Greek** — every structured reference in the reading plan
- Renders RTL for Hebrew, offline, no network call

On top of that, **Originals mode** (the KJV word-tap) gives Strong's numbers, lemmas, glosses, and an "Open on Blue Letter Bible" link out of `app/components/LexiconDrawer.js`.

So most of question 2 is answered — it may simply not be discoverable enough. Worth checking whether the reader found the ORIG option in the translation picker at all.

### The Aramaic gap — a genuine bug

Roughly 1% of the Old Testament is Aramaic rather than Hebrew: Daniel 2:4b–7:28, Ezra 4:8–6:18 and 7:12–26, Jeremiah 10:11, and two words in Genesis 31:47.

The tour reading plan includes **Daniel 2:44 and Daniel 7:13-14** — all three sit inside Daniel's Aramaic section. We are already showing the reader Aramaic text. We are labelling it Hebrew, because `scripts/build-original-text.mjs:244` hardcodes the language:

```js
out[englishKey] = { lang: "hbo", text };
```

The fix is small and the data is already in hand. OSHB tags every word's language in its morph code — `H…` for Hebrew, `A…` for Aramaic. Verified directly against `wlc/Dan.xml`:

| Verse | Morph prefixes | Note |
|---|---|---|
| Dan 1:1 | `H` | Hebrew |
| Dan 2:3 | `H` | Hebrew |
| **Dan 2:4** | **`A`, `H`** | the switch verse — 2:4b is where Aramaic begins |
| **Dan 2:44** | **`A`** | in the plan, currently mislabelled |
| **Dan 7:13** | **`A`** | in the plan, currently mislabelled |
| Dan 8:1 | `H` | back to Hebrew |

The OSHB boundary lands exactly where the scholarship says it should, which is a good sign the tag is trustworthy.

**Work involved:**

1. `scripts/build-original-text.mjs` — `extractHebrewVerse()` already captures the whole `<w …>` open tag, so read `morph="…"` from it and emit `lang: "arc"` when the verse is predominantly `A`-tagged. Rebuild `original-verses.json`.
2. `app/page.js:475` — `isRtl` currently tests `v.lang === "hbo"`; add `"arc"` (Aramaic is RTL too).
3. Translation label and copyright string in `app/lib/translations.js` — "Original (Hebrew / Aramaic / Greek)".
4. Mirror into `mobile/lib/originals.ts` and `mobile/data/`.

Only 3 of the 234 verses change, so this is safe. It is also a nice thing to be able to write back to the reader.

### Adding interlinear link-outs

Cheapest possible win: a "See the interlinear" link in the verse panel, alongside the existing BLB lexicon link.

- **Blue Letter Bible** — already a dependency, already trusted by this codebase.
- **STEP Bible** — Tyndale House, supports version+reference query deep links, and their [STEPBible-Data](https://github.com/STEPBible/STEPBible-Data) is CC BY 4.0.
- **Bible Hub** — the interlinear is the best-known one. Chapter-level URLs (`biblehub.com/interlinear/matthew/1.htm`) are confirmed; the per-verse pattern needs a five-minute check before we ship a link builder.

No licensing exposure — these are outbound links to public pages.

---

## Question 1 — Catholic and Orthodox Bibles

This one ask is really two, and they have very different costs.

### 1a. Catholic/Orthodox translations of the books we already cover — easy

Every one of the 66 tour books exists in NABRE, NRSV-CE, RSV-2CE, Douay-Rheims and the rest. Adding them as *reading options* needs no new books and no canon change.

The app already has the pattern: NKJV, NLT, CSB and MSG sit in the picker with `yvLicensed: false` and deep-link out to YouVersion instead of rendering inline. Catholic editions slot straight into that shape. Verified YouVersion version IDs:

| Version | YouVersion ID | Status |
|---|---|---|
| Douay-Rheims Challoner 1752 (DRC1752) | `55` | Public domain |
| New American Bible Revised Edition (NABRE) | `463` | Copyright CCD/USCCB |
| NRSV Catholic Interconfessional (NRSV-CI) | `2015` | Copyright NCC |

**Link-out cost: a few lines in `app/lib/translations.js` and `mobile/lib/translations.ts`.** That is genuinely half a day including the mobile mirror.

**Inline cost is the open question.** YouVersion gates text access per version — that is exactly why NIV/NIrV/NIVUK/BSB carry `yvLicensed: true` and NKJV/NLT/CSB/MSG do not. Whether Crossway-style grants are obtainable for DRC1752 (public domain, so it should be uncontroversial) or NABRE (CCD permissions, historically slow) is unknown and needs an actual request through YouVersion's License Management. Worth asking for DRC1752 at minimum.

⚠️ **Douay-Rheims has a versification trap.** The DR follows Vulgate/Septuagint psalm numbering and counts psalm superscriptions as verse 1. The tour asks for "Psalms 23:1 and 46:1". In a DR text, **Psalm 46:1 is the superscription** — "Unto the end, for the sons of Core, for the hidden" — and "God is our refuge and strength" is 46:2. Verified against the `eng-dra.zefania.xml` text. Modern Catholic translations (NABRE, NRSV-CE, RSV-2CE) use Masoretic numbering and are unaffected. If we ship DR, we need a ref-mapping table — the same shape as the `ENGLISH_TO_HEBREW` map already in `scripts/build-original-text.mjs`.

**Orthodox is harder than Catholic.** There is no widely-licensed English Orthodox Bible with an API. The Orthodox Study Bible (St. Athanasius Academy Septuagint OT + NKJV NT) is Thomas Nelson, closed. The Eastern/Greek Orthodox Bible is a free non-commercial PDF, not a data feed. The realistic Orthodox-facing option is **Brenton's 1851 English Septuagint** — public domain, available from eBible.org — which is a Septuagint-based OT, i.e. the right textual tradition, but Victorian English and no NT.

### 1b. The deuterocanonical books themselves — a product decision

Adding Tobit, Judith, Wisdom, Sirach, Baruch, 1–2 Maccabees and the Greek additions to Esther and Daniel (plus, for Orthodox, 1 Esdras, 3 Maccabees, Prayer of Manasseh and Psalm 151) is where the real cost sits. Three separate problems:

**(i) There is no reading plan for them.** The whole app is a companion to Matt Whitman's *Lightning-Fast Field Guide* — 66 books, his verse picks. He didn't pick verses for Tobit. We would be authoring original editorial content and hanging it off a plan we explicitly say we are not affiliated with. That is the actual blocker, and it is not an engineering one.

**(ii) 66 is load-bearing in the code.** `TOTAL = BOOKS.length` drives the progress percentage (`app/page.js:666`), and the milestone thresholds are hardcoded integers in **both** clients:

```js
// app/page.js and mobile/lib/milestones.ts
{ id: "quarter",       threshold: 17 },  // 25% of 66
{ id: "half",          threshold: 33 },
{ id: "three-quarter", threshold: 50 },
{ id: "complete",      threshold: 66, message: "Amazing! All 66 books!" },
```

Extending `BASE_BOOKS` would silently un-complete everyone who has finished the tour, and their badge would come back as incomplete. Any canon work has to be a **separate opt-in track** with its own counter, not an extension of the existing list.

**(iii) Which Orthodox canon?** There isn't one. Greek Orthodox, Slavonic (adds 2 Esdras), and Ethiopian Tewahedo (much broader — Enoch, Jubilees) differ. We would have to pick, and picking is a doctrinal statement the app has so far avoided.

**Text sources, if we did go ahead:**

| Source | Licence | Notes |
|---|---|---|
| [WEB Catholic Edition](https://ebible.org/eng-web-c/) (`eng-web-c`) | Public domain | Modern English, Catholic book order, Greek Esther/Daniel. Best single option. |
| [Brenton's English Septuagint](https://ebible.org/eng-Brenton/) | Public domain | Covers the Orthodox OT including 1 Esdras, 3 Macc, Ps 151. Victorian English. |
| [thedouayrheims.com](https://thedouayrheims.com/download) | CC0 | JSON + USFM. This is the *original* 1582/1610 DR, not Challoner — considerably more archaic. |
| `seven1m/open-bibles` `eng-dra.zefania.xml` | Public domain | ⚠️ **Do not use as-is.** See below. |

⚠️ **The obvious PD source is broken.** We already depend on `seven1m/open-bibles` for the tagged KJV, so `eng-dra.zefania.xml` looks like a free win. It isn't. Inspecting the file: it is **missing Sirach, 1 Maccabees and the Greek additions to Esther**, it *includes* Psalms of Solomon (not canonical for Catholics), and its Psalms book has **152 chapters** instead of 150. Any deuterocanon work needs eBible.org or thedouayrheims.com, plus a book-list assertion in the build script.

### Original languages for the deuterocanon

If the deuterocanon ever ships, the ORIG translation would need the Septuagint, and the licensing is murkier than the WLC/SBLGNT we use today:

- **Rahlfs 1935** — the standard text. The common machine-readable form derives from CCAT/CATSS, whose licence is **restrictive** (signed user declaration required). Rahlfs-Hanhart (2006) is squarely under German Bible Society copyright.
- **Swete 1930** — public domain, safe, slightly older text.
- **[STEPBible-Data](https://github.com/STEPBible/STEPBible-Data)** — CC BY 4.0 repo-wide, ships LXXo/LXXn/LXXe alongside TAHOT and TAGNT. Attractive, but their LXX morphology is CCAT-derived, so the repo-level CC BY 4.0 claim deserves a careful read before we rely on it.

Sirach also has partial Hebrew (Cairo Geniza, Masada) and Tobit partial Aramaic (Qumran) — interesting, but well past what this app needs.

---

## Recommended sequence

1. **Ship the Aramaic fix.** ~1 hour, corrects a real mislabelling, and lets us tell the reader their second question is now fully answered. Do this first.
2. **Add interlinear link-outs** in the verse panel. Half a day, no licensing exposure.
3. **Add DRC1752, NABRE and NRSV-CI as link-out translations.** Half a day. Answers "Catholic Bibles?" honestly and immediately, in the same shape NKJV/NLT already use.
4. **Request YouVersion text access for DRC1752.** Public domain, so the ask is low-friction. If granted, it renders inline — but land the DR psalm-numbering map first.
5. **Park the deuterocanon** behind an explicit product decision. If it goes ahead, build it as a separate opt-in track with its own progress counter, sourced from WEB Catholic Edition, and never by extending `BASE_BOOKS`.

Orthodox inline text is the one item I would not promise. There is no licensable modern English Orthodox Bible with a data feed, and Brenton is a real but partial answer.

---

## Suggested reply to the reader

> Thank you — both good questions, and the second one caught something.
>
> On the original languages: there is already an "Original (Hebrew / Greek)" option in the translation picker, covering every verse in the tour — Westminster Leningrad Codex for the Old Testament, SBLGNT for the New. Tapping a word in the KJV also opens Strong's with a link through to Blue Letter Bible.
>
> On Aramaic — you're right that it deserves naming. Daniel 2:44 and 7:13-14 are in the tour, and all three are Aramaic, not Hebrew. We were already showing you the Aramaic; we were just calling it Hebrew. That's being fixed, and I'm adding links out to a full interlinear.
>
> On Catholic and Orthodox Bibles: adding Douay-Rheims, NABRE and the NRSV Catholic Edition as reading options is straightforward and I'm doing it. The deuterocanonical books themselves are a bigger question — the tour follows Matt Whitman's 66-book plan, so there are no verse picks for Tobit or Sirach to point you at. It's on the list, but as its own thing rather than bolted onto the tour.

---

## Sources

- [openscriptures/morphhb](https://github.com/openscriptures/morphhb) — WLC with H/A language-tagged morphology (CC BY 4.0)
- [STEPBible/STEPBible-Data](https://github.com/STEPBible/STEPBible-Data) — TAHOT, TAGNT, LXX texts (CC BY 4.0)
- [seven1m/open-bibles](https://github.com/seven1m/open-bibles) — the project's existing KJV source; also carries `eng-dra.zefania.xml`
- [World English Bible (Catholic)](https://ebible.org/eng-web-c/) · [Brenton Septuagint Translation](https://ebible.org/eng-Brenton/) · [Douay-Rheims 1899](https://ebible.org/engDRA/copyright.htm)
- [The Original Douay-Rheims Bible — downloads](https://thedouayrheims.com/download) and [API](https://thedouayrheims.com/api) (CC0)
- [YouVersion Platform](https://platform.youversion.com/) · [licence management](https://partner-support.youversion.com/l/en/article/v9jc7p1ttb-license-management)
- YouVersion versions: [DRC1752 (55)](https://www.bible.com/versions/55) · [NABRE (463)](https://www.bible.com/versions/463) · [NRSV-CI (2015)](https://www.bible.com/versions/2015-nrsv-ci-new-revised-standard-version-catholic-interconfessional)
- [Biblical Aramaic](https://en.wikipedia.org/wiki/Biblical_Aramaic) — extent of the Aramaic portions
- [Why Are There Different Numbering Systems for the Psalms?](https://stpaulcenter.com/posts/why-are-there-different-numbering-systems-for-the-psalms) — Vulgate vs Masoretic numbering
- [Alfred Rahlfs' edition of the Septuagint](https://en.wikipedia.org/wiki/Alfred_Rahlfs%27_edition_of_the_Septuagint) · [eliranwong/LXX-Rahlfs-1935](https://github.com/eliranwong/LXX-Rahlfs-1935) — CCAT licence restrictions
- [Orthodox Study Bible](https://en.wikipedia.org/wiki/Orthodox_Study_Bible) — St. Athanasius Academy Septuagint + NKJV, Thomas Nelson
