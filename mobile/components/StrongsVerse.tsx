import { StyleSheet, Text } from 'react-native';
import { C } from '../constants/colors';
import type { StudyToken } from '../lib/study';

type Props = {
  tokens: StudyToken[];
  activeStrong?: string | null;
  onWordPress: (strongsId: string) => void;
};

// Renders the tokenized verse as a single flowing <Text> with nested
// <Text> children. Each tagged word gets a dotted underline + onPress
// handler. Nested Text inherits font from the parent so the verse wraps
// naturally and tap targets line up with the visible word boundaries.
export default function StrongsVerse({ tokens, activeStrong, onWordPress }: Props) {
  return (
    <Text style={styles.verseText}>
      {tokens.map((tok, i) => {
        const sep = i > 0 ? ' ' : '';

        if (!tok.s) {
          return (
            <Text key={i}>
              {sep}
              {tok.w}
            </Text>
          );
        }

        const active = tok.s === activeStrong;
        return (
          <Text key={i}>
            {sep}
            <Text
              onPress={() => onWordPress(tok.s as string)}
              suppressHighlighting={false}
              style={active ? styles.taggedActive : styles.tagged}
            >
              {tok.w}
            </Text>
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  verseText: {
    fontSize: 18,
    lineHeight: 32,
    color: C.offWhite,
    fontWeight: '300',
  },
  tagged: {
    color: C.yellow,
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: C.yellow,
  },
  taggedActive: {
    color: C.yellowLight,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: C.yellowLight,
  },
});
