import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type CourseTab = 'nearby' | 'played' | 'favorite';

interface TabCourseProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  playedCount?: number;
}

const TABS: { key: CourseTab; label: string }[] = [
  { key: 'nearby', label: 'Närmast' },
  { key: 'played', label: 'Spelat' },
  { key: 'favorite', label: 'Favorit' },
];

export default function TabCourse({ activeTab, onTabChange, playedCount }: TabCourseProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        let label = tab.label;
        if (tab.key === 'played' && playedCount !== undefined) {
          label = `${tab.label} (${playedCount})`;
        }
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#141C18',
    borderWidth: 1,
    borderColor: '#243028',
  },
  tabActive: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8A9B90',
  },
  tabTextActive: {
    color: '#fff',
  },
});
