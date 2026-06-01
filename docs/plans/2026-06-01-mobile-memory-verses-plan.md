# Mobile Memory Verses Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the memory-verse MVP on the React Native mobile app — saved deck, fade-ladder practice, save-from-verse-screen, dedicated Memory tab, daily reminder notification.

**Architecture:** Port `app/lib/memory.js` to `mobile/lib/memory.ts` (AsyncStorage instead of localStorage, async API). New `Memory` tab plus a `practice` screen. Header bookmark icon on the verse screen toggles save state. Daily reminder is one repeating Expo notification with generic copy; the verse is chosen on app open from the deck.

**Tech Stack:** Expo Router, React Native, `@react-native-async-storage/async-storage`, `expo-notifications`, `@expo/vector-icons`, `react-native-gesture-handler`. No new dependencies.

**Reference:** Design at `docs/plans/2026-06-01-mobile-memory-verses-design.md`. Web source of truth at `app/lib/memory.js` and `app/memory/page.js`.

**Mobile test infra:** None present. Tasks include a smoke-checklist verification at the end rather than automated tests (matches the rest of `mobile/`).

---

### Task 1: Port the memory library

**Files:**
- Create: `mobile/lib/memory.ts`
- Reference (do not modify): `app/lib/memory.js`

**Step 1: Read the web source of truth**

Read `app/lib/memory.js` in full. Note the storage key (`bt:memory`), the entry shape (`{ book, verseRef, ref, added }`), the id scheme (`${book} ${verseRef}`), the fade-ladder regex, and the tokenizer.

**Step 2: Write `mobile/lib/memory.ts`**

```ts
// Memory — a calm, scheduler-free surface for learning verses by heart.
//
// Mirrors app/lib/memory.js on web. AsyncStorage instead of localStorage,
// so the storage API is async. Fade-ladder and tokenizer are pure and
// copied verbatim.

import AsyncStorage from "@react-native-async-storage/async-storage";

export const MEMORY_STORAGE_KEY = "bt:memory";
export const REMINDER_STORAGE_KEY = "bt:memory:reminder";

export type MemoryEntry = {
  book: string;
  verseRef: string;
  ref: string;
  added: number;
};

export type MemoryMap = Record<string, MemoryEntry>;

export type FadeMode = "full" | "initials" | "blanks";

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
};

export function memId(book: string, verseRef: string): string {
  return `${book} ${verseRef}`;
}

export async function loadMemory(): Promise<MemoryMap> {
  try {
    const raw = await AsyncStorage.getItem(MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveMemory(map: MemoryMap): Promise<void> {
  try {
    await AsyncStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // silent — matches web
  }
}

export function isSaved(map: MemoryMap, book: string, verseRef: string): boolean {
  return !!map[memId(book, verseRef)];
}

function makeEntry(book: string, verseRef: string): MemoryEntry {
  return { book, verseRef, ref: `${book} ${verseRef}`, added: Date.now() };
}

export async function addVerse(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  const id = memId(book, verseRef);
  if (!map[id]) {
    map[id] = makeEntry(book, verseRef);
    await saveMemory(map);
  }
  return map;
}

export async function removeVerse(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  delete map[memId(book, verseRef)];
  await saveMemory(map);
  return map;
}

export async function toggleVerse(book: string, verseRef: string): Promise<MemoryMap> {
  const map = await loadMemory();
  const id = memId(book, verseRef);
  if (map[id]) delete map[id];
  else map[id] = makeEntry(book, verseRef);
  await saveMemory(map);
  return map;
}

export function memoryList(map: MemoryMap): MemoryEntry[] {
  return Object.values(map).sort((a, b) => (a.added || 0) - (b.added || 0));
}

export function memoryCount(map: MemoryMap): number {
  return Object.keys(map).length;
}

// ── Fade ladder ────────────────────────────────────────────────────────────
const WORD_CORE = /^([^A-Za-z0-9]*)([A-Za-z0-9](?:.*[A-Za-z0-9])?)([^A-Za-z0-9]*)$/;

export function fadeWord(word: string, mode: FadeMode): string {
  if (mode === "full") return word;
  const m = word.match(WORD_CORE);
  if (!m) return word;
  const [, lead, core, trail] = m;
  if (mode === "initials") return lead + core[0] + trail;
  return lead + "_".repeat(Math.min(core.length, 8)) + trail;
}

export type WordToken = { word: string; index: number };

export function tokenizeVerse(text: string): WordToken[][] {
  const lines = text.split(/\n+/);
  const result: WordToken[][] = [];
  let flatIndex = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/).map((word) => ({ word, index: flatIndex++ }));
    result.push(words);
  }
  return result;
}

// ── Reminder settings ──────────────────────────────────────────────────────
export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_REMINDER };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_REMINDER, ...parsed };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

export async function saveReminder(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // silent
  }
}

export function pickRandomVerse(map: MemoryMap): MemoryEntry | null {
  const list = memoryList(map);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
```

**Step 3: Verify it typechecks**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors (or only pre-existing errors unrelated to this file).

**Step 4: Commit**

```bash
git add mobile/lib/memory.ts
git commit -m "feat(mobile): port memory-verse library from web"
```

---

### Task 2: Header bookmark icon on the verse screen

**Files:**
- Modify: `mobile/app/verse.tsx`

**Step 1: Read the existing verse screen**

Read `mobile/app/verse.tsx` to learn how it reads route params (book, verseRef) and how its header is configured (Stack.Screen options vs. native header).

**Step 2: Add saved-state tracking**

Add near the other `useState` hooks:

```tsx
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isSaved, toggleVerse, loadMemory } from "../lib/memory";

// inside the component, after route params are parsed:
const [saved, setSaved] = useState(false);

useEffect(() => {
  let cancelled = false;
  loadMemory().then((map) => {
    if (!cancelled) setSaved(isSaved(map, book, verseRef));
  });
  return () => { cancelled = true; };
}, [book, verseRef]);

const onToggleSave = async () => {
  const next = await toggleVerse(book, verseRef);
  setSaved(isSaved(next, book, verseRef));
};
```

**Step 3: Render the header icon**

Add to the `Stack.Screen` options (or equivalent header config) for this screen:

```tsx
headerRight: () => (
  <Pressable
    onPress={onToggleSave}
    accessibilityLabel={saved ? "Remove from memory" : "Save to memory"}
    hitSlop={12}
    style={{ paddingHorizontal: 8 }}
  >
    <Ionicons
      name={saved ? "bookmark" : "bookmark-outline"}
      size={22}
      color="#1b3a4b"
    />
  </Pressable>
),
```

If the screen sets `headerRight` declaratively, use that pattern; otherwise use `navigation.setOptions({ headerRight: ... })` inside a `useEffect` that depends on `saved`.

**Step 4: Smoke test manually**

Run: `cd mobile && npx expo start`
- Open the app, navigate to any verse.
- Tap the bookmark icon — confirm it flips filled.
- Force-quit and reopen the app, navigate back — confirm it's still filled.
- Tap again — confirm it flips back to outline.

**Step 5: Commit**

```bash
git add mobile/app/verse.tsx
git commit -m "feat(mobile): header bookmark icon toggles memory save state"
```

---

### Task 3: Memory tab (deck list)

**Files:**
- Create: `mobile/app/(tabs)/memory.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

**Step 1: Read the existing tab layout**

Read `mobile/app/(tabs)/_layout.tsx` and `mobile/app/(tabs)/index.tsx` to learn the tab registration shape (icons, options, screen routing).

**Step 2: Create the Memory tab screen**

Create `mobile/app/(tabs)/memory.tsx`:

```tsx
import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import {
  loadMemory,
  memoryList,
  removeVerse,
  pickRandomVerse,
  MemoryEntry,
} from "../../lib/memory";

const C = {
  paper: "#fffdf7",
  ink: "#162636",
  muted: "#597083",
  line: "rgba(22, 38, 54, 0.14)",
  teal: "#1b3a4b",
  danger: "#b94a48",
};

export default function MemoryTab() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams<{ autoplay?: string }>();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadMemory().then((map) => {
        if (cancelled) return;
        const list = memoryList(map);
        setEntries(list);

        if (params.autoplay === "1") {
          const pick = pickRandomVerse(map);
          // clear the param so re-focus doesn't replay
          router.setParams({ autoplay: undefined });
          if (pick) {
            router.push({
              pathname: "/practice",
              params: { book: pick.book, verseRef: pick.verseRef },
            });
          }
        }
      });
      return () => {
        cancelled = true;
      };
    }, [params.autoplay, router])
  );

  const onOpen = (entry: MemoryEntry) => {
    router.push({
      pathname: "/practice",
      params: { book: entry.book, verseRef: entry.verseRef },
    });
  };

  const onDelete = async (entry: MemoryEntry) => {
    const next = await removeVerse(entry.book, entry.verseRef);
    setEntries(memoryList(next));
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.title}>Memory</Text>
        <Text style={styles.emptyText}>
          Save verses from the reader to start your deck.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Memory</Text>
        <Text style={styles.count}>
          {entries.length} {entries.length === 1 ? "verse" : "verses"}
        </Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.ref}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => onDelete(item)}
                style={styles.deleteAction}
                accessibilityLabel={`Delete ${item.ref}`}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
          >
            <Pressable onPress={() => onOpen(item)} style={styles.row}>
              <Text style={styles.ref}>{item.ref}</Text>
              <Text style={styles.added}>
                {new Date(item.added).toLocaleDateString()}
              </Text>
            </Pressable>
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper, paddingTop: 24 },
  empty: { alignItems: "center", justifyContent: "center", padding: 32 },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "600", color: C.ink },
  count: { fontSize: 14, color: C.muted },
  emptyText: { fontSize: 16, color: C.muted, textAlign: "center", marginTop: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.paper,
  },
  ref: { fontSize: 17, color: C.ink },
  added: { fontSize: 13, color: C.muted },
  sep: { height: 1, backgroundColor: C.line, marginHorizontal: 20 },
  deleteAction: {
    backgroundColor: C.danger,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  deleteText: { color: "#fff", fontWeight: "600" },
});
```

**Step 3: Register the tab**

Modify `mobile/app/(tabs)/_layout.tsx` — add a `<Tabs.Screen name="memory" .../>` entry between `index` and `settings`. Use Ionicons `book-outline` / `book` (focused state) and label `Memory`. Match the icon/label config style of the existing tabs.

**Step 4: Smoke test**

Run the app:
- Confirm the Memory tab appears with the correct icon and label.
- With no saved verses, see the empty state.
- Save a verse via Task 2's bookmark icon, switch to Memory tab — verse appears with today's date.
- Swipe left on the row → tap Delete → row disappears.

**Step 5: Commit**

```bash
git add mobile/app/\(tabs\)/memory.tsx mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat(mobile): Memory tab with saved-verse deck and swipe-to-delete"
```

---

### Task 4: Practice screen (fade ladder)

**Files:**
- Create: `mobile/app/practice.tsx`

**Step 1: Locate the ESV fetch helper**

Read `mobile/lib/api.ts` and `mobile/app/verse.tsx` to confirm the function name + signature used to fetch verse text from `/api/verse-esv`. The plan calls it `fetchVerseText(book, verseRef)` below — rename to whatever actually exists.

**Step 2: Create the practice screen**

Create `mobile/app/practice.tsx`:

```tsx
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  loadMemory,
  memoryList,
  fadeWord,
  tokenizeVerse,
  FadeMode,
  MemoryEntry,
} from "../lib/memory";
// ↓ replace with the actual mobile ESV fetch helper
import { fetchVerseText } from "../lib/api";

const C = {
  paper: "#fffdf7",
  ink: "#162636",
  muted: "#597083",
  line: "rgba(22, 38, 54, 0.14)",
  teal: "#1b3a4b",
  goldBg: "rgba(243,191,33,0.18)",
};

const MODES: { id: FadeMode; label: string }[] = [
  { id: "full", label: "Full" },
  { id: "initials", label: "Initials" },
  { id: "blanks", label: "Blanks" },
];

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book: string; verseRef: string }>();
  const [deck, setDeck] = useState<MemoryEntry[]>([]);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<FadeMode>("full");
  const [peeked, setPeeked] = useState<Set<number>>(new Set());

  // Load the deck once so we can do prev/next.
  useEffect(() => {
    loadMemory().then((map) => setDeck(memoryList(map)));
  }, []);

  // Fetch the current verse whenever params change.
  useEffect(() => {
    if (!params.book || !params.verseRef) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setText(null);
    setMode("full");
    setPeeked(new Set());

    fetchVerseText(params.book, params.verseRef)
      .then((data: { text?: string } | string) => {
        if (cancelled) return;
        const t = typeof data === "string" ? data : data?.text ?? null;
        if (t) setText(t);
        else setError(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.book, params.verseRef]);

  const currentIndex = deck.findIndex(
    (e) => e.book === params.book && e.verseRef === params.verseRef
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < deck.length - 1;

  const step = useCallback(
    (delta: number) => {
      const target = deck[currentIndex + delta];
      if (!target) return;
      router.setParams({ book: target.book, verseRef: target.verseRef });
    },
    [deck, currentIndex, router]
  );

  const togglePeek = (index: number) => {
    setPeeked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.ref}>
          {params.book} {params.verseRef}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close practice"
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={C.ink} />
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => {
              setMode(m.id);
              setPeeked(new Set());
            }}
            style={[styles.modePill, mode === m.id && styles.modePillActive]}
          >
            <Text
              style={[styles.modeText, mode === m.id && styles.modeTextActive]}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading && <ActivityIndicator color={C.teal} />}
        {error && (
          <Text style={styles.errorText}>
            Couldn’t load verse — check your connection.
          </Text>
        )}
        {text &&
          tokenizeVerse(text).map((line, li) => (
            <Text key={li} style={styles.line}>
              {line.map((tok, i) => {
                const shown = mode === "full" || peeked.has(tok.index);
                const rendered = shown ? tok.word : fadeWord(tok.word, mode);
                return (
                  <Text
                    key={tok.index}
                    onPress={() => togglePeek(tok.index)}
                    style={shown && mode !== "full" ? styles.peeked : undefined}
                  >
                    {i > 0 ? " " : ""}
                    {rendered}
                  </Text>
                );
              })}
            </Text>
          ))}
      </ScrollView>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => step(-1)}
          disabled={!hasPrev}
          style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
          accessibilityLabel="Previous verse"
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={hasPrev ? C.ink : C.muted}
          />
        </Pressable>
        <Text style={styles.position}>
          {currentIndex >= 0 ? `${currentIndex + 1} / ${deck.length}` : ""}
        </Text>
        <Pressable
          onPress={() => step(1)}
          disabled={!hasNext}
          style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
          accessibilityLabel="Next verse"
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={hasNext ? C.ink : C.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  ref: { fontSize: 18, fontWeight: "600", color: C.ink },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
  },
  modePillActive: { backgroundColor: C.teal, borderColor: C.teal },
  modeText: { color: C.ink, fontSize: 14 },
  modeTextActive: { color: "#fff" },
  body: { padding: 20, gap: 8 },
  line: { fontSize: 19, lineHeight: 30, color: C.ink },
  peeked: { backgroundColor: C.goldBg },
  errorText: { fontSize: 15, color: C.muted, textAlign: "center" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0.4 },
  position: { fontSize: 14, color: C.muted },
});
```

**Step 3: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: no new errors. If `fetchVerseText` doesn't exist with that signature, rename to whatever the project actually exports.

**Step 4: Smoke test**

- Save 2–3 verses (via Task 2 icon).
- Memory tab → tap first row → practice screen opens.
- Confirm verse text loads.
- Tap Initials — every word collapses to its first letter.
- Tap one word — it reveals with a gold-tinted background.
- Tap Blanks — every word becomes underscores; peeked state resets.
- Tap chevron-right — second verse loads, state resets.
- Tap chevron-back twice — first verse loads; prev chevron greys out at the end.
- Tap × — return to Memory tab.

**Step 5: Commit**

```bash
git add mobile/app/practice.tsx
git commit -m "feat(mobile): practice screen with fade-ladder and prev/next"
```

---

### Task 5: Daily reminder — notifications layer

**Files:**
- Modify: `mobile/lib/notifications.ts`

**Step 1: Read the existing notifications module**

Read `mobile/lib/notifications.ts` to learn the existing permission-request pattern and how it schedules notifications. Reuse the permission helper if one exists.

**Step 2: Add reminder functions**

Append to `mobile/lib/notifications.ts`:

```ts
import * as Notifications from "expo-notifications";

const MEMORY_REMINDER_ID = "memory-daily-reminder";

export async function scheduleMemoryReminder(hour: number, minute: number): Promise<boolean> {
  // Permissions check — reuse the existing helper if one exists.
  const perms = await Notifications.getPermissionsAsync();
  let granted = perms.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return false;

  await Notifications.cancelScheduledNotificationAsync(MEMORY_REMINDER_ID).catch(
    () => undefined
  );

  await Notifications.scheduleNotificationAsync({
    identifier: MEMORY_REMINDER_ID,
    content: {
      title: "Memory time",
      body: "Open Bible Tour to practise a verse.",
      data: { type: "memory-reminder" },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
  return true;
}

export async function cancelMemoryReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MEMORY_REMINDER_ID).catch(
    () => undefined
  );
}
```

If the existing module already imports `Notifications` from `expo-notifications`, reuse that import rather than re-importing.

**Step 3: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: no new errors.

**Step 4: Commit**

```bash
git add mobile/lib/notifications.ts
git commit -m "feat(mobile): schedule and cancel daily memory reminder"
```

---

### Task 6: Reminder settings UI + notification handler

**Files:**
- Modify: `mobile/app/(tabs)/settings.tsx`
- Modify: `mobile/app/_layout.tsx` (notification-tap handler)

**Step 1: Read existing settings screen**

Read `mobile/app/(tabs)/settings.tsx` to learn the row/section pattern (toggle styling, layout).

**Step 2: Add the reminder section**

In `settings.tsx`, add state + UI for the reminder. Hide the section when the deck is empty.

```tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { Switch, Platform, Pressable, View, Text } from "react-native";
import {
  loadReminder,
  saveReminder,
  loadMemory,
  memoryCount,
  ReminderSettings,
  DEFAULT_REMINDER,
} from "../../lib/memory";
import {
  scheduleMemoryReminder,
  cancelMemoryReminder,
} from "../../lib/notifications";

// Inside the component:
const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
const [deckCount, setDeckCount] = useState(0);
const [showPicker, setShowPicker] = useState(false);

useEffect(() => {
  loadReminder().then(setReminder);
  loadMemory().then((m) => setDeckCount(memoryCount(m)));
}, []);

const onToggle = async (next: boolean) => {
  if (next) {
    const ok = await scheduleMemoryReminder(reminder.hour, reminder.minute);
    if (!ok) {
      // permission denied — leave toggle off, show inline message via state
      return;
    }
  } else {
    await cancelMemoryReminder();
  }
  const updated = { ...reminder, enabled: next };
  setReminder(updated);
  await saveReminder(updated);
};

const onTimeChange = async (_: unknown, date?: Date) => {
  if (Platform.OS === "android") setShowPicker(false);
  if (!date) return;
  const updated = {
    ...reminder,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
  setReminder(updated);
  await saveReminder(updated);
  if (updated.enabled) {
    await scheduleMemoryReminder(updated.hour, updated.minute);
  }
};
```

Render section (only when `deckCount > 0`):

```tsx
{deckCount > 0 && (
  <View>
    <Text>Daily memory reminder</Text>
    <Switch value={reminder.enabled} onValueChange={onToggle} />
    {reminder.enabled && (
      <Pressable onPress={() => setShowPicker(true)}>
        <Text>
          {String(reminder.hour).padStart(2, "0")}:
          {String(reminder.minute).padStart(2, "0")}
        </Text>
      </Pressable>
    )}
    {showPicker && (
      <DateTimePicker
        mode="time"
        value={(() => {
          const d = new Date();
          d.setHours(reminder.hour, reminder.minute, 0, 0);
          return d;
        })()}
        onChange={onTimeChange}
      />
    )}
    <Text>We'll pick one verse from your deck each day.</Text>
  </View>
)}
```

Match existing styles in the file. If `@react-native-community/datetimepicker` is not installed, run `cd mobile && npx expo install @react-native-community/datetimepicker` before this step.

**Step 3: Wire the notification tap → deep link**

In `mobile/app/_layout.tsx` (root layout), add a `Notifications.addNotificationResponseReceivedListener` that routes memory-reminder taps to the Memory tab with `autoplay=1`:

```tsx
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

// Inside the root layout component:
const router = useRouter();
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data;
    if (data?.type === "memory-reminder") {
      router.push({ pathname: "/(tabs)/memory", params: { autoplay: "1" } });
    }
  });
  return () => sub.remove();
}, [router]);
```

If the root layout already has a notification listener, fold this into it instead of adding a second.

**Step 4: Smoke test**

- Settings → enable Daily memory reminder. Grant permission when prompted.
- Tap the time row → pick a time ~1 minute in the future → save.
- Lock the phone, wait for the notification, tap it.
- Confirm the app opens directly into the Practice screen on a random saved verse.
- Settings → disable the toggle → confirm no further notifications fire.
- Delete all verses → return to Settings → reminder section is hidden.

**Step 5: Commit**

```bash
git add mobile/app/\(tabs\)/settings.tsx mobile/app/_layout.tsx
git commit -m "feat(mobile): reminder settings + notification tap deep-link"
```

---

### Task 7: Final smoke pass + design-doc cross-check

**Step 1: Run the manual smoke checklist from the design doc**

From `docs/plans/2026-06-01-mobile-memory-verses-design.md` § Testing:

1. Save a verse from the reader; icon flips filled.
2. Re-open the reader on the same verse; icon stays filled.
3. Memory tab shows the verse with correct ref + date.
4. Tap row → practice screen → step Full / Initials / Blanks.
5. Tap a single word in Initials mode → that word reveals; others remain.
6. Prev/next walks the deck and resets mode + peeks.
7. Swipe-to-delete on the Memory tab removes the verse.
8. Settings → enable reminder, set time 1 minute ahead, lock phone, tap notification → land directly in practice on a random verse.

**Step 2: Run lint / typecheck across mobile**

```bash
cd mobile && npx tsc --noEmit
```
Expected: no new errors.

**Step 3: Final commit if any cleanup landed**

```bash
git status
# only commit if there are changes
```

---

## Out of scope (do not implement)

These were explicitly deferred in the design and must not be added during this plan:

- Book picker (browse-by-section UI from the web)
- ESV audio playback in practice
- Swipe-between-verses gestures, haptics
- Per-verse spaced repetition
- Streaks, missed-day catch-up, cross-device sync
- Automated tests (mobile has no test infra; smoke checklist only)
