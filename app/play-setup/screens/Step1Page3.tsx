import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function Step1Page3() {
  return (
    <View style={styles.pageContent}>
      <Text style={styles.pageTitle}>Game Mode</Text>
      <Text style={styles.pageSubtitle}>Select game type</Text>
      <View style={styles.itemsContainer}>
        {['Stroke Play', 'Match Play', 'Stableford', 'Skins'].map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemNumber}>
              <Text style={styles.itemNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    flex: 1,
    padding: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  itemsContainer: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
