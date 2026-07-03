# Competitor Research & Five Feature Recommendations

*Researched 2026-07. Covers the web app ([app/](../app)) and the iOS app ([mobile/](../mobile)).*

Every recommendation below is filtered through the hard rules in
[project-decisions.md](./project-decisions.md): **never monetise, no AI/LLM
features, no accounts, local-only notifications, no offline mode for licensed
text**. Several of the biggest competitor bets (AI assistants, social feeds,
cloud sync, premium tiers) are therefore deliberately off the table — which is
itself a differentiator worth leaning into.

---

## 1. Competitor landscape

| App | Category | What they do well | What we take from it |
|---|---|---|---|
| **YouVersion Bible App** | General reader | 10,000+ reading plans, streaks, highlights/notes, verse-of-the-day, home/lock-screen widgets, shareable verse images | Widgets and glanceable progress; highlights & verse images. Their plans are broad; our single curated 90-minute tour is the counter-position. |
| **Dwell** | Audio-first | 75+ listening plans, playlists that chain passages with no break, sleep mode, background playback, 20+ voices | Continuous listening. We already have per-verse ESV audio; chaining it is the obvious next step. |
| **BibleProject app / The Bible Recap** | Guided journey | Book-overview videos *before* you read a book; structure/theme orientation; daily context resources | Pre-book context cards. Closest in spirit to the Tour — they prove that a little orientation before each book dramatically improves completion. |
| **The Bible Memory App / Remember Me / Bible Memory (flashcards)** | Memorization | Spaced-repetition scheduling, first-letter & typing modes, heat maps of weak spots, topical starter collections | A review queue and extra practice modes for our Memory feature. Remember Me is free/open-source and account-less — proof the category works without a backend. |
| **Blue Letter Bible / Logos / Olive Tree** | Deep study | Interlinear text, Strong's lookups, cross-references, commentaries, split view | We already link out to BLB from Originals. Cross-references and full-chapter context are the portable ideas; full commentary stacks are out of scope. |
| **Hallow / Glorify / Bible in One Year** | Habit & devotion | Daily sessions, reminders, streaks, polished onboarding | Gentle habit scaffolding (widgets, resume, milestones) without guilt mechanics — we keep the no-streak-pressure tone the Memory feature already set. |

**Where the Tour already wins:** a single finishable journey (66 books, ~90
minutes) instead of an infinite library; zero accounts and zero tracking;
Originals word-level study inline; free forever. The five features below deepen
that identity rather than chase the general-reader apps.

---

## 2. Five recommended features

### Feature 1 — Book context cards ("Before you land")
*Inspired by: BibleProject book-overview videos, The Bible Recap daily context.*

A short, static orientation card shown the first time a user opens a book in
the checklist: genre, author/era, where it sits in the story, one paragraph of
"what to listen for," and a link to the matching timestamp in Matt Whitman's
tour video. BibleProject's whole thesis — orient before you read — is the
single best-proven retention feature in this category.

- **Web:** collapsible card at the top of each book's section in `page.js`.
- **iOS:** slide-up sheet on first tap of a book row; "About this book" button thereafter.
- **Fits constraints:** hand-written build-time JSON (66 entries), no AI, no network.
- **Effort:** mostly content writing; rendering is small. The data file is shared by both clients like `tagged-verses.json`.

### Feature 2 — Continuous listening mode (chapter-hop playlist)
*Inspired by: Dwell playlists and sleep mode.*

Chain the ESV per-verse audio for a whole book — or the whole remaining tour —
into an auto-advancing playlist: "Listen to this book" / "Listen from here."
Dwell shows that uninterrupted listening is the killer commute/walk mode, and
we already have the audio plumbing (`/api/verse-audio`, `AudioPlayer.tsx`).

- **Web:** queue in the existing player + Media Session API for lock-screen/metadata controls.
- **iOS:** background-audio session (already configured for App Store, per the launch checklist), `expo-av` queue, now-playing info, optional "mark verse read when its audio finishes."
- **Fits constraints:** streaming-only ESV, same non-commercial usage; edge caching keeps us far under Crossway's rate ceilings, and the mobile LRU cache cap (500 verses) already planned in project-decisions covers the on-device side.
- **Effort:** medium. Queue logic + auto-advance on both clients; no new APIs.

### Feature 3 — iOS widgets + Shortcuts ("glanceable tour")
*Inspired by: YouVersion home/lock-screen widgets; 2026's crop of dedicated Bible-widget apps.*

A WidgetKit home-screen widget (progress ring, next unread book, one-tap
resume of the last verse — the mobile twin of the web's resume bar), a
lock-screen accessory widget, and an App Intent so "Continue the Tour" works
from Shortcuts/Siri. Widgets are the highest-leverage retention surface on iOS
that requires no notifications and no server.

- **iOS:** WidgetKit extension via Expo (`@bacons/apple-targets` or a config plugin); reads progress from a shared App Group written by `lib/progress.ts`.
- **Web:** the equivalent glanceable is a PWA manifest + install prompt and a resume-aware `/` — cheap and worth doing while we're in there.
- **Fits constraints:** purely local data (App Group storage), no accounts, no push.
- **Effort:** medium-high (native target + EAS config), but it's the one feature on this list nothing in our stack currently offers at all.

### Feature 4 — Gentle spaced review for Memory verses
*Inspired by: The Bible Memory App, Remember Me, Bible Memory flashcards.*

Every serious memorization app runs on spaced repetition; ours currently has
the fade ladder but no notion of "due." Add a lightweight review queue: each
practiced verse gets an interval (1d → 3d → 7d → 21d → 60d), the Memory tab
surfaces "3 verses ready for review" ordering, and the existing opt-in daily
reminder can mention the count. Keep the app's stated tone — no streaks, no
guilt, nothing breaks if you ignore it — which is exactly where competitors
get complaints (see reviews of The Bible Memory App's pressure mechanics).

Add one practice mode while we're in there: **first-letter mode** (show only
initials, type or tap to reveal) — the single most-requested mode across
competitor reviews, and our fade ladder's "Initials" rung is already halfway
there.

- **Web + iOS:** interval scheduling is a pure function over the existing starred-verse store (`lib/memory.ts` / localStorage); reminder text change rides the existing local notification.
- **Fits constraints:** local-only data, local-only notifications, no accounts.
- **Effort:** small-medium. Data model change is additive (per-verse `interval`, `dueAt`).

### Feature 5 — Highlights, notes & shareable progress card
*Inspired by: YouVersion highlights/notes and verse images.*

Two halves of the same "make it mine" gap:

1. **Local highlights + a one-line note per tour verse.** Tap-and-hold a verse
   to tint it and jot a thought; notes surface on the checklist row so the
   tour becomes a keepsake journal. Stored exactly like progress
   (localStorage / AsyncStorage), exportable as plain text/JSON so nothing is
   locked in.
2. **Shareable card.** A canvas-rendered image — verse text *or* a milestone
   card ("34/66 books · through the Prophets") — for Messages/socials.
   **Licensing guardrail:** verse-text cards use public-domain translations
   only (KJV/WEB/ASV) with the required attribution baked into the image;
   milestone cards carry no scripture text and are always safe. This is the
   only organic-growth loop available to an app that will never advertise.

- **Web:** `<canvas>` → `navigator.share`/download; highlight state joins the existing localStorage schema.
- **iOS:** `react-native-view-shot` + share sheet; same store shape in AsyncStorage.
- **Fits constraints:** no backend, no accounts; sharing is user-initiated.
- **Effort:** medium. The card renderer is shared design work; storage is additive.

---

## 3. Suggested order

| # | Feature | Why this order |
|---|---|---|
| 1 | Book context cards | Cheapest, most on-brand, improves completion of the core loop |
| 2 | Spaced review for Memory | Small code change, big lift to an existing feature |
| 3 | Continuous listening | Reuses existing audio stack; unlocks commute/walk usage |
| 4 | iOS widgets + Shortcuts | Highest retention leverage, but needs a native target |
| 5 | Highlights/notes + share card | Broadest surface area; share card is the growth loop |

## 4. Explicitly rejected (and why)

- **AI verse explanation / summaries** (YouVersion, Logos AI, FaithTime) — banned permanently by project decisions; also closes the YouVersion AI clause.
- **Social/community feeds, friends, group plans** (YouVersion, Remember Me campaigns) — requires accounts and a backend; both banned.
- **Cloud cross-device sync** — iCloud KV / Android Auto Backup already decided; no custom sync.
- **Offline licensed translations** (Olive Tree's strength) — explicitly ruled out; only bundling public-domain KJV/WEB/ASV remains a future performance option.
- **Streaks with loss-aversion mechanics** (YouVersion, Hallow) — conflicts with the product's stated no-guilt tone; milestones + widgets deliver the habit cue without the pressure.

## Sources

- [YouVersion Bible App](https://www.youversion.com/bible-app) · [reading plans](https://www.bible.com/reading-plans) · [iOS widget docs](https://help.youversion.com/l/en/article/11tgx3c639-widget-ios)
- [Dwell audio Bible](https://dwellapp.io/) · [Dwell vs other Bible apps](https://help.dwellapp.io/article/100-what-is-the-difference-between-dwell-and-other-bible-apps)
- [BibleProject reading plans](https://bibleproject.com/reading-plans/) · [The Bible Recap](https://www.thebiblerecap.com/start)
- [The Bible Memory App](https://biblememory.com/) · [Remember Me](https://www.remem.me/) · [Bible Memory flashcards](https://bible-memory.app/features.html) · [Best Bible memory apps compared](https://www.biblememorygoal.com/memory-methods/best-bible-memory-apps/)
- [Blue Letter Bible alternatives 2026](https://www.scriptureverse.app/blog/7-best-blue-letter-bible-alternatives-for-bible-study-in-2026) · [Logos app comparison](https://www.logos.com/popular-bible-apps)
- [Best Bible apps 2026 (features)](https://thefirstverse.app/blog/best-bible-apps-2026/) · [Best apps for consistent Bible reading](https://www.faithtime.ai/content/general/best-apps-for-consistent-bible-reading/)
