import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WedData() {
  return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>No data for practice yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
