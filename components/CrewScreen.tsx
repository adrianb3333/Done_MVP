import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Settings, Plus, Menu, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_KEYS = ['crew', 'latest'] as const;
type CrewTab = typeof TAB_KEYS[number];

export default function CrewScreen() {
  const { openSidebar, navigateTo } = useAppNavigation();
  const [activeTab, setActiveTab] = useState<CrewTab>('crew');
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const tabWidth = (SCREEN_WIDTH - 40) / 2;
  const underlineWidth = 50;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      (tabWidth - underlineWidth) / 2,
      tabWidth + (tabWidth - underlineWidth) / 2,
    ],
  });

  const handleTabChange = useCallback((tab: CrewTab) => {
    setActiveTab(tab);
    const idx = tab === 'crew' ? 0 : 1;
    Animated.spring(underlineAnim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [underlineAnim]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateTo('mygame');
  }, [navigateTo]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              activeOpacity={0.7}
              testID="crew-back-button"
            >
              <ChevronLeft size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                openSidebar();
              }}
              style={styles.menuBtn}
              activeOpacity={0.7}
              testID="crew-menu-button"
            >
              <Menu size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Crew</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('[Crew] Create pressed');
              }}
              activeOpacity={0.7}
              testID="crew-create-button"
            >
              <Plus size={22} color="#1A1A1A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('[Crew] Settings pressed');
              }}
              activeOpacity={0.7}
              testID="crew-settings-button"
            >
              <Settings size={20} color="#1A1A1A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('[Crew] Schedule pressed');
              }}
              activeOpacity={0.7}
              testID="crew-schedule-button"
            >
              <CalendarDays size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          <View style={styles.tabRow}>
            {TAB_KEYS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, { width: tabWidth }]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                  {tab === 'crew' ? 'Crew' : 'Latest'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View
            style={[
              styles.tabUnderline,
              {
                width: underlineWidth,
                transform: [{ translateX: underlineTranslateX }],
              },
            ]}
          />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'crew' ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>👥</Text>
            </View>
            <Text style={styles.emptyTitle}>Your Crew</Text>
            <Text style={styles.emptyText}>
              Add players to your crew to manage training sessions and track their progress.
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                console.log('[Crew] Add member pressed');
              }}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📋</Text>
            </View>
            <Text style={styles.emptyTitle}>Latest Activity</Text>
            <Text style={styles.emptyText}>
              Recent sessions and updates from your crew will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabBar: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 0,
  },
  tabRow: {
    flexDirection: 'row' as const,
  },
  tabBtn: {
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  tabTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  tabUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  addBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
