import { useEffect } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { C } from '../constants/colors';
import type { LexiconEntry } from '../lib/study';

type Props = {
  visible: boolean;
  strongsId: string | null;
  entry: LexiconEntry | null;
  onClose: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD_PX = 120;
const DISMISS_VELOCITY = 800;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;

export default function LexiconDrawer({ visible, strongsId, entry, onClose }: Props) {
  // Start off-screen below — reanimated owns the entire entrance/exit
  // animation so the Modal's own animationType doesn't compete.
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: OPEN_DURATION });
    } else {
      translateY.value = SCREEN_HEIGHT;
    }
  }, [visible, translateY]);

  function animatedDismiss() {
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: CLOSE_DURATION },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      } else {
        translateY.value = e.translationY * 0.2;
      }
    })
    .onEnd((e) => {
      const shouldDismiss =
        e.translationY > DISMISS_THRESHOLD_PX || e.velocityY > DISMISS_VELOCITY;
      if (shouldDismiss) {
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: CLOSE_DURATION },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
      } else {
        // Spring is fine for the snap-back-from-pull because the user
        // initiated movement — they expect a little bounce there.
        translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const blbUrl = strongsId
    ? `https://www.blueletterbible.org/lexicon/${strongsId}/kjv/wlc/0-1/`
    : null;

  const paragraphs = entry?.entry
    ? entry.entry.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animatedDismiss}
    >
      <GestureHandlerRootView style={styles.root}>
        <Pressable style={styles.backdrop} onPress={animatedDismiss} />

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, animatedStyle]}>
            {/* Drag handle area — large hit slop so the gesture is easy to grab */}
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              {strongsId && <Text style={styles.strongsId}>{strongsId}</Text>}
              {entry?.lemma && <Text style={styles.lemma}>{entry.lemma}</Text>}
              {entry?.translit && <Text style={styles.translit}>{entry.translit}</Text>}
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {entry?.pos && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Part of speech</Text>
                  <Text style={styles.fieldValue}>{entry.pos}</Text>
                </View>
              )}

              {entry?.gloss && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Gloss</Text>
                  <Text style={[styles.fieldValue, styles.italic]}>“{entry.gloss}”</Text>
                </View>
              )}

              {paragraphs.length > 0 && (
                <>
                  <View style={styles.divider} />
                  {paragraphs.map((p, i) => (
                    <Text key={i} style={styles.entryPara}>
                      {p}
                    </Text>
                  ))}
                </>
              )}

              {blbUrl && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.studyFurther}>Study further</Text>
                  <TouchableOpacity
                    style={styles.blbBtn}
                    onPress={() => Linking.openURL(blbUrl)}
                  >
                    <Text style={styles.blbBtnText}>Open on Blue Letter Bible ↗</Text>
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.attribution}>
                Strong&apos;s dictionary © 2009–2010 Open Scriptures. CC BY-SA 3.0.
              </Text>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    maxHeight: '85%',
    backgroundColor: C.tealDark,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
    borderTopWidth: 1, borderColor: C.border,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 48, height: 5,
    backgroundColor: C.textSecondary, borderRadius: 3,
    opacity: 0.7,
  },
  header:      { paddingHorizontal: 24, paddingBottom: 12 },
  strongsId:   { fontSize: 11, fontWeight: '700', color: C.yellow, letterSpacing: 1.2 },
  lemma:       { fontSize: 24, fontWeight: '700', color: C.offWhite, marginTop: 4 },
  translit:    { fontSize: 14, color: C.textSecondary, marginTop: 2, fontStyle: 'italic' },
  body:        { flexGrow: 0 },
  bodyContent: { paddingHorizontal: 24, paddingBottom: 24 },
  fieldRow:    { flexDirection: 'row', marginTop: 8 },
  fieldLabel:  { width: 110, fontSize: 12, color: C.textSecondary, fontWeight: '600' },
  fieldValue:  { flex: 1, fontSize: 14, color: C.offWhite },
  italic:      { fontStyle: 'italic' },
  divider:     { height: 1, backgroundColor: C.border, marginVertical: 16 },
  entryPara:   { fontSize: 14, color: C.offWhite, lineHeight: 22, marginBottom: 12 },
  studyFurther:{ fontSize: 12, color: C.textSecondary, fontWeight: '600', marginBottom: 8 },
  blbBtn:      { backgroundColor: C.surface, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  blbBtnText:  { color: C.yellow, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  attribution: { fontSize: 11, color: C.textSecondary, marginTop: 24, lineHeight: 18 },
});
