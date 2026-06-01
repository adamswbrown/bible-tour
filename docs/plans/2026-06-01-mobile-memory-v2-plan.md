# Mobile Memory Verses v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `Deck` / `Library` segmented control to the Memory tab (Library = tap-to-toggle catalogue of curated refs from the existing reading plan), and rewrite the practice screen as iOS-native tap-to-recall with horizontal swipe between verses.

**Architecture:** New `lib/library.ts` derives a flat list of `(section, book, verseRef)` from the existing `BOOKS` array by porting `parsePlanRefs` from the web. Memory tab lifts `MemoryMap` state, renders two segments. Practice screen rewritten end-to-end: `FlatList horizontal pagingEnabled` for swipe between verses, each card a tokenised tap-to-recall surface with `revealed`/`gotIt` sets.

**Tech Stack:** Expo Router, React Native, AsyncStorage, existing `react-native-gesture-handler`. No new deps. `expo-haptics` is NOT installed — design decision says skip haptics rather than add a dep.

**Reference:** Design at `docs/plans/2026-06-01-mobile-memory-v2-design.md`. Reading-plan parsing source at `app/lib/bible.js:122-193`.

---

### Task 1: Port `parsePlanRefs` + build the library list

**Files:**
- Create: `mobile/lib/library.ts`

**Step 1: Port `splitPlanRefs` and `parsePlanRef`**

Both are pure string logic. Same regexes as the web (`app/lib/bible.js:122-193`). Mobile gets TypeScript types.

```ts
// mobile/lib/library.ts
import { BOOKS } from './readingPlan';

export type ParsedRef = {
  text: string;
  kind: 'verse' | 'range' | 'cross-chapter-range' | 'chapter-span' | 'text';
  isStructured: boolean;
};

function splitPlanRefs(refs: string): string[] {
  return refs
    .split(/\s+and\s+|,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parsePlanRef(text: string): ParsedRef {
  const value = text.trim();

  if (/chapters?\s+\d+-\d+/i.test(value)) {
    return { text: value, kind: 'chapter-span', isStructured: true };
  }
  if (/^\d+:\d+-\d+:\d+$/.test(value)) {
    return { text: value, kind: 'cross-chapter-range', isStructured: true };
  }
  if (/^\d+:\d+-\d+$/.test(value)) {
    return { text: value, kind: 'range', isStructured: true };
  }
  if (/^\d+:\d+$/.test(value)) {
    return { text: value, kind: 'verse', isStructured: true };
  }
  return { text: value, kind: 'text', isStructured: false };
}

export function parsePlanRefs(refs: string): ParsedRef[] {
  return splitPlanRefs(refs).map(parsePlanRef);
}
```

**Step 2: Build the flat `LIBRARY_REFS` catalogue**

Filter to addressable refs only (drop `chapter-span` like the web's PICKER does, and drop the fuzzy `text` kind like "any five random proverbs from chapters 10-29").

```ts
export type LibraryRef = {
  section: string; // 'Old Testament' | 'New Testament'
  book: string;
  verseRef: string; // e.g. "3:16" or "20:1-17"
};

export const LIBRARY_REFS: LibraryRef[] = (() => {
  const out: LibraryRef[] = [];
  for (const entry of BOOKS) {
    for (const p of parsePlanRefs(entry.refs)) {
      if (p.isStructured && p.kind !== 'chapter-span') {
        out.push({ section: entry.testament, book: entry.book, verseRef: p.text });
      }
    }
  }
  return out;
})();
```

**Step 3: Build the `SectionList`-shaped grouped structure**

```ts
export type LibrarySection = {
  title: string; // section name
  data: { book: string; refs: string[] }[];
};

export function librarySections(): LibrarySection[] {
  const bySection = new Map<string, Map<string, string[]>>();
  for (const r of LIBRARY_REFS) {
    if (!bySection.has(r.section)) bySection.set(r.section, new Map());
    const byBook = bySection.get(r.section)!;
    if (!byBook.has(r.book)) byBook.set(r.book, []);
    byBook.get(r.book)!.push(r.verseRef);
  }
  return Array.from(bySection.entries()).map(([title, byBook]) => ({
    title,
    data: Array.from(byBook.entries()).map(([book, refs]) => ({ book, refs })),
  }));
}

export const LIBRARY_TOTAL = LIBRARY_REFS.length;
```

**Step 4: Verify**

```bash
cd mobile && npx tsc --noEmit
```
Expected: no new errors. The pre-existing `notifications.ts:5` warning is the only allowed noise.

**Step 5: Commit**

```bash
git add mobile/lib/library.ts
git commit -m "feat(mobile): port parsePlanRefs and build LIBRARY_REFS catalogue"
```

---

### Task 2: Lift map state to Memory tab + add segmented control

**Files:**
- Modify: `mobile/app/(tabs)/memory.tsx`

**Step 1: Refactor — promote `map: MemoryMap` to component state**

Today the Memory tab tracks `entries: MemoryEntry[]`. Lift it to the raw `map` so the Library segment can query `isSaved(map, …)` per row without an extra read. `memoryList(map)` derives entries inline.

Top of the component:

```tsx
type Segment = 'deck' | 'library';

export default function MemoryTab() {
  const [segment, setSegment] = useState<Segment>('deck');
  const [map, setMap] = useState<MemoryMap>({});
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string }>();
  const entries = useMemo(() => memoryList(map), [map]);
  // … useFocusEffect now sets map, derives entries via useMemo
}
```

Replace `loadMemory().then((map) => { setEntries(memoryList(map)); … })` with `loadMemory().then(setMap)`. The autoplay branch already uses the loaded `map` directly; no change there.

Refactor delete + toggle helpers to update local `map`:

```tsx
const onDelete = async (entry: MemoryEntry) => {
  const next = await removeVerse(entry.book, entry.verseRef);
  setMap(next);
};
const onToggleLibrary = async (book: string, verseRef: string) => {
  const next = await toggleVerse(book, verseRef);
  setMap(next);
};
```

**Step 2: Add the segmented control above whichever panel renders**

```tsx
return (
  <View style={styles.container}>
    <View style={styles.segmentRow}>
      <SegmentButton label="Deck" active={segment === 'deck'} onPress={() => setSegment('deck')} />
      <SegmentButton label="Library" active={segment === 'library'} onPress={() => setSegment('library')} />
    </View>
    {segment === 'deck' ? (
      <DeckPanel entries={entries} onOpen={onOpen} onDelete={onDelete} />
    ) : (
      <LibraryPanel map={map} onToggle={onToggleLibrary} />
    )}
  </View>
);
```

`SegmentButton` is a local component (12 lines): styled `Pressable` with active/inactive states.

**Step 3: Extract `DeckPanel` as a local sub-component**

Move the existing FlatList + empty state into `function DeckPanel({ entries, onOpen, onDelete })`. Same JSX, props-driven.

**Step 4: Stub `LibraryPanel`**

Empty stub for now — actual `SectionList` lands in Task 3 to keep commits surgical.

```tsx
function LibraryPanel(_props: { map: MemoryMap; onToggle: (b: string, r: string) => void }) {
  return (
    <View style={[styles.empty]}><Text style={styles.emptyText}>Library coming up.</Text></View>
  );
}
```

**Step 5: Typecheck + commit**

```bash
cd mobile && npx tsc --noEmit
```
Expected: clean.

```bash
git add mobile/app/\(tabs\)/memory.tsx
git commit -m "refactor(mobile): segmented Memory tab, lift MemoryMap state"
```

---

### Task 3: Implement `LibraryPanel` — SectionList with toggle

**Files:**
- Modify: `mobile/app/(tabs)/memory.tsx`

**Step 1: Implement the SectionList**

```tsx
import { SectionList } from 'react-native';
import { librarySections, LIBRARY_TOTAL } from '../../lib/library';
import { isSaved } from '../../lib/memory';

function LibraryPanel({ map, onToggle }: { map: MemoryMap; onToggle: (b: string, r: string) => void }) {
  const sections = useMemo(() => librarySections(), []);
  const savedCount = memoryCount(map);

  return (
    <SectionList
      sections={sections.map((s) => ({
        title: s.title,
        data: s.data.flatMap((book) =>
          book.refs.map((ref) => ({ book: book.book, ref })),
        ),
      }))}
      keyExtractor={(item) => `${item.book} ${item.ref}`}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{section.title.toUpperCase()}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const prev = index > 0 ? (section.data as { book: string; ref: string }[])[index - 1] : null;
        const showBookHeader = !prev || prev.book !== item.book;
        const saved = isSaved(map, item.book, item.ref);
        return (
          <>
            {showBookHeader && <Text style={styles.bookHeader}>{item.book}</Text>}
            <Pressable onPress={() => onToggle(item.book, item.ref)} style={styles.libraryRow}>
              <Text style={styles.libraryRef}>{item.ref}</Text>
              <Text style={[styles.starGlyph, saved && styles.starGlyphSaved]}>
                {saved ? '★' : '☆'}
              </Text>
            </Pressable>
          </>
        );
      }}
      stickySectionHeadersEnabled
      ListFooterComponent={
        <Text style={styles.libraryFooter}>
          Saved {savedCount} of {LIBRARY_TOTAL}
        </Text>
      }
    />
  );
}
```

**Step 2: Styles**

Append to the `StyleSheet`:

```ts
segmentRow: {
  flexDirection: 'row',
  gap: 6,
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 12,
  backgroundColor: C.tealDark,
},
segmentBtn: {
  paddingHorizontal: 16, paddingVertical: 8,
  borderRadius: 16,
  backgroundColor: C.surface,
  borderWidth: 1, borderColor: C.border,
},
segmentBtnActive: { backgroundColor: C.yellow, borderColor: C.yellow },
segmentText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
segmentTextActive: { color: C.tealDark },
sectionHeader: {
  paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  backgroundColor: C.tealDark,
},
sectionHeaderText: {
  fontSize: 11, fontWeight: '700', color: C.textSecondary,
  letterSpacing: 1.2,
},
bookHeader: {
  fontSize: 15, fontWeight: '600', color: C.yellow,
  paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6,
  backgroundColor: C.teal,
},
libraryRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 32, paddingVertical: 12,
  backgroundColor: C.teal,
},
libraryRef: { fontSize: 15, color: C.offWhite },
starGlyph: { fontSize: 18, color: C.textSecondary },
starGlyphSaved: { color: C.yellow },
libraryFooter: {
  fontSize: 12, color: C.textSecondary,
  textAlign: 'center', padding: 24,
},
```

**Step 3: Typecheck**

Run `cd mobile && npx tsc --noEmit`. Expected: clean.

**Step 4: Smoke test**

Reload dev client. Memory tab → tap **Library** segment → see sections, books, refs. Tap a row → star fills. Switch to Deck → row appears there. Switch back to Library → star still filled.

**Step 5: Commit**

```bash
git add mobile/app/\(tabs\)/memory.tsx
git commit -m "feat(mobile): Library segment — SectionList over reading plan"
```

---

### Task 4: Practice rewrite — tap-to-recall surface, single verse

**Files:**
- Modify: `mobile/app/practice.tsx`

This is the biggest task. Two sub-steps: rebuild the single-card surface (Task 4), then add swipe-between-verses (Task 5).

**Step 1: Replace three-pill control with two-pill difficulty toggle**

Remove `mode: 'full' | 'initials' | 'blanks'` state and the Full pill. New state:

```tsx
type Difficulty = 'initials' | 'blanks';
const [difficulty, setDifficulty] = useState<Difficulty>('initials');
const [revealed, setRevealed] = useState<Set<number>>(new Set());
const [gotIt, setGotIt] = useState<Set<number>>(new Set());
```

Pills become two-state (`Initials` / `Blanks`). Active pill picks up a `✓` if `gotIt.size === totalTokens` (computed below).

**Step 2: Per-word render with three visual states**

```tsx
const totalTokens = useMemo(
  () => (text ? tokenizeVerse(text).reduce((n, line) => n + line.length, 0) : 0),
  [text],
);
const complete = totalTokens > 0 && gotIt.size === totalTokens;

const toggleRevealed = (i: number) => {
  if (gotIt.has(i)) return; // got-it words are inert on tap
  setRevealed((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });
};
const toggleGotIt = (i: number) => {
  setGotIt((prev) => {
    const next = new Set(prev);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
      // long-press also clears the "revealed" peek for this word
      setRevealed((rprev) => {
        const r = new Set(rprev);
        r.delete(i);
        return r;
      });
    }
    return next;
  });
};
```

Render each token:

```tsx
{text && tokenizeVerse(text).map((line, li) => (
  <Text key={li} style={styles.line}>
    {line.map((tok, i) => {
      const isGotIt = gotIt.has(tok.index);
      const isRevealed = revealed.has(tok.index);
      const rendered = isGotIt || isRevealed ? tok.word : fadeWord(tok.word, difficulty);
      const wordStyle = isGotIt ? styles.gotIt : isRevealed ? styles.peeked : undefined;
      return (
        <Text
          key={tok.index}
          onPress={() => toggleRevealed(tok.index)}
          onLongPress={() => toggleGotIt(tok.index)}
          style={wordStyle}
        >
          {i > 0 ? ' ' : ''}
          {rendered}
        </Text>
      );
    })}
  </Text>
))}
```

**Step 3: Difficulty change resets reveals (not got-it)**

```tsx
const onDifficultyChange = (d: Difficulty) => {
  setDifficulty(d);
  setRevealed(new Set());
};
```

`gotIt` persists across difficulty changes — that's "I know this one" regardless of hint level. `revealed` is hint-level-specific.

**Step 4: Drop prev/next buttons and the bottom "Done" button**

Remove the entire `navRow` block and the bottom `closeBtn` Pressable. iOS back-swipe handles dismiss; swipe between verses lands in Task 5.

Stack.Screen header keeps the title; we get the standard back button for free.

**Step 5: Typecheck + smoke test**

```bash
cd mobile && npx tsc --noEmit
```

Smoke:
- Memory tab → Deck → tap saved verse → practice opens.
- Verse renders in Initials mode by default.
- Tap a word → it reveals (gold).
- Tap it again → re-hides.
- Long-press a word → muted "got it" style; further taps do nothing.
- Long-press the got-it word again → returns to hidden.
- Switch to Blanks pill → hidden words become underscores; revealed peeks reset; got-it words stay muted.
- Long-press every word → tiny `✓` appears on the active difficulty pill.

**Step 6: Commit**

```bash
git add mobile/app/practice.tsx
git commit -m "feat(mobile): practice rewrite — tap-to-recall with got-it state"
```

---

### Task 5: Swipe between verses + page-indicator dots

**Files:**
- Modify: `mobile/app/practice.tsx`

**Step 1: Refactor practice to render the deck as a horizontal FlatList**

Wrap the single-verse render in an inner component `<VerseCard entry={…} />`, and render a `FlatList horizontal pagingEnabled`:

```tsx
const flatRef = useRef<FlatList<MemoryEntry>>(null);
const [currentIndex, setCurrentIndex] = useState<number>(0);
const [deck, setDeck] = useState<MemoryEntry[]>([]);

useEffect(() => {
  loadMemory().then((m) => {
    const list = memoryList(m);
    setDeck(list);
    // initial scroll to the verse the user opened
    const startIndex = list.findIndex((e) => e.book === book && e.verseRef === refParam);
    if (startIndex >= 0) {
      setCurrentIndex(startIndex);
      // wait a frame for layout
      requestAnimationFrame(() => flatRef.current?.scrollToIndex({ index: startIndex, animated: false }));
    }
  });
}, [book, refParam]);

// Window width = page width
const { width } = useWindowDimensions();

return (
  <>
    <Stack.Screen options={{ title: deck[currentIndex] ? `${deck[currentIndex].book} ${deck[currentIndex].verseRef}` : 'Practice' }} />
    <View style={styles.container}>
      <PageDots count={deck.length} current={currentIndex} />
      <FlatList
        ref={flatRef}
        data={deck}
        keyExtractor={(e) => e.ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => <VerseCard entry={item} width={width} />}
      />
    </View>
  </>
);
```

`<VerseCard>` owns its own difficulty/revealed/gotIt state (so each card is independent and state resets when the FlatList recycles offscreen cards) and fetches its own verse text in a `useEffect` keyed on `entry.book + entry.verseRef`.

**Step 2: `PageDots` component**

```tsx
function PageDots({ count, current }: { count: number; current: number }) {
  if (count <= 1) return null;
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}
```

Styles:

```ts
dotsRow: { flexDirection: 'row', gap: 6, alignSelf: 'center', paddingTop: 12, paddingBottom: 4 },
dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
dotActive: { backgroundColor: C.yellow },
```

**Step 3: Update title on swipe**

`Stack.Screen options` is declarative — re-render when `currentIndex` changes (since `deck[currentIndex]` is in the title string, the title updates naturally).

**Step 4: Smoke test**

- Save 3+ verses.
- Open practice on the second.
- Initial render lands on verse 2; second dot is gold.
- Swipe right → verse 3 loads, dot moves.
- Swipe left twice → verse 1.
- Each card has independent difficulty/reveal/got-it state.
- iOS back-swipe (from the left edge) or the navigation back button dismisses the screen.

**Step 5: Typecheck + commit**

```bash
cd mobile && npx tsc --noEmit
git add mobile/app/practice.tsx
git commit -m "feat(mobile): swipe between verses in practice + page-indicator dots"
```

---

### Task 6: Final smoke pass

**Step 1: Manual smoke**

Run the full design-doc checklist (Section 3 of the design):

1. Memory tab — Deck segment shows saved verses; swipe-to-delete works.
2. Memory tab — Library segment shows OT / NT sections with book headers; all refs visible.
3. Tap a Library row → star fills; switch to Deck → verse is there.
4. Open a verse in practice → starts in Initials; word taps reveal; long-press marks got-it.
5. Switch Initials → Blanks pill → hidden words become underscores; got-it words stay muted.
6. Long-press every word → ✓ appears on active difficulty pill.
7. Swipe horizontally → next verse loads; dots track position.
8. iOS edge-swipe back → returns to Memory tab; state resets next entry.
9. Daily reminder still works (regression check).

**Step 2: Typecheck**

```bash
cd mobile && npx tsc --noEmit
```
Expected: only pre-existing `notifications.ts:5` warning.

**Step 3: Decide if final no-op commit needed**

```bash
git status
# If clean, no commit.
```

---

## Out of scope (do not implement)

- Persisting got-it state.
- Spaced-repetition cadence.
- Haptics (would require adding `expo-haptics`).
- Audio-driven practice, Share Sheet, Shortcuts, widgets.
- Per-section progress percentages.

## Reference

- Design: `docs/plans/2026-06-01-mobile-memory-v2-design.md`
- Web source for parsing: `app/lib/bible.js:122-193`
- Web source for the PICKER logic: `app/memory/page.js:39-47`
