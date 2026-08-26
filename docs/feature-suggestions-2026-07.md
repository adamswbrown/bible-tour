# Feature Suggestions — July 2026

Candidate features for Tour of the Bible, grounded in the current codebase and
checked against the hard rules in [project-decisions.md](project-decisions.md):
**never monetise · no AI/LLM features · no accounts · local-only notifications ·
no offline mode for licensed text.**

Every suggestion below is compatible with all five rules. Ideas that would
violate them (AI summaries, cloud sync, social/community features) are
deliberately absent — see "Not suggesting" at the bottom.

Snapshot of what already exists, so these don't duplicate shipped work:
Tour checklist + inline reader (7 translations), ESV per-verse audio, resume
bar, reading-milestone shelf, Memory with practice ladder (web + mobile v2 with
Deck/Library and daily reminder), Eagle Method with milestones, Originals
(Strong's on KJV, tour verses only), iOS TestFlight + Android closed testing.

---

## Tier 1 — high value, builds directly on what's there

### 1. Progress backup & transfer (no accounts)

All user state lives in `localStorage` / AsyncStorage (`bt:*` keys: progress,
memory deck, translation, resume point). One cleared browser cache and months
of progress is gone, and there is no way to move progress from the web app to
the phone app or between iPhone and Android.

- **What:** an "Export my data" button (Settings on mobile, footer on web)
  that produces a single JSON blob of all `bt:*` state, plus an import surface
  that accepts the file — or a QR code the other device scans.
- **Why it fits:** stays account-less forever; the user carries their own
  data. It also quietly solves the cross-platform sync gap that
  project-decisions.md rules out building server-side.
- **Where:** web `app/page.js` footer + a small `app/lib/backup.js`; mobile
  `mobile/app/(tabs)/settings.tsx`. No new services, no new deps on web
  (QR generation would need one small lib, or skip QR and start file-only).
- **Effort:** small (file-based) to medium (QR handoff).

### 2. Full-Bible Originals coverage (the promised v2)

README already commits to this: "Tour verses only — 234 tagged references
across all 66 books. Full-Bible coverage planned for v2." And
project-decisions.md separately requires replacing the kaiserlik/kjv source
(no LICENSE file) with `seven1m/open-bibles` + `openscriptures/strongs`
before mobile launch.

- **What:** one piece of work that does both — rebuild
  `tagged-verses.json` from the properly-licensed source at full-Bible scope,
  so any KJV verse (including full-chapter reads, #4 below) gets tappable
  Strong's words.
- **Watch:** bundle size. 31k verses of tagged text won't fit in the current
  build-time JSON approach; likely needs per-book chunks loaded on demand
  (web) and a lazy asset strategy on mobile.
- **Where:** `scripts/build-tagged-verses.mjs`, `app/data/`,
  `mobile/data/`, loaders in `StudyVerse` components.
- **Effort:** medium — mostly data pipeline, the UI already exists.

### 3. Dark mode

The web app has no `prefers-color-scheme` handling at all — the TMBH navy/gold
palette is hard-coded as inline styles in `app/page.js`. A Bible app gets a
lot of late-evening reading; a dark theme is the most-requested kind of
comfort feature and needs zero new data or APIs.

- **What:** honour `prefers-color-scheme: dark` with a manual override toggle
  persisted under `bt:theme` (matching the existing `bt:*` convention). The
  brand gold `#FFCB21` already works beautifully on dark navy.
- **Where:** `app/page.js` colour constants (`C`) become theme-aware;
  `app/memory/page.js` and Eagle pages inherit. Mobile follows with
  `useColorScheme()`.
- **Effort:** medium on web (the inline-style approach means touching many
  style objects once), small on mobile.

### 4. "Keep reading" — expand to the full chapter

The tour deliberately serves tastes, but the natural next step after a taste
is a bite. When a key verse lands, the reader currently has to leave the app
to read the surrounding chapter.

- **What:** a "Read the whole chapter" link at the bottom of the verse panel
  that swaps the panel content for the full chapter (same translation, same
  proxies — YouVersion passages, `bible-api.com`, and the ESV API all accept
  chapter references already). Resume bar keeps working.
- **Why it fits:** deepens engagement without adding any new vendor,
  licence, or caching story — chapter responses cache at the edge exactly
  like verse responses.
- **Watch:** YouVersion/Crossway per-request verse-count limits — may need to
  fetch a chapter in two chunks for long chapters.
- **Where:** `app/page.js` verse panel + the three `app/api/verse*` routes
  (mostly already capable); mobile `mobile/app/verse.tsx`.
- **Effort:** small–medium.

## Tier 2 — strong candidates

### 5. Cross-references — "where does this echo?"

A static, build-time dataset (e.g. the openbible.info cross-reference set,
CC-BY) mapping each of the 234 tour verses to its strongest handful of
related passages. Tapping one opens it in the existing verse panel.

- **Why it fits:** pure data, no AI, no new runtime service — same build-time
  bundling pattern as the lexicon. It's the book-to-book connective tissue
  the tour's "whole Bible in 90 minutes" framing is about.
- **Where:** new `scripts/build-crossrefs.mjs` → `app/data/crossrefs.json`
  (tour verses only keeps it tiny), a "Connections" strip in the verse panel.
- **Effort:** medium. Licence note: CC-BY attribution goes in
  `DATA-SOURCES.md` like the others.

### 6. Private notes

A small "What did you notice?" text area per verse (and per book on Eagle
pages), stored under `bt:notes` in localStorage/AsyncStorage, included in the
#1 export. No accounts, no cloud, no prompts to write — just there if wanted.

- **Where:** verse panel in `app/page.js`, `mobile/app/verse.tsx`.
- **Effort:** small.

### 7. Verse share cards

A "Share" action that renders the current verse as a clean branded image
(navy card, gold accent, reference + translation + required copyright line)
via canvas on web and `react-native-view-shot` + the native share sheet on
mobile.

- **Watch:** licensing. Public-domain translations (KJV/WEB/ASV) are
  unrestricted; NIV-family and ESV single-verse quotations with the required
  attribution line fall within standard quotation allowances, but the exact
  YouVersion Per-Tool Terms (still open per project-decisions.md) should be
  checked first — or v1 ships with share enabled for public-domain
  translations only.
- **Effort:** medium.

## Tier 3 — worth keeping on the radar

### 8. Installable PWA + bundled public-domain text (web)

Add a manifest + service worker so the web app installs to the home screen,
with the app shell and KJV/WEB/ASV tour verses precached.
project-decisions.md explicitly allows bundling public-domain text as a
performance/reliability decision; licensed translations stay streaming-only.
Effort: medium.

### 9. Home-screen widget (mobile)

"Next stop on the tour" or today's memory verse as an iOS/Android widget —
fully local data, taps through to the verse screen. Effort: large for what it
is (native widget extensions sit awkwardly with Expo managed workflow;
needs `@bacons/expo-apple-targets` or a config plugin), so ranked down
despite being a lovely fit.

### 10. Quiet journey stats

A single calm page — books completed, stops read, verses memorised, milestone
shelf recap. No streaks (Memory's "no schedule, no streaks" stance stays),
no comparisons, nothing push-y; just a look back. Effort: small.

---

## Not suggesting (and why)

- **Passage summaries / "explain this verse"** — no AI, permanent rule.
- **Accounts / cloud sync / social features** — account-less forever; #1
  covers the real need (not losing data) without any backend.
- **Streaks or gamified reminders** — Memory's design deliberately rejects
  schedules and streaks; extending gamification would cut against the app's
  calm register. The milestone shelf is already the right amount.
- **Offline licensed translations** — explicitly ruled out; #8 bundles only
  public-domain text.
- **Audio Bible beyond ESV** — already tracked as
  [issue #15](https://github.com/adamswbrown/bible-tour/issues/15); not
  re-suggested here.

## Suggested order

1 (backup/export) → 3 (dark mode) → 4 (keep reading) → 2 (Originals v2,
paired with the licensing to-do) → 5 (cross-references) → 6 (notes) → then
reassess.
