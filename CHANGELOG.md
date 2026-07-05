# Changelog

All notable user-facing changes to Tour of the Bible.

This project ships continuously to [bible-tour.vercel.app](https://bible-tour.vercel.app)
and doesn't follow semver — entries are grouped under the date they shipped
to production. Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## Unreleased — Resume on mobile & Berean Standard Bible

### Added
- **Original (Hebrew / Greek) on mobile** — the ORIG translation option
  from the web Tour is now in the mobile app too. The same 234 curated
  verses ship inside the app bundle (Westminster Leningrad Codex Hebrew,
  SBLGNT Greek), render offline with right-to-left layout for Hebrew,
  and fall back to a gentle notice for references the bundle doesn't
  cover.
- **Pick up where you left off (mobile)** — the Tour tab now shows a
  one-tap **Resume** card for the last verse you opened in the reader,
  matching the resume pill the web Tour has had. The entry is stored
  on-device under `bt:resume`, refreshes as you step through a book's
  passages, and can be dismissed with ✕ (it also clears when you reset
  progress in Settings).
- **Berean Standard Bible (BSB)** — new reading translation on both the
  web Tour and the mobile app. The BSB is a modern English translation
  dedicated to the public domain; it renders inline via the YouVersion
  Developer API (Bible ID 3034), the same pipeline as the NIV family.

## 2026-06-07 — Swipe down to go back (Android)

### Fixed
- On the Android app, the verse screen showed a **"Swipe down to go back"**
  hint but the gesture did nothing — `presentation: 'modal'` only provides a
  swipe-to-dismiss sheet on iOS. The verse screen now drives the dismiss
  itself with a pan gesture on the grabber handle, so swiping down closes the
  passage on both Android and iOS.

## 2026-05-31 — Modern default translation

### Changed
- The default reading translation is now the **NIV** instead of the KJV, on
  both the web Tour and the iOS app. The KJV's Jacobean English can be a
  hurdle for first-time readers, so new visitors now land on a plain-modern
  translation by default. Anyone who has already picked a translation keeps
  their choice (it's still stored under `bt:translation`), and every
  translation — including the KJV and its Originals/Strong's study mode —
  remains one tap away in the verse panel and in Settings.

## 2026-05-29 — Memory

### Added
- **Memory** — a calm, scheduler-free surface for learning verses by heart.
  - A **☆ Memorize** toggle in the verse panel saves any open verse to your
    deck (stored in `localStorage` under `bt:memory`, like all other state).
  - A new `/memory` page lists your saved verses and offers a **practice**
    surface for each: a **Full → Initials → Blanks** fade ladder, tap-any-word
    to peek, and ESV per-verse audio to settle the verse in your ear.
  - A **browse key verses by book** picker to add curated key verses without
    leaving the page.
  - Deliberately no review schedule, due dates, or streaks — just a quiet
    place to drill verses whenever you like.
  - A floating **★ Memory** chiclet (and a permanent footer link), shown
    once the home-page Memory banner is dismissed or once you've saved at
    least one verse — so there's always a path to /memory after you engage.
  - A dismissible "New — Memory" banner on the home page introduces the
    feature, matching the existing Eagle / Originals / mobile-app banners.

## 2026-04-26 — ESV text & audio

### Added
- ESV reading translation via the Crossway API. Slots into the translation
  picker alongside the NIV family and renders inline with the required
  Crossway citation. ([#18](https://github.com/adamswbrown/bible-tour/pull/18))
- Per-verse audio playback (ESV narration) via the Crossway API. An inline
  `<audio>` element appears in the verse panel for every structured
  reference and streams MP3 directly from Crossway's CDN.
  ([#16](https://github.com/adamswbrown/bible-tour/pull/16))
- "ESV Audio" pill on the audio player so the audio-translation contract
  stays clear when the user picks a different reading translation.
  ([#17](https://github.com/adamswbrown/bible-tour/pull/17))
- This `CHANGELOG.md`, seeded with the day's batch.
  ([#22](https://github.com/adamswbrown/bible-tour/pull/22))
- ESV text and toggleable ESV audio on the Eagle Method book pages. The
  Eagle translation picker now includes ESV; a "🎧 Audio" toggle in the
  controls bar (default off, persisted per browser) reveals an inline ESV
  audio player on every structured verse card and a Crossway citation
  footer when on. ([#24](https://github.com/adamswbrown/bible-tour/pull/24))

### Changed
- Toggling **Originals** on now auto-switches the translation picker to KJV
  so the tagged Strong's tokens render inline in the main verse text.
  Previously the originals rendered in a separate section beneath the
  user's chosen translation, which read as broken on non-KJV translations.
  ([#19](https://github.com/adamswbrown/bible-tour/pull/19))
- ESV passages omit inline `[N]` verse markers — the verse range shown in
  the panel header is the canonical reference, so the markers were
  redundant. ([#20](https://github.com/adamswbrown/bible-tour/pull/20))
- README updated to document the Crossway integration end-to-end and the
  new Originals auto-switch behaviour.
  ([#21](https://github.com/adamswbrown/bible-tour/pull/21))

### Configuration
- New environment variable `ESV_API_KEY` powers both `/api/verse-esv`
  (text) and `/api/verse-audio` (audio). Set it in `.env.local` for local
  dev and in Vercel project settings (Production scope) for the live site.

## 2026-04-22 — Cross-navigation between Tour and Eagle

### Added
- Floating Eagle Method button on the Tour page once the announcement
  banner is dismissed, so the entry point doesn't disappear.
  ([#13](https://github.com/adamswbrown/bible-tour/pull/13))
- Floating Tour button on Eagle Method pages for symmetric navigation
  back. ([#14](https://github.com/adamswbrown/bible-tour/pull/14))

## 2026-04-19 — Originals released

### Added
- **Originals** mode (originally shipped as "Study Mode"). Tap any KJV
  verse with the toggle on to see Hebrew/Greek lemmas, Strong's numbers,
  and short glosses inline. Tap a word for the popover entry, or "Full
  entry" for the extended lexicon entry in a side drawer. Each lexicon
  entry includes an "Open on Blue Letter Bible" deep-link.
- Tagged Strong's data bundled at build time via two new scripts
  (`build-lexicon.mjs`, `build-tagged-verses.mjs`). Sources: kaiserlik/kjv
  (KJV+Strong's, public domain) and Open Scriptures (Strong's Hebrew/Greek
  dictionaries, CC BY-SA 3.0).
- StudyVerse, WordPopover, and LexiconDrawer components.
- Originals also rendered as a separate "Original (KJV)" section beneath
  the user's chosen translation when not on KJV (later changed in #19).
- Banner announcing Originals on first visit, dismissable independently
  from the Eagle banner.
  ([#10](https://github.com/adamswbrown/bible-tour/pull/10),
  [#11](https://github.com/adamswbrown/bible-tour/pull/11))
- Floating **Feedback** button that opens a pre-filled email so users can
  report issues without leaving the app.
  ([#12](https://github.com/adamswbrown/bible-tour/pull/12))
- `DATA-SOURCES.md` documenting the Originals build pipeline, licensing,
  and known limitations.

### Changed
- "Study Mode" renamed to **Originals** to avoid colliding with the Eagle
  Method's study terminology.

## 2026-04-11

### Removed
- Stale PIN/login claims from the README and dead login styles from
  `app/page.js` — the app has never required authentication.
  ([#8](https://github.com/adamswbrown/bible-tour/pull/8),
  [#9](https://github.com/adamswbrown/bible-tour/pull/9))

## 2026-03-30

### Added
- Vercel Web Analytics for traffic insight without third-party trackers.
  ([#7](https://github.com/adamswbrown/bible-tour/pull/7))

## 2026-03-29 — Eagle Method polish

### Added
- Milestone awards on the Eagle Method index for completing reading
  groupings. ([#3](https://github.com/adamswbrown/bible-tour/pull/3))
- "Spreading Wings" milestone for finishing the Gospels and Acts.
  ([#4](https://github.com/adamswbrown/bible-tour/pull/4))
- iPad-optimised split-pane layout for the verse reader, so the checklist
  and verse panel sit side-by-side at 768px and up.
  ([#5](https://github.com/adamswbrown/bible-tour/pull/5))

### Changed
- Eagle Method UX on iPad reworked into river-flight stage panels for a
  smoother reading flow at large screens.
  ([#6](https://github.com/adamswbrown/bible-tour/pull/6))

## 2026-03-28

### Fixed
- Verse concatenation bug when fetching multi-part references from
  YouVersion. ([#1](https://github.com/adamswbrown/bible-tour/pull/1))
- Isaiah references rendering as 2 cards instead of 3.
  ([#2](https://github.com/adamswbrown/bible-tour/pull/2))

## 2026-03-27 — Eagle Method introduced

### Added
- **Eagle Method**: per-book pages with verse previews, translation
  picker, and "Mark as Studied" tracking. Complementary to the main tour:
  Eagle works at the book level ("where am I in this book?") while the
  tour works at the reference level.
- Build scripts that fetch chapter summaries and book data for the
  Eagle pages.

### Removed
- Unused user authentication and avatar components — the app has always
  been local-only.

## 2026-03-16 — Initial release

### Added
- Reading checklist covering all 66 books with curated verse references
  from Matt Whitman's *Lightning-Fast Field Guide to the Bible*.
- Per-book progress tracking saved entirely in `localStorage` — no
  backend, no accounts, no tracking.
- Inline verse reader panel — tap any reference to read the passage
  without leaving the app or opening a new tab.
- Translation picker with KJV, NIV, NIrV, NIVUK, NKJV, NLT, CSB, MSG,
  WEB, and ASV.
- **YouVersion Developer API** integration for licensed translations
  (NIV, NIrV, NIVUK) via a server-side proxy that keeps the API key
  secret.
- **bible-api.com** integration for public-domain translations (KJV,
  WEB, ASV).
- Two-layer caching for the verse proxy: Next.js Data Cache for 7 days
  across serverless invocations, plus Vercel Edge CDN for 7 days with
  stale-while-revalidate.
- TMBH-styled brand: brand-yellow `#FFCB21`, matching typography.
- Affiliation disclaimer (not affiliated with The Ten Minute Bible Hour)
  and YouTube link to Matt Whitman's tour explainer.
- README documenting setup, architecture, and caching strategy.

### Configuration
- Environment variable `YOUVERSION_API_KEY` for the YouVersion proxy.
