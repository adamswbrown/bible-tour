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

- Shows three framing questions tuned to the book's genre (law, narrative, wisdom, psalm, prophecy, apocalyptic, gospel, acts, epistle).
- The genre classification and the per-genre questions live in `app/lib/genre.js` (kept in code, not in `book-info.json`).
- A small genre pill near the stage heading surfaces the active genre to the reader.
- Pulls book overview data from `app/data/book-info.json`.
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
  - verse-level position derived from the static canon table
- Verse counts come from `app/data/canon.json` via `app/lib/canon.js`.

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

### `app/lib/canon.js`

Pure data accessors over `app/data/canon.json`, the static 66-book canon
table (Protestant / KJV chapter and verse counts).

- `getCanonEntry(book)` — full record `{ id, chapterCount, verseCounts }`
- `getCanonVerseCount(book, chapter)`
- `getCanonChapterCount(book)`

No network, no API keys, no `server-only` boundary.

## State

- Eagle index progress only:
  - key: `bt:eagle`
  - shape: `{ [bookName]: true | false }`
- This is separate from the main tour checklist login/session storage.

## Environment

The Eagle feature has no required or optional environment variables. All
data is baked into the repo (`app/data/book-info.json`,
`app/data/chapter-summaries.json`, and `app/data/canon.json`).

## Known Current Limitations

- Unstructured reading-plan items are shown as manual / qualitative targets rather than precise verse math.
- The Eagle UI is implemented inline in route files rather than extracted into reusable components yet.
