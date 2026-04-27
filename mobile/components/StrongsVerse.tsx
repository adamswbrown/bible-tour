import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C } from '../constants/colors';
import type { StudyToken } from '../lib/study';

type Props = {
  tokens: StudyToken[];
  activeStrong?: string | null;
  onWordPress: (strongsId: string) => void;
};

export default function StrongsVerse({ tokens, activeStrong, onWordPress }: Props) {
  return (
    <View style={styles.wrap}>
      {tokens.map((tok, i) => {
        const tagged = !!tok.s;
        const active = tagged && tok.s === activeStrong;
        const sep = i > 0 ? ' ' : '';

        if (!tagged) {
          return (
            <Text key={i} style={styles.plain}>
              {sep}
              {tok.w}
            </Text>
          );
        }

        return (
          <View key={i} style={styles.tokenWrap}>
            {sep ? <Text style={styles.plain}>{sep}</Text> : null}
            <TouchableOpacity
              onPress={() => onWordPress(tok.s as string)}
              activeOpacity={0.6}
            >
              <Text style={[styles.tagged, active && styles.taggedActive]}>{tok.w}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  tokenWrap: { flexDirection: 'row', alignItems: 'flex-end' },
  plain: {
    fontSize: 18,
    lineHeight: 32,
    color: C.offWhite,
    fontWeight: '300',
  },
  tagged: {
    fontSize: 18,
    lineHeight: 32,
    color: C.offWhite,
    fontWeight: '300',
    borderBottomWidth: 1,
    borderBottomColor: '#8ab',
    borderStyle: 'dotted',
  },
  taggedActive: {
    borderBottomColor: C.yellow,
    borderBottomWidth: 2,
    color: C.yellow,
  },
});
