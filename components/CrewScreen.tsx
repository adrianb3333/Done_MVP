import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Settings, Plus, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useProfile } from '@/contexts/ProfileContext';
import CrewManagementScreen from '@/components/CrewManagementScreen';
import CrewCreateScreen from '@/components/CrewCreateScreen';
import CrewScheduleScreen from '@/components/CrewScheduleScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_KEYS = ['crew', 'latest', 'stats'] as const;
type CrewTab = typeof TAB_KEYS[number];

export default function CrewScreen() {
  const { navigateTo } = useAppNavigation();
  const { crewName, crewColor } = useProfile();
  const displayName = crewName || 'Crew';
  const bgColor = crewColor || '#FFFFFF';
  const [activeTab, setActiveTab] = useState<CrewTab>('crew');
  const [createVisible, setCreateVisible] = useState<boolean>(false);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [scheduleVisible, setScheduleVisible] = useState<boolean>(false);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const tabWidth = (SCREEN_WIDTH - 40) / 3;
  const underlineWidth = 50;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      (tabWidth - underlineWidth) / 2,
      tabWidth + (tabWidth - underlineWidth) / 2,
      2 * tabWidth + (tabWidth - underlineWidth) / 2,
    ],
  });

  const handleTabChange = useCallback((tab: CrewTab) => {
    setActiveTab(tab);
    const idx = TAB_KEYS.indexOf(tab);
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
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView edges={['top']} style={[styles.safeTop, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.glassIconBtn}
              activeOpacity={0.7}
              testID="crew-back-button"
            >
              <ChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerTitle, bgColor !== '#FFFFFF' && { color: '#FFFFFF' }]}>{displayName}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.glassIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreateVisible(true);
              }}
              activeOpacity={0.7}
              testID="crew-create-button"
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.glassIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSettingsVisible(true);
              }}
              activeOpacity={0.7}
              testID="crew-settings-button"
            >
              <Settings size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.glassIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScheduleVisible(true);
              }}
              activeOpacity={0.7}
              testID="crew-schedule-button"
            >
              <CalendarDays size={18} color="#FFFFFF" />
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
                  bgColor !== '#FFFFFF' && { color: 'rgba(255,255,255,0.5)' },
                  activeTab === tab && styles.tabTextActive,
                  activeTab === tab && bgColor !== '#FFFFFF' && { color: '#FFFFFF' },
                ]}>
                  {tab === 'crew' ? 'Crew' : tab === 'latest' ? 'Latest' : 'Stats'}
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
                backgroundColor: bgColor !== '#FFFFFF' ? '#FFFFFF' : '#1A1A1A',
              },
            ]}
          />
        </View>
      </SafeAreaView>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: bgColor }]}
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
        ) : activeTab === 'latest' ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📋</Text>
            </View>
            <Text style={styles.emptyTitle}>Latest Activity</Text>
            <Text style={styles.emptyText}>
              Recent sessions and updates from your crew will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>Crew Stats</Text>
            <Text style={styles.emptyText}>
              Performance statistics and progress tracking for your crew will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={createVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCreateVisible(false)}
      >
        <CrewCreateScreen onClose={() => setCreateVisible(false)} />
      </Modal>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <CrewManagementScreen onClose={() => setSettingsVisible(false)} />
      </Modal>

      <Modal
        visible={scheduleVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScheduleVisible(false)}
      >
        <CrewScheduleScreen onClose={() => setScheduleVisible(false)} />
      </Modal>
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
    borderBottomWidth: 0,
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
  glassIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    gap: 8,
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
