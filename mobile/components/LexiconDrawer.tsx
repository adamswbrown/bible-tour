import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C } from '../constants/colors';
import type { LexiconEntry } from '../lib/study';

type Props = {
  visible: boolean;
  strongsId: string | null;
  entry: LexiconEntry | null;
  onClose: () => void;
};

export default function LexiconDrawer({ visible, strongsId, entry, onClose }: Props) {
  const blbUrl = strongsId
    ? `https://www.blueletterbible.org/lexicon/${strongsId}/kjv/wlc/0-1/`
    : null;

  const paragraphs = entry?.entry
    ? entry.entry.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          {strongsId && <Text style={styles.strongsId}>{strongsId}</Text>}
          {entry?.lemma && <Text style={styles.lemma}>{entry.lemma}</Text>}
          {entry?.translit && <Text style={styles.translit}>{entry.translit}</Text>}
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    maxHeight: '85%',
    backgroundColor: C.tealDark,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: 8, paddingBottom: 32,
    borderTopWidth: 1, borderColor: C.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40, height: 4,
    backgroundColor: C.border, borderRadius: 2,
    marginBottom: 12,
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
  closeBtn:    { marginHorizontal: 24, marginTop: 8, paddingVertical: 12, backgroundColor: C.surface, borderRadius: 10 },
  closeBtnText:{ color: C.offWhite, textAlign: 'center', fontWeight: '600', fontSize: 14 },
});
