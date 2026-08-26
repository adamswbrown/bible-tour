import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import { C } from '../constants/colors';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tour of the Bible</Text>
      <Text style={styles.sub}>A companion to Matt Whitman's Lightning-Fast Field Guide to the Bible.</Text>
      <Text style={styles.disclaimer}>
        Not affiliated with or endorsed by The Ten Minute Bible Hour.
      </Text>

      <Section title="Bible Text">
        <Credit
          name="New International Version (NIV), NIrV, NIVUK"
          detail="Holy Bible, New International Version®, NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide. Accessed via the YouVersion Developer API."
          url="https://developers.youversion.com"
        />
        <Credit
          name="English Standard Version (ESV)"
          detail='Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. ESV text via api.esv.org.'
          url="https://api.esv.org"
        />
        <Credit
          name="Berean Standard Bible (BSB)"
          detail="The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. This text of God's Word has been dedicated to the public domain. Accessed via the YouVersion Developer API."
          url="https://berean.bible"
        />
        <Credit
          name="Original (Hebrew / Aramaic / Greek)"
          detail="Hebrew text from the Westminster Leningrad Codex via Open Scriptures (CC BY 4.0). Greek text from the SBLGNT, edited by Michael W. Holmes, with MorphGNT morphology (CC BY-SA 4.0)."
          url="https://github.com/openscriptures/morphhb"
        />
        <Credit
          name="KJV, WEB, ASV"
          detail="Public domain translations via bible-api.com."
          url="https://bible-api.com"
        />
      </Section>

      <Section title="Lexicon Data">
        <Credit
          name="Strong's Dictionaries — Open Scriptures"
          detail="Hebrew and Greek lexicon data © 2009–2010 Open Scriptures. Licensed under Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)."
          url="https://github.com/openscriptures/strongs"
        />
        <Credit
          name="Pruned subset bundled in this app"
          detail="The lexicon entries shipped in Tour of the Bible are a filtered subset of the upstream dictionary, redistributed under the same CC BY-SA 3.0 terms. Source files, licence, and attribution are public:"
          url="https://github.com/adamswbrown/bible-tour/tree/main/bible-tour-data"
        />
      </Section>

      <Section title="Fonts">
        <Credit
          name="DM Sans & Oswald"
          detail="Released under the SIL Open Font Licence 1.1."
        />
      </Section>

      <Section title="Open Source Licences">
        <Credit
          name="React Native / Expo"
          detail="MIT Licence. expo.dev"
          url="https://expo.dev"
        />
      </Section>

      <BuildInfo />

      <Text style={styles.footer}>
        bible-tour.vercel.app · not affiliated with or endorsed by The Ten Minute Bible Hour
      </Text>
    </ScrollView>
  );
}

// Shows which JS bundle is actually running so a specific OTA update can be
// confirmed on-device. `Updates.*` constants are null in dev / Expo Go and
// populated in release builds. An embedded launch means no OTA has applied yet.
function BuildInfo() {
  const onOta = !Updates.isEmbeddedLaunch && !!Updates.updateId;
  return (
    <Section title="Build">
      <View style={styles.credit}>
        <BuildRow label="Version" value={Updates.runtimeVersion ?? '—'} />
        <BuildRow label="Channel" value={Updates.channel ?? 'embedded'} />
        <BuildRow label="Update" value={onOta ? (Updates.updateId as string) : 'embedded (no OTA applied)'} />
        <BuildRow
          label="Published"
          value={Updates.createdAt ? Updates.createdAt.toLocaleString() : '—'}
        />
      </View>
    </Section>
  );
}

function BuildRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.buildRow}>
      <Text style={styles.buildLabel}>{label}</Text>
      <Text style={styles.buildValue} selectable>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Credit({ name, detail, url }: { name: string; detail: string; url?: string }) {
  return (
    <View style={styles.credit}>
      <Text style={styles.creditName}>{name}</Text>
      <Text style={styles.creditDetail}>{detail}</Text>
      {url && (
        <TouchableOpacity onPress={() => Linking.openURL(url)}>
          <Text style={styles.creditUrl}>{url}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.tealDark },
  content:      { padding: 24, paddingBottom: 60 },
  title:        { fontSize: 24, fontWeight: '800', color: C.yellow, marginBottom: 8 },
  sub:          { fontSize: 15, color: C.offWhite, lineHeight: 22, marginBottom: 8 },
  disclaimer:   { fontSize: 12, color: C.textSecondary, marginBottom: 32 },
  section:      { marginBottom: 28 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: C.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12,
  },
  credit:       { marginBottom: 16 },
  creditName:   { fontSize: 14, fontWeight: '600', color: C.offWhite, marginBottom: 4 },
  creditDetail: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  creditUrl:    { fontSize: 12, color: C.yellow, marginTop: 4 },
  buildRow:     { flexDirection: 'row', marginBottom: 6 },
  buildLabel:   { width: 84, fontSize: 12, color: C.textSecondary },
  buildValue:   { flex: 1, fontSize: 12, color: C.offWhite },
  footer:       { fontSize: 11, color: C.border, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
