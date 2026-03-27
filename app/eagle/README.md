# Eagle Method

This folder contains the Eagle Method study flow for the Bible Tour app.

The feature has two user-facing routes:

- `/eagle`
  Client-side index page for browsing all 66 books.
  Includes OT / NT filtering, a simple "studied" tracker, and a link to the source Eagle Method video.
- `/eagle/[book]`
  Server-rendered book page that walks the reading-plan targets through the three Eagle Method stages:
  `Survey`, `Map`, and `Current`.

## Current UX

### `/eagle`

- Hero explaining the three-stage method.
- Local study tracking stored in `localStorage` under `bt:eagle`.
- Filters for `All`, `Old Testament`, and `New Testament`.
- Per-book cards showing:
  - book name
  - reading-plan references
  - optional note from the plan
  - chapter count from the local chapter summary data
- Inline studied toggle on each card.
- Reset button that clears the Eagle-only local study state.

### `/eagle/[book]`

- Static params generated for every canonical book slug.
- Hero section with book name, testament, reading-plan refs, and chapter count.
- Anchor strip for the three stages.
- Previous / next navigation between books.

#### Stage 1: Survey The River

- Shows the three framing questions from the Eagle Method:
  - Who wrote it, and when?
  - Who were the original audience?
  - What is the purpose of the book?
- Pulls book overview data from `app/data/book-info.json`.
- If local overview data is missing, it can fall back to IQ Bible `GetBookInfo` when `IQ_BIBLE_API_KEY` is configured.
- Renders:
  - author
  - date
  - audience
  - purpose
  - genre
  - trimmed intro / summary copy
- If no overview data is available, the page shows an empty-state message instead.

#### Stage 2: Map The River

- Parses the book’s reading-plan refs with helpers in `app/lib/bible.js`.
- Supported ref shapes:
  - single verse, e.g. `3:16`
  - same-chapter range, e.g. `2:8-10`
  - cross-chapter range, e.g. `52:13-53:12`
  - chapter span text, e.g. `chapters 10-29`
  - unstructured qualitative text as a fallback
- Builds a chapter map from the local chapter summary data.
- Highlights target chapters in the map.
- Shows a per-target card with:
  - book-level position
  - verse-level position when IQ Bible verse counts are available
  - fallback chapter-only messaging when verse counts are unavailable
- Verse counts come from IQ Bible `GetVerseCount` via `app/lib/iq-bible.js`.

#### Stage 3: Follow The Current

- Uses `app/data/chapter-summaries.json` as the primary source of context.
- Builds context windows around each structured target:
  - usually `target chapter ± 1`
  - full span for chapter-range targets
- Merges overlapping windows.
- Renders chapter summary cards inside each window.
- Highlights chapters that contain the target ref(s).
- Shows attribution and source link for the chapter summary dataset in the footer.

## Data + Helpers

### `app/lib/bible.js`

Shared source of truth for:

- canonical book metadata
- reading-plan refs and notes
- book ids
- slugs and numeric slug aliases
- reference parsing helpers

This module is used by both the main tour page and the Eagle feature.

### `app/lib/book-data.js`

Local data access helpers for:

- `app/data/book-info.json`
- `app/data/chapter-summaries.json`

It also normalizes book info objects and exposes chapter summary attribution.

### `app/lib/iq-bible.js`

Optional server-only IQ Bible integration with cached fetch helpers for:

- `GetBookInfo`
- `GetVerseCount`

If `IQ_BIBLE_API_KEY` is missing, the Eagle pages still render, but verse-level positioning and any missing Stage 1 overview data will gracefully degrade.

## State

- Eagle index progress only:
  - key: `bt:eagle`
  - shape: `{ [bookName]: true | false }`
- This is separate from the main tour checklist login/session storage.

## Environment

Optional variables relevant to the Eagle feature:

- `IQ_BIBLE_API_KEY`
  RapidAPI key for IQ Bible enrichment.
- `IQ_BIBLE_HOST`
  Defaults to `iq-bible.p.rapidapi.com`.

Without these, the feature still works off baked project data, but with reduced enrichment.

## Known Current Limitations

- Stage 2 verse-level placement depends on IQ Bible verse counts being available.
- Unstructured reading-plan items are shown as manual / qualitative targets rather than precise verse math.
- The Eagle UI is implemented inline in route files rather than extracted into reusable components yet.
