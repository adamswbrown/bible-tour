import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { C } from '../constants/colors';
import { BOOKS } from '../lib/readingPlan';
import { fetchVerse, type VerseResult } from '../lib/api';
import { TRANSLATIONS, getTranslation, buildYouVersionUrl, DEFAULT_TRANSLATION } from '../lib/translations';
import { hasStudyForRef, getTokensForRef, getEntry } from '../lib/study';
import StrongsVerse from '../components/StrongsVerse';
import LexiconDrawer from '../components/LexiconDrawer';
import AudioPlayer from '../components/AudioPlayer';
import { loadMemory, isSaved, toggleVerse } from '../lib/memory';

const VERCEL_BASE = 'https://bible-tour.vercel.app';

// Swipe-down-to-dismiss tuning, matched to LexiconDrawer so the gesture
// feels the same everywhere in the app.
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD_PX = 110;
const DISMISS_VELOCITY = 800;

export default function VerseScreen() {
  const params = useLocalSearchParams<{
    book: string;
    ref: string;
    translation: string;
  }>();
  const book = params.book ?? '';
  const refParam = params.ref ?? '';
  const initialTranslation = params.translation ?? DEFAULT_TRANSLATION;

  const [translation, setTranslation] = useState(initialTranslation);
  const [previousTranslation, setPreviousTranslation] = useState<string | null>(null);
  const [result, setResult] = useState<VerseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studyMode, setStudyMode] = useState(false);
  const [activeStrong, setActiveStrong] = useState<string | null>(null);
  const [savedToMemory, setSavedToMemory] = useState(false);

  useEffect(() => {
    if (!book || !refParam) return;
    let cancelled = false;
    loadMemory().then((map) => {
      if (!cancelled) setSavedToMemory(isSaved(map, book, refParam));
    });
    return () => { cancelled = true; };
  }, [book, refParam]);

  async function onToggleMemory() {
    const next = await toggleVerse(book, refParam);
    setSavedToMemory(isSaved(next, book, refParam));
  }

  // Sibling verses within this book, so the reader can step through them
  // without bouncing back to the listing. Same parse the checklist uses.
  const siblingRefs = useMemo(() => {
    const entry = BOOKS.find((b) => b.book === book);
    if (!entry) return [] as string[];
    return entry.refs
      .split(/\s+and\s+|,\s*/)
      .map((r) => r.trim())
      .filter((r) => /^\d+:\S+$/.test(r));
  }, [book]);
  const currentIndex = siblingRefs.indexOf(refParam.trim());
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < siblingRefs.length - 1;

  function goToSibling(offset: number) {
    const next = siblingRefs[currentIndex + offset];
    if (next) router.setParams({ ref: next });
  }

  const studyAvailable = useMemo(() => hasStudyForRef(book, refParam), [book, refParam]);
  const studyVerses = useMemo(
    () => (studyAvailable ? getTokensForRef(book, refParam) : []),
    [studyAvailable, book, refParam],
  );

  const t = getTranslation(translation);
  const isKjv = t.id === 'kjv';

  // The audio proxy returns a 302 redirect to Crossway's MP3 — pass the
  // proxy URL straight to expo-audio. No pre-fetch needed.
  const audioUrl =
    book && refParam
      ? `${VERCEL_BASE}/api/verse-audio?book=${encodeURIComponent(book)}&ref=${encodeURIComponent(refParam)}`
      : null;

  useEffect(() => {
    if (!book || !refParam) return;
    setLoading(true);
    setError(null);
    setResult(null);

    fetchVerse(book, refParam, translation)
      .then(setResult)
      .catch((e) => setError(e.message ?? 'unknown'))
      .finally(() => setLoading(false));
  }, [book, refParam, translation]);

  function pickTranslation(id: string) {
    setTranslation(id);
    if (id !== 'kjv') {
      setStudyMode(false);
      setPreviousTranslation(null);
    }
  }

  function toggleOriginals() {
    if (isKjv && studyMode) {
      // Turning Originals off — restore whatever they were on before
      setStudyMode(false);
      if (previousTranslation && previousTranslation !== 'kjv') {
        setTranslation(previousTranslation);
      }
      setPreviousTranslation(null);
    } else {
      // Turning Originals on — remember the current translation, switch to KJV
      if (!isKjv) setPreviousTranslation(translation);
      setTranslation('kjv');
      setStudyMode(true);
    }
  }

  const entry = activeStrong ? getEntry(activeStrong) : null;

  // The header advertises "Swipe down to go back", but `presentation:
  // 'modal'` only gives a swipe-to-dismiss sheet on iOS — on Android the
  // modal is a plain full-screen route, so the gesture did nothing (the
  // bug a tester reported). Drive the dismiss ourselves so it works on
  // both platforms. The drag target is the grabber/hint area, kept
  // outside the ScrollView so it never fights the vertical scroll.
  const translateY = useSharedValue(0);

  function dismiss() {
    if (router.canGoBack()) router.back();
  }

  const swipeDown = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-10)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      const shouldDismiss =
        e.translationY > DISMISS_THRESHOLD_PX || e.velocityY > DISMISS_VELOCITY;
      if (shouldDismiss) {
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: 200 },
          (finished) => {
            if (finished) runOnJS(dismiss)();
          },
        );
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      <Stack.Screen
        options={{
          title: `${book} ${refParam}`,
          headerRight: () => (
            <TouchableOpacity
              onPress={onToggleMemory}
              accessibilityLabel={savedToMemory ? 'Remove from memory' : 'Save to memory'}
              hitSlop={12}
              style={styles.memoryBtn}
            >
              <Text style={styles.memoryBtnText}>{savedToMemory ? '★' : '☆'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <GestureDetector gesture={swipeDown}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
            <Text style={styles.grabberHint}>Swipe down to go back</Text>
          </View>
        </GestureDetector>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.translationRow}>
          {TRANSLATIONS.map((tr) => (
            <TouchableOpacity
              key={tr.id}
              style={[styles.pill, tr.id === translation && styles.pillActive]}
              onPress={() => pickTranslation(tr.id)}
            >
              <Text style={[styles.pillText, tr.id === translation && styles.pillTextActive]}>
                {tr.abbr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AudioPlayer audioUrl={audioUrl} />

        {studyAvailable && (
          <TouchableOpacity
            style={[styles.originalsBtn, studyMode && styles.originalsBtnOn]}
            onPress={toggleOriginals}
          >
            <Text style={[styles.originalsText, studyMode && styles.originalsTextOn]}>
              {studyMode ? 'Originals ✓' : 'Originals ▸'}
            </Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator color={C.yellow} size="large" style={styles.loader} />}

        {error && !loading && (
          <View style={styles.body}>
            <Text style={styles.errorTitle}>Could not load passage.</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <YouVersionButton book={book} refStr={refParam} translation={t} />
          </View>
        )}

        {result && (
          <View style={styles.body}>
            <Text style={styles.reference}>
              {result.reference} · {t.abbr}
              {studyMode && isKjv && studyVerses.length > 0 && '  ·  Tap underlined words for lexicon'}
            </Text>

            {isKjv && studyMode && studyVerses.length > 0 ? (
              <View>
                {studyVerses.map(({ verseNum, tokens }, idx) => (
                  <View
                    key={verseNum}
                    style={idx > 0 ? styles.studyVerseSpacer : undefined}
                  >
                    {studyVerses.length > 1 && (
                      <Text style={styles.studyVerseNum}>{verseNum}</Text>
                    )}
                    <StrongsVerse
                      tokens={tokens}
                      activeStrong={activeStrong}
                      onWordPress={setActiveStrong}
                    />
                  </View>
                ))}
              </View>
            ) : t.copyrighted || !result.text ? (
              <CopyrightedNotice
                book={book}
                refStr={refParam}
                translation={t}
              />
            ) : (
              <Text style={styles.verse}>{result.text}</Text>
            )}

            {result.copyright && result.text && (
              <Text style={styles.copyright}>{result.copyright}</Text>
            )}
          </View>
        )}
        {siblingRefs.length > 1 && (
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
              onPress={() => goToSibling(-1)}
              disabled={!hasPrev}
            >
              <Text style={[styles.navBtnText, !hasPrev && styles.navBtnTextDisabled]}>‹ Previous</Text>
            </TouchableOpacity>

            <Text style={styles.navCount}>
              {currentIndex + 1} / {siblingRefs.length}
            </Text>

            <TouchableOpacity
              style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
              onPress={() => goToSibling(1)}
              disabled={!hasNext}
            >
              <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>Next ›</Text>
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </Animated.View>

      <LexiconDrawer
        visible={!!activeStrong}
        strongsId={activeStrong}
        entry={entry}
        onClose={() => setActiveStrong(null)}
      />
    </>
  );
}

function CopyrightedNotice({
  book,
  refStr,
  translation,
}: {
  book: string;
  refStr: string;
  translation: ReturnType<typeof getTranslation>;
}) {
  return (
    <View>
      <Text style={styles.notice}>
        {translation.copyrighted
          ? `${translation.abbr} passages open in YouVersion.`
          : 'Could not load this passage.'}
      </Text>
      <YouVersionButton book={book} refStr={refStr} translation={translation} />
      {translation.copyrighted && (
        <Text style={styles.noticeHint}>
          Read inline in KJV, BSB, WEB, or ASV.
        </Text>
      )}
    </View>
  );
}

function YouVersionButton({
  book,
  refStr,
  translation,
}: {
  book: string;
  refStr: string;
  translation: ReturnType<typeof getTranslation>;
}) {
  const url = buildYouVersionUrl(book, refStr, translation.youVersionId);
  if (!url) return null;
  const label = translation.copyrighted
    ? 'Open in YouVersion ↗'
    : `Read in ${translation.abbr} on YouVersion ↗`;
  return (
    <TouchableOpacity style={styles.yvBtn} onPress={() => Linking.openURL(url)}>
      <Text style={styles.yvBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sheet:            { flex: 1, backgroundColor: C.teal },
  container:        { flex: 1, backgroundColor: C.teal },
  content:          { padding: 16, paddingBottom: 48 },
  // Grabber sits above the ScrollView and is the swipe-down drag target,
  // so it needs generous padding to be easy to grab.
  grabberWrap:      { alignItems: 'center', paddingTop: 10, paddingBottom: 12, backgroundColor: C.teal },
  grabber:          { width: 40, height: 5, borderRadius: 3, backgroundColor: C.tealLight },
  grabberHint:      { fontSize: 11, color: C.textSecondary, marginTop: 6, letterSpacing: 0.3 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border,
  },
  navBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  navBtnDisabled:    { opacity: 0.35 },
  navBtnText:        { fontSize: 13, fontWeight: '700', color: C.yellow },
  navBtnTextDisabled:{ color: C.textSecondary },
  navCount:          { fontSize: 12, color: C.textSecondary, fontWeight: '600' },
  translationRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  pillActive:       { backgroundColor: C.yellow, borderColor: C.yellow },
  pillText:         { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  pillTextActive:   { color: C.tealDark },
  originalsBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 16,
  },
  originalsBtnOn:   { backgroundColor: C.done, borderColor: C.done },
  originalsText:    { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  originalsTextOn:  { color: C.white },
  loader:           { marginTop: 60 },
  errorTitle:       { color: '#f87171', fontSize: 16, fontWeight: '600', marginTop: 40 },
  errorDetail:      { color: C.textSecondary, fontSize: 13, marginTop: 8 },
  body:             { paddingTop: 8 },
  reference:        { fontSize: 12, fontWeight: '700', color: C.yellow, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  verse:            { fontSize: 18, lineHeight: 32, color: C.offWhite, fontWeight: '300' },
  studyVerseSpacer: { marginTop: 18 },
  studyVerseNum:    { fontSize: 11, fontWeight: '700', color: C.yellow, marginBottom: 4, letterSpacing: 0.5 },
  copyright:        { fontSize: 11, color: C.textSecondary, marginTop: 24, lineHeight: 18 },
  notice:           { fontSize: 15, color: C.offWhite, lineHeight: 22, marginBottom: 16 },
  noticeHint:       { fontSize: 12, color: C.textSecondary, marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
  yvBtn:            { backgroundColor: C.yellow, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  yvBtnText:        { color: C.tealDark, fontWeight: '700', fontSize: 14 },
  memoryBtn:        { paddingHorizontal: 12, paddingVertical: 4 },
  memoryBtnText:    { color: C.yellow, fontSize: 22, fontWeight: '600' },
});
