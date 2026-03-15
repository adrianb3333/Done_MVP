import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Calendar, Trash2, Check, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useProfile, CrewDrill, ScheduledDrill } from '@/contexts/ProfileContext';

interface CrewScheduleScreenProps {
  onClose: () => void;
}

const TABS = ['Schedule', 'Storage'] as const;
type Tab = typeof TABS[number];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CrewScheduleScreen({ onClose }: CrewScheduleScreenProps) {
  const insets = useSafeAreaInsets();
  const { crewColor, crewDrills, crewScheduled, deleteCrewDrill, saveScheduledDrill, deleteScheduledDrill } = useProfile();
  const bgColor = crewColor || '#FFFFFF';
  const isDark = bgColor !== '#FFFFFF';
  const [activeTab, setActiveTab] = useState<Tab>('Schedule');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const [drillDetailVisible, setDrillDetailVisible] = useState<CrewDrill | null>(null);
  const [schedulePickerVisible, setSchedulePickerVisible] = useState<boolean>(false);
  const [selectedDrillIds, setSelectedDrillIds] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'drill' | 'scheduled' } | null>(null);

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

  const handleDeleteDrill = useCallback(async () => {
    if (!deleteConfirm) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      if (deleteConfirm.type === 'drill') {
        await deleteCrewDrill(deleteConfirm.id);
      } else {
        await deleteScheduledDrill(deleteConfirm.id);
      }
      console.log('[CrewSchedule] Deleted:', deleteConfirm.name);
    } catch (err: any) {
      console.log('[CrewSchedule] Delete error:', err.message);
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteCrewDrill, deleteScheduledDrill]);

  const toggleDrillSelection = useCallback((drillId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDrillIds((prev) =>
      prev.includes(drillId) ? prev.filter((id) => id !== drillId) : [...prev, drillId]
    );
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    if (selectedDrillIds.length === 0) {
      Alert.alert('No Drills Selected', 'Please select at least one drill to schedule.');
      return;
    }
    if (!scheduleDate.trim() || !scheduleTime.trim()) {
      Alert.alert('Missing Info', 'Please enter both date and time.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      for (const drillId of selectedDrillIds) {
        const drill = crewDrills.find((d) => d.id === drillId);
        if (!drill) continue;
        const scheduled: ScheduledDrill = {
          id: Date.now().toString() + '_' + drillId,
          drillId: drill.id,
          drillName: drill.name,
          date: scheduleDate.trim(),
          time: scheduleTime.trim(),
          createdAt: Date.now(),
        };
        await saveScheduledDrill(scheduled);
      }
      console.log('[CrewSchedule] Drills scheduled successfully');
      Alert.alert('Scheduled', `${selectedDrillIds.length} drill(s) have been scheduled.`);
      setSchedulePickerVisible(false);
      setSelectedDrillIds([]);
      setScheduleDate('');
      setScheduleTime('');
      setActiveTab('Schedule');
      Animated.spring(indicatorAnim, { toValue: 0, useNativeDriver: true, tension: 300, friction: 30 }).start();
    } catch (err: any) {
      console.log('[CrewSchedule] Schedule error:', err.message);
      Alert.alert('Error', 'Failed to schedule drills.');
    }
  }, [selectedDrillIds, scheduleDate, scheduleTime, crewDrills, saveScheduledDrill, indicatorAnim]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderScheduleTab = () => {
    if (crewScheduled.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.emptyEmoji}>📅</Text>
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>Schedule</Text>
          <Text style={[styles.emptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
            No scheduled drills yet. Go to Storage to schedule drills.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cardList}>
        {crewScheduled.map((item) => (
          <View key={item.id} style={[styles.scheduleCard, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.scheduleCardTop}>
              <Text style={[styles.scheduleCardName, isDark && { color: '#FFFFFF' }]}>{item.drillName}</Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setDeleteConfirm({ id: item.id, name: item.drillName, type: 'scheduled' });
                }}
                style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(255,59,48,0.2)' }]}
              >
                <Trash2 size={14} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.scheduleCardMeta}>
              <View style={styles.metaItem}>
                <Calendar size={13} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                <Text style={[styles.metaText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>{item.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={13} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                <Text style={[styles.metaText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>{item.time}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderStorageTab = () => {
    if (crewDrills.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.emptyEmoji}>📦</Text>
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>Storage</Text>
          <Text style={[styles.emptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
            No drills saved yet. Create drills from the Create screen.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cardList}>
        {crewDrills.map((drill) => (
          <TouchableOpacity
            key={drill.id}
            style={[styles.drillCard, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDrillDetailVisible(drill);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.drillCardTop}>
              <View style={styles.drillCardLeft}>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(drill.category) }]} />
                <Text style={[styles.drillCardName, isDark && { color: '#FFFFFF' }]}>{drill.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setDeleteConfirm({ id: drill.id, name: drill.name, type: 'drill' });
                }}
                style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(255,59,48,0.2)' }]}
              >
                <Trash2 size={14} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.drillCardMeta}>
              <Text style={[styles.drillCardCategory, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{drill.category}</Text>
              <Text style={[styles.drillCardStats, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                {drill.rounds}R × {drill.shotsPerRound}S = {drill.totalShots} shots
              </Text>
            </View>
            <Text style={[styles.drillCardDate, isDark && { color: 'rgba(255,255,255,0.3)' }]}>
              Created {formatDate(drill.createdAt)}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.scheduleDrillsBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedDrillIds([]);
            setScheduleDate('');
            setScheduleTime('');
            setSchedulePickerVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scheduleDrillsBtnGradient}
          >
            <Calendar size={18} color="#FFFFFF" />
            <Text style={styles.scheduleDrillsBtnText}>Schedule Drills</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 10, backgroundColor: bgColor }]}>
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
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>{activeTab}</Text>
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
                    isDark && { color: 'rgba(255,255,255,0.5)' },
                    activeTab === tab && styles.segmentLabelActive,
                    activeTab === tab && isDark && { color: '#FFFFFF' },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.segmentTrack, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Animated.View
              style={[
                styles.segmentIndicator,
                isDark && { backgroundColor: '#FFFFFF' },
                { width: tabWidth, transform: [{ translateX: indicatorTranslateX }] },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Schedule' ? renderScheduleTab() : renderStorageTab()}
      </ScrollView>

      <Modal
        visible={drillDetailVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDrillDetailVisible(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={[styles.detailCard, isDark && { backgroundColor: bgColor }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{drillDetailVisible?.name}</Text>
              <TouchableOpacity onPress={() => setDrillDetailVisible(null)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rounds</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.rounds}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shots Per Round</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.shotsPerRound}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Shots</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.totalShots}</Text>
            </View>
            {drillDetailVisible?.acceptedDistances && drillDetailVisible.acceptedDistances.some((d) => d > 0) && (
              <>
                <View style={styles.detailDivider} />
                <Text style={styles.detailSubheader}>Accepted Distances</Text>
                {drillDetailVisible.acceptedDistances.map((dist, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Round {idx + 1}</Text>
                    <Text style={styles.detailValue}>{dist}m</Text>
                  </View>
                ))}
              </>
            )}
            {drillDetailVisible?.info ? (
              <>
                <View style={styles.detailDivider} />
                <Text style={styles.detailSubheader}>Info</Text>
                <Text style={styles.detailInfo}>{drillDetailVisible.info}</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={schedulePickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSchedulePickerVisible(false)}
      >
        <View style={[styles.schedulePickerContainer, { backgroundColor: isDark ? bgColor : '#FFFFFF' }]}>
          <View style={[styles.schedulePickerHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setSchedulePickerVisible(false)}>
              <X size={22} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            </TouchableOpacity>
            <Text style={[styles.schedulePickerTitle, isDark && { color: '#FFFFFF' }]}>Schedule Drills</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.schedulePickerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.schedulePickerLabel, isDark && { color: 'rgba(255,255,255,0.6)' }]}>SELECT DRILLS</Text>
            {crewDrills.map((drill) => {
              const isSelected = selectedDrillIds.includes(drill.id);
              return (
                <TouchableOpacity
                  key={drill.id}
                  style={[styles.schedulePickerDrill, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.08)' }]}
                  onPress={() => toggleDrillSelection(drill.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.schedulePickerDrillInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(drill.category) }]} />
                    <Text style={[styles.schedulePickerDrillName, isDark && { color: '#FFFFFF' }]}>{drill.name}</Text>
                  </View>
                  <View style={[styles.schedulePickerCheck, isSelected && styles.schedulePickerCheckActive]}>
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.schedulePickerLabel, isDark && { color: 'rgba(255,255,255,0.6)' }, { marginTop: 24 }]}>DATE</Text>
            <View style={[styles.schedulePickerInput, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Calendar size={16} color={isDark ? 'rgba(255,255,255,0.4)' : '#888'} />
              <TextInput
                style={[styles.schedulePickerInputText, isDark && { color: '#FFFFFF' }]}
                placeholder="e.g. 2026-03-20"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
                value={scheduleDate}
                onChangeText={setScheduleDate}
              />
            </View>

            <Text style={[styles.schedulePickerLabel, isDark && { color: 'rgba(255,255,255,0.6)' }, { marginTop: 16 }]}>TIME</Text>
            <View style={[styles.schedulePickerInput, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Clock size={16} color={isDark ? 'rgba(255,255,255,0.4)' : '#888'} />
              <TextInput
                style={[styles.schedulePickerInputText, isDark && { color: '#FFFFFF' }]}
                placeholder="e.g. 14:00"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
                value={scheduleTime}
                onChangeText={setScheduleTime}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveSchedule}
              activeOpacity={0.8}
              style={[styles.schedulePickerSaveOuter, { opacity: selectedDrillIds.length > 0 && scheduleDate.trim() && scheduleTime.trim() ? 1 : 0.5 }]}
            >
              <LinearGradient
                colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.schedulePickerSaveBtn}
              >
                <Text style={styles.schedulePickerSaveText}>Save Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={deleteConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: isDark ? bgColor : '#1A1A1A' }]}>
            <Text style={styles.confirmTitle}>Are you sure?</Text>
            <Text style={styles.confirmMessage}>Delete "{deleteConfirm?.name}"?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNoBtn}
                onPress={() => setDeleteConfirm(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteDrill}
                activeOpacity={0.7}
                style={styles.confirmYesBtnOuter}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmYesBtn}
                >
                  <Text style={styles.confirmYesBtnText}>Yes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Putting: '#2D6A4F',
    Wedges: '#E76F51',
    Irons: '#7B2CBF',
    Woods: '#40916C',
  };
  return map[category] || '#888';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  cardList: {
    gap: 12,
  },
  drillCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  drillCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  drillCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  drillCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,59,48,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  drillCardMeta: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  drillCardCategory: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  drillCardStats: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  drillCardDate: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
  },
  scheduleDrillsBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  scheduleDrillsBtnGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  scheduleDrillsBtnText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  scheduleCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  scheduleCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  scheduleCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  scheduleCardMeta: {
    flexDirection: 'row' as const,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  detailCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
  },
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
  },
  detailValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  detailSubheader: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  confirmCard: {
    width: '100%' as const,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as const,
  },
  confirmNoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  confirmNoBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  confirmYesBtnOuter: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  confirmYesBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  confirmYesBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  schedulePickerContainer: {
    flex: 1,
  },
  schedulePickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  schedulePickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  schedulePickerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  schedulePickerLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  schedulePickerDrill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  schedulePickerDrillInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  schedulePickerDrillName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  schedulePickerCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  schedulePickerCheckActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  schedulePickerInput: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  schedulePickerInputText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  schedulePickerSaveOuter: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  schedulePickerSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  schedulePickerSaveText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
