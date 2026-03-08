import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/contexts/SessionContext';

export default function PracticeSummary() {
  const { dismissPracticeSummary } = useSession();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.title}>Practice Summary</Text>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissPracticeSummary}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
  },
  closeButton: {
    backgroundColor: '#A4D15F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
