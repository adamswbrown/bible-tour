# Mobile Memory Verses — MVP Design

**Date:** 2026-06-01
**Status:** Design validated, ready for implementation plan
**Scope:** Port the web app's memory-verse feature to the React Native mobile app, plus a mobile-only daily reminder.

## Goal

Let mobile users build a personal deck of verses to memorise and practise them with the same fade-ladder mechanic the web uses. Add one mobile-native affordance — a daily practice nudge — that doesn't fit on the web.

## Scope

**In scope (MVP):**
- Saved-verse deck (add / remove / list), persisted locally.
- Practice surface: full → initials → blanks fade ladder, tap-to-peek individual words.
- Entry point: header bookmark icon on the verse screen.
- Dedicated "Memory" bottom tab listing the deck; tap a row to practise.
- One daily reminder notification at a user-chosen time, deep-linking into a random verse.

**Explicitly out of scope (deferred):**
- Book picker (web's `/memory` browse-by-section UI). MVP only adds from the verse screen.
- ESV audio playback in practice.
- Swipe-between-verses gestures, haptics.
- Per-verse spaced-repetition cadence.
- Streaks, missed-day catch-up, cross-device sync.

## Architecture

### Data

New storage in AsyncStorage (already a project dependency via `lib/progress.ts`):

```ts
// bt:memory → { [id]: { book, verseRef, ref, added } }
// id = `${book} ${verseRef}`  e.g. "John 3:16"

// bt:memory:reminder → { enabled: boolean, hour: number, minute: number }
```

Shape and id scheme match the web (`app/lib/memory.js`) so a future sync layer can converge them. Fade-ladder regex and tokenizer are pure string logic — copied verbatim from the web module.

The web's `loadMemory()` is synchronous (`localStorage`); the mobile port makes all storage functions `async`. Components hold the deck in `useState`, hydrate once in `useEffect` / `useFocusEffect`, and update local state from the return value of mutations (`addVerse`, `toggleVerse`).

### Files

| File | Status | Purpose |
|---|---|---|
| `mobile/lib/memory.ts` | new (~90 LoC) | Storage, fade ladder, tokenizer. Port of `app/lib/memory.js`. |
| `mobile/lib/notifications.ts` | extend | `scheduleMemoryReminder`, `cancelMemoryReminder`. |
| `mobile/app/(tabs)/memory.tsx` | new | Deck list. FlatList, oldest-first, swipe-to-delete. |
| `mobile/app/practice.tsx` | new | Fade-ladder practice surface (modal-style). |
| `mobile/app/verse.tsx` | edit | Header bookmark icon toggling save state. |
| `mobile/app/(tabs)/_layout.tsx` | edit | Register Memory tab between index and settings. |
| `mobile/app/(tabs)/settings.tsx` | edit | Reminder toggle + time picker (hidden when deck empty). |

No new npm dependencies. `@react-native-async-storage/async-storage`, `expo-notifications`, `@expo/vector-icons`, and `react-native-gesture-handler` are already installed.

## Data flow

**Saving a verse.** Verse screen tap → `toggleVerse(book, verseRef)` → read AsyncStorage, mutate, write, return new map → local `saved` state flips → icon swaps `bookmark-outline` ↔ `bookmark`.

**Memory tab freshness.** Use `useFocusEffect` from `expo-router` to refetch the deck each time the tab gains focus. Cheap, avoids an event bus, handles the cross-tab save case.

**Practice.** Tap a row → `router.push('/practice?ref=John%203:16')` → screen fetches ESV text via existing `/api/verse-esv` route (same one used by `verse.tsx`). Mode and peeked state reset on verse change. Prev/next mutate the route param; the same effect re-fires.

**Reminder fire.** Notification body is generic ("Memory time — open Bible Tour to practise a verse"). Tap opens `/(tabs)/memory?autoplay=1`. Memory tab on mount checks the param, picks a random verse from the deck, immediately pushes to `/practice?ref=…`. Empty deck → user lands on the empty Memory tab.

This deliberately avoids baking a specific verse into the scheduled notification. iOS won't run JS at fire time, so the alternative (reschedule with a baked verse on every app open) is fragile.

## UI details

### Verse screen — header icon
- Right-header `Pressable` with Ionicons `bookmark-outline` (unsaved) / `bookmark` (saved).
- Reads `isSaved()` on mount; toggles state on tap.

### Memory tab
- Header: "Memory" title + verse count.
- `FlatList` of saved verses sorted by `added` ascending.
- Each row: reference (e.g. "John 3:16"), added-date in muted small text.
- Swipe-to-delete via `Swipeable` from `react-native-gesture-handler`.
- Empty state: "Save verses from the reader to start your deck."

### Practice screen
- Top bar: verse reference + close (×).
- Segmented pill control: Full / Initials / Blanks (three `Pressable`s, no extra library).
- Body: tokenised verse, each word a `Pressable`. Tap peeks just that word (rendered as `fadeWord(word, 'full')`) until verse changes.
- Bottom: prev / next chevrons, disabled at deck ends.
- Loading / error states match the existing `verse.tsx` patterns.

### Settings — reminder section
- Hidden when deck is empty.
- Toggle: "Daily memory reminder" (off by default).
- Native `DateTimePicker` (time mode), default 08:00.
- Inline help: "We'll pick one verse from your deck each day."

## Error handling

- **AsyncStorage failures.** `try/catch` around reads (return `{}`) and writes (silent). Matches web behaviour. No user-visible error — silent degradation is correct here.
- **ESV fetch failure.** "Couldn't load verse — check your connection" + retry button. Same shape as `verse.tsx`.
- **Stale practice route param** (verse deleted between save and tap). Redirect back to the Memory tab.
- **Notification permission denied.** Toggle stays off; settings shows: "Enable notifications in iOS Settings to use reminders."
- **Reminder fires with empty deck.** Tap lands on empty Memory tab. Acceptable; no background watcher to keep the schedule in sync with the deck.

## Testing

`mobile/` has no test infra today. The fade-ladder and tokenizer are already covered by the web's logic (identical code); the storage layer mirrors `lib/progress.ts` which is also untested. **MVP ships without new automated tests.**

Manual smoke checklist:
1. Save a verse from the reader; icon flips filled.
2. Re-open the reader on the same verse; icon stays filled.
3. Memory tab shows the verse with correct ref + date.
4. Tap row → practice screen → step Full / Initials / Blanks.
5. Tap a single word in Initials mode → that word reveals; others remain.
6. Prev/next walks the deck and resets mode + peeks.
7. Swipe-to-delete on the Memory tab removes the verse.
8. Settings → enable reminder, set time 1 minute ahead, lock the phone, wait, tap the notification → land directly in practice on a random saved verse.

## Open questions

None blocking. Two future calls when the time comes:
- If users ask for "test myself again in a few days", that's the prompt to consider per-verse spaced cadence (Section 4 option b from brainstorming).
- A book picker becomes worth building once people start saving 20+ verses and the verse-screen entry point feels insufficient.

## Decisions log

| # | Decision | Why |
|---|---|---|
| 1 | MVP scope = deck + fade ladder only | Validate feel on phone before porting the full 631-line web UI |
| 2 | Header bookmark icon on verse screen | Native idiom, one tap, doesn't eat reading space |
| 3 | Dedicated Memory tab (not Settings row) | Web treats `/memory` as first-class; need to reach the deck without a verse open |
| 4 | Mirror web's three-mode fade ladder + tap-to-peek | Validated UX; swipe gestures are polish, not v1 |
| 5 | One daily reminder, not spaced repetition | Matches `lib/memory.js`'s "no review schedule, no due dates" philosophy; SR is a different product |
| 6 | Generic reminder copy + verse chosen at app open | iOS can't run JS at fire time; baking a verse in is fragile |
