import { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C } from '../constants/colors';
import type { Milestone } from '../lib/milestones';

const AUTO_DISMISS_MS = 4500;

export default function CelebrationModal({
  milestone,
  onClose,
}: {
  milestone: Milestone | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [milestone, onClose]);

  return (
    <Modal
      visible={!!milestone}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.badge}>✦</Text>
          <Text style={styles.kicker}>{milestone ? `${milestone.pct}% · ${milestone.name}` : ''}</Text>
          <Text style={styles.message}>{milestone?.message ?? ''}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Keep going</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,37,48,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.yellow,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  badge: { fontSize: 40, color: C.yellow, marginBottom: 8 },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: C.yellow,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    color: C.offWhite,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 22,
  },
  button: {
    backgroundColor: C.yellow,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  buttonText: { color: C.tealDark, fontWeight: '700', fontSize: 14 },
});
