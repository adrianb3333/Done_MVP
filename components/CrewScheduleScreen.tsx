import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface CrewScheduleScreenProps {
  onClose: () => void;
}

const TABS = ['Schedule', 'Storage'] as const;
type Tab = typeof TABS[number];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CrewScheduleScreen({ onClose }: CrewScheduleScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Schedule');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const handleTabPress = useCallback((tab: Tab) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = tab === 'Schedule' ? 0 : 1;
    Animated.spring(indicatorAnim, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    setActiveTab(tab);
  }, [indicatorAnim]);

  const tabWidth = (SCREEN_WIDTH - 32) / 2;
  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.glassBackBtn}
            activeOpacity={0.7}
            testID="crew-schedule-back"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeTab}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.segmentContainer}>
          <View style={styles.segmentRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={styles.segmentTab}
                activeOpacity={0.7}
                testID={`crew-schedule-tab-${tab.toLowerCase()}`}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    activeTab === tab && styles.segmentLabelActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.segmentTrack}>
            <Animated.View
              style={[
                styles.segmentIndicator,
                { width: tabWidth, transform: [{ translateX: indicatorTranslateX }] },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>

      {activeTab === 'Schedule' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📅</Text>
            </View>
            <Text style={styles.emptyTitle}>Schedule</Text>
            <Text style={styles.emptyText}>
              Plan training sessions and events for your crew. Coming soon.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>Storage</Text>
            <Text style={styles.emptyText}>
              Store and manage crew files and resources. Coming soon.
            </Text>
          </View>
        </ScrollView>
      )}
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
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  glassBackBtn: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  segmentRow: {
    flexDirection: 'row' as const,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#AAAAAA',
  },
  segmentLabelActive: {
    color: '#1A1A1A',
  },
  segmentTrack: {
    height: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 1,
    marginTop: 2,
  },
  segmentIndicator: {
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
  },
});
