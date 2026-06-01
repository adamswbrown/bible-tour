# Mobile Memory Verses v2 — iOS-Native Picker + Tap-to-Recall

**Date:** 2026-06-01
**Status:** Design validated, ready for implementation plan
**Builds on:** `docs/plans/2026-06-01-mobile-memory-verses-design.md` (v1 — shipped)
**Branch:** `memory-verses-mobile` (PR #36)

## Goal

Two upgrades to the mobile memory feature, motivated by on-device testing of v1:

1. **Adding verses needs to live on the Memory tab itself**, not only behind the reader's `☆` icon. The discoverability problem is real: most users won't realise they can save while reading.
2. **The practice surface needs to be iOS-native** — not the three-pill segmented control ported from the web. Memory work on a phone is one-handed, in-line moments; the screen should reward recall, not reading.

## Scope

**In scope (v2):**

- `Deck` / `Library` segmented control on the Memory tab.
- `Library` segment: `SectionList` over `READING_PLAN`, tap-to-toggle save state. Curated list reused — no external "Romans Road" deck — because the app already encodes a curated reading plan.
- Practice rewrite: tap-to-recall mechanic. Two starting difficulties (`Initials`, `Blanks`) replace three pills. Long-press marks a word "got it." No "Full" mode.
- Horizontal swipe between verses, page-indicator dots, ephemeral got-it state.
- Haptics on reveal, long-press, swipe (if `expo-haptics` already present).

**Explicitly out of scope:**

- Spaced-repetition cadence (got-it state stays ephemeral — by design).
- Persisting per-verse progress.
- Audio-driven recall, Share Sheet add, Shortcuts, widgets.
- Per-section progress percentages, badges, streaks.

## Architecture

### Memory tab — two segments, one shared state

Lift `entries: MemoryEntry[]` from the current single FlatList into the `MemoryTab` component. Pass it to `<DeckPanel/>` (today's list) and `<LibraryPanel/>` (new). `LibraryPanel` calls `isSaved(map, book, verseRef)` per row; on tap it calls `toggleVerse(...)` and updates the lifted state so the Deck segment is correct on next view.

```tsx
type Segment = 'deck' | 'library';

function MemoryTab() {
  const [segment, setSegment] = useState<Segment>('deck');
  const [map, setMap] = useState<MemoryMap>({});
  // … useFocusEffect hydrates map; tap actions return new map.
}
```

`useFocusEffect` reloads the map on tab focus (existing behaviour). Within the tab, the map is the source of truth; toggling refreshes it without re-reading AsyncStorage.

### Library data source

New file: `mobile/lib/library.ts`.

```ts
import { READING_PLAN, parsePlanRefs } from './readingPlan';

export type LibraryRef = { section: string; book: string; verseRef: string };

export const LIBRARY_REFS: LibraryRef[] = (() => {
  const out: LibraryRef[] = [];
  for (const [section, readings] of Object.entries(READING_PLAN)) {
    for (const { book, refs } of readings) {
      for (const p of parsePlanRefs(refs)) {
        if (p.isStructured && p.kind !== 'chapter-span') {
          out.push({ section, book, verseRef: p.text });
        }
      }
    }
  }
  return out;
})();

export type LibrarySection = {
  title: string; // section name
  data: { book: string; refs: string[] }[];
};

export function librarySections(): LibrarySection[] { /* group LIBRARY_REFS */ }
```

Two unknowns to verify in implementation:

1. **`parsePlanRefs` location.** Web exports it from `app/lib/bible.js`. Mobile's `mobile/lib/readingPlan.ts` may have its own version (the BOOKS object uses a different `refs` format already). If parsePlanRefs is missing, port it — ~30 LoC, pure string logic.
2. **`READING_PLAN` shape on mobile.** Verify it matches the web's `{ section: [{ book, refs }, …] }` shape. If it's restructured, adapt the IIFE.

### Practice — tap-to-recall

Replace the current Full/Initials/Blanks segmented control with a two-state difficulty toggle (`Initials` / `Blanks`). Each word goes through three visual states driven by *two* sets in component state:

- `revealed: Set<number>` — word indices the user has tapped to peek.
- `gotIt: Set<number>` — word indices the user has long-pressed to mark recalled.

Render logic per word:

```tsx
const isGotIt = gotIt.has(tok.index);
const isRevealed = revealed.has(tok.index);

if (isGotIt) {
  // Full word, muted style.
  return <Word style={styles.gotIt}>{tok.word}</Word>;
}
if (isRevealed) {
  // Full word, gold tint — "peeked."
  return <Word style={styles.peeked}>{tok.word}</Word>;
}
// Hidden — render fadeWord(tok.word, difficulty).
return <Word>{fadeWord(tok.word, difficulty)}</Word>;
```

Each word is a `Pressable` with `onPress` toggling `revealed`, `onLongPress` toggling `gotIt`. A word in `gotIt` exits via long-press only — tapping it does nothing, so it doesn't accidentally re-hide.

Completion is implicit: if `gotIt.size === totalTokens`, the difficulty pill picks up a tiny `✓`. No banner, no haptic, no toast.

### Practice — swipe between verses

Horizontal swipe via `react-native-gesture-handler` + `react-native-reanimated` (both already deps; reanimated is transitively pulled in by gesture-handler/expo-router). Implementation choice between two approaches:

- **`PagerView`-style with manual state** — track currentIndex, animate translateX between snaps. More code, full control.
- **Use a third-party `react-native-pager-view`** — declarative paging. Pulls in another dep — avoid.
- **`FlatList horizontal` with `pagingEnabled`** — already in RN core. Each "page" is a verse practice card. Snapping is automatic. **Pick this.**

Page-indicator dots: tiny static row at the top, computed from `deck.length` and `currentIndex`. Touch-disabled — gestural only.

iOS back-swipe from left edge dismisses the screen (free with `Stack.Screen presentation="modal"`).

### Got-it state lifecycle

- Resets to empty `Set` on verse change (new card in the FlatList).
- Not persisted. Not stored. Not surfaced anywhere outside the current screen.

This is the **most contested call** in v2 — users *might* expect "I knew this verse cold yesterday, the app should remember." The answer in v1 was "memory is calm, no schedule"; v2 holds the same line. If user feedback reverses this, v3 is the spaced-repetition conversation, not a band-aid persistence patch on top of v2.

### Haptics

```ts
import * as Haptics from 'expo-haptics';

// tap to reveal
Haptics.selectionAsync();

// long-press to mark got-it
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// swipe to next verse
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

If `expo-haptics` is not installed, the entire haptics layer is omitted for v2. **Do not install a new dep just for haptics.** Cool but non-essential.

## UI mocks (ASCII)

### Memory tab — Library segment

```
┌─────────────────────────────────┐
│            Memory               │
│   ┌─Deck─┬───Library───┐        │ ← segmented
│                                 │
│  OLD TESTAMENT FOUNDATION       │ ← sticky section
│                                 │
│  Genesis                        │ ← sticky book
│    1:1-3                  ★     │ ← saved
│    3:14-15                ☆     │
│    12:1-3                 ☆     │
│                                 │
│  Exodus                         │
│    3:13-15                ☆     │
│    20:1-17                ★     │
│ …                               │
│                                 │
│  Saved: 12 of 187               │ ← footer
└─────────────────────────────────┘
```

### Practice — tap-to-recall (Initials difficulty)

```
┌─────────────────────────────────┐
│     ● ○ ○ ○ ○                   │ ← page dots, position 1/5
│                                 │
│   ┌─Initials ✓─┬─Blanks─┐       │ ← difficulty + completion ✓
│                                 │
│   F  G  s  l   t  w   t   h     │
│   g  h  o  a  o   S    ,  t     │
│   h  w  b  l  i   H    S    ,   │
│       loved                     │ ← peeked word, gold
│   t  e  h   l   l   n            │
│                                 │
│   Long-press a word once you    │ ← single-line hint, fades
│   know it.                      │   after first long-press
└─────────────────────────────────┘
```

(Right-swipe carries you to verse 2 of 5.)

## Error handling

- ESV fetch failure: same "Could not load verse — check your connection" as v1.
- `READING_PLAN` malformed entry: `parsePlanRefs` already filters non-structured refs; LIBRARY_REFS pipeline silently skips. No user-visible failure mode.
- Tap a Library row while the verse is being fetched in the practice screen elsewhere: independent state, no interaction.

## Decisions log (additive to v1)

| # | Decision | Why |
|---|---|---|
| v2-1 | Segmented Deck / Library on Memory tab | Same screen, same mental model; users see the catalogue without a modal context switch |
| v2-2 | Library rows never disappear after save | Saved state is a glyph, not a state of presence — avoids the "did I imagine adding this?" confusion |
| v2-3 | Use existing READING_PLAN, no curated external decks | App already curates ~200 verses across the 66-book tour; that's the right corpus |
| v2-4 | Drop "Full" mode from practice | Read-it-and-soak-it-in is reading, not practice; keeping it encourages the wrong behaviour |
| v2-5 | Long-press = "got it" | Active recall first; visual gold reveal is "I peeked, give it to me" |
| v2-6 | Got-it state is ephemeral, never persisted | Holds the v1 line: no schedule, no due dates, no tracker. If users reject this, v3 is SR, not patched persistence |
| v2-7 | Horizontal swipe between verses, no prev/next buttons | iOS-native; page-dots show position without taking a control bar |
| v2-8 | Haptics only if `expo-haptics` already installed | No new deps for non-essential polish |

## Open questions

- **READING_PLAN drift between web and mobile.** Verify in implementation. Worst case: port `parsePlanRefs` (~30 LoC).
- **Deck rehydration on segment switch.** Lifting state to MemoryTab solves it cleanly. Implementation plan must specify the lift, not bolt it onto each panel.
