import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';

export default function MiniSessionModal() {
  const { sessionType, expandSession, finishSession } = useSession();

  const sessionLabel = sessionType === 'play' ? 'Round in Progress' : 'Practice Session';

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={expandSession}
          activeOpacity={0.7}
        >
          <ChevronUp size={28} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.sessionLabel}>{sessionLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={finishSession}
          activeOpacity={0.8}
        >
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  finishButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  finishText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
