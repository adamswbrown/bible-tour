import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { C } from '../constants/colors';

// expo-audio is a native module; the dev client must include it.
// Wrapped in a try/require so the JS bundle still parses on a dev client
// that doesn't have it linked yet — the player will just render a notice.
let useAudioPlayer: any = null;
let useAudioPlayerStatus: any = null;
try {
  const audio = require('expo-audio');
  useAudioPlayer = audio.useAudioPlayer;
  useAudioPlayerStatus = audio.useAudioPlayerStatus;
} catch {
  useAudioPlayer = null;
}

type Props = {
  audioUrl: string | null;
  loading?: boolean;
};

export default function AudioPlayer({ audioUrl, loading }: Props) {
  if (!useAudioPlayer) {
    return (
      <View style={styles.bar}>
        <Text style={styles.disabled}>
          Audio requires a dev client rebuild (expo-audio).
        </Text>
      </View>
    );
  }
  return <ActiveAudioPlayer audioUrl={audioUrl} loading={loading} />;
}

function ActiveAudioPlayer({ audioUrl, loading }: Props) {
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const status = useAudioPlayerStatus(player);
  const [pendingPlay, setPendingPlay] = useState(false);

  useEffect(() => {
    if (pendingPlay && status?.isLoaded) {
      player.play();
      setPendingPlay(false);
    }
  }, [pendingPlay, status?.isLoaded, player]);

  const playing = !!status?.playing;
  const ready = !!status?.isLoaded;

  function toggle() {
    if (!audioUrl) return;
    if (playing) {
      player.pause();
    } else if (ready) {
      player.play();
    } else {
      setPendingPlay(true);
    }
  }

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ESV</Text>
        </View>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={toggle}
          disabled={!audioUrl || !!loading}
        >
          {loading ? (
            <ActivityIndicator color={C.tealDark} />
          ) : (
            <Text style={styles.playBtnText}>{playing ? '⏸  Pause' : '▶  Play verse'}</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.attrib}>
        Audio from the ESV® Bible © 2001 by Crossway. Used by permission.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge:     { backgroundColor: C.yellow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.tealDark, letterSpacing: 1 },
  playBtn:   { flex: 1, backgroundColor: C.yellow, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  playBtnText: { color: C.tealDark, fontWeight: '700', fontSize: 14 },
  disabled:  { fontSize: 12, color: C.textSecondary, textAlign: 'center' },
  attrib:    { fontSize: 10, color: C.textSecondary, marginTop: 8, lineHeight: 14 },
});
