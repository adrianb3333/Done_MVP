import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProfile, CrewDrill } from '@/contexts/ProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SEGMENT_KEYS = ['Drill', 'Round', 'Tournament'] as const;
type CreateSegment = typeof SEGMENT_KEYS[number];

const CATEGORIES = [
  { label: 'Putting', color: '#2D6A4F' },
  { label: 'Wedges', color: '#E76F51' },
  { label: 'Irons', color: '#7B2CBF' },
  { label: 'Woods', color: '#40916C' },
];

const ROUNDS_OPTIONS = [1, 2, 3, 4, 5];
const SHOTS_OPTIONS = [5, 7, 10, 12, 15, 20];

interface CrewCreateScreenProps {
  onClose: () => void;
}

export default function CrewCreateScreen({ onClose }: CrewCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const { crewColor, saveCrewDrill } = useProfile();
  const bgColor = crewColor || '#FFFFFF';
  const isDark = bgColor !== '#FFFFFF';
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const [drillName, setDrillName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Putting');
  const [selectedRounds, setSelectedRounds] = useState<number>(3);
  const [selectedShots, setSelectedShots] = useState<number>(10);
  const [acceptedDistances, setAcceptedDistances] = useState<string[]>(['', '', '']);
  const [drillInfo, setDrillInfo] = useState<string>('');

  const segmentWidth = (SCREEN_WIDTH - 40 - 48) / SEGMENT_KEYS.length;
  const underlineWidth = 40;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      48 + (segmentWidth - underlineWidth) / 2,
      48 + segmentWidth + (segmentWidth - underlineWidth) / 2,
      48 + segmentWidth * 2 + (segmentWidth - underlineWidth) / 2,
    ],
  });

  const handleSegmentChange = useCallback((index: number) => {
    setActiveSegment(index);
    Animated.spring(underlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [underlineAnim]);

  const handleRoundsChange = useCallback((rounds: number) => {
    setSelectedRounds(rounds);
    setAcceptedDistances((prev) => {
      const updated = [...prev];
      while (updated.length < rounds) updated.push('');
      return updated.slice(0, rounds);
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDistanceChange = useCallback((index: number, value: string) => {
    setAcceptedDistances((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const totalShots = selectedRounds * selectedShots;

  const handleSaveDrill = useCallback(async () => {
    if (!drillName.trim()) {
      Alert.alert('Missing Name', 'Please enter a drill name.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const drill: CrewDrill = {
      id: Date.now().toString(),
      name: drillName.trim(),
      category: selectedCategory,
      rounds: selectedRounds,
      shotsPerRound: selectedShots,
      totalShots,
      acceptedDistances: acceptedDistances.map((d) => parseFloat(d) || 0),
      info: drillInfo.trim(),
      createdAt: Date.now(),
    };
    try {
      await saveCrewDrill(drill);
      console.log('[CrewCreate] Drill saved:', drill.name);
      Alert.alert('Drill Saved', `"${drill.name}" has been saved to Storage.`);
      setDrillName('');
      setSelectedCategory('Putting');
      setSelectedRounds(3);
      setSelectedShots(10);
      setAcceptedDistances(['', '', '']);
      setDrillInfo('');
    } catch (err: any) {
      console.log('[CrewCreate] Save drill error:', err.message);
      Alert.alert('Error', 'Failed to save drill.');
    }
  }, [drillName, selectedCategory, selectedRounds, selectedShots, totalShots, acceptedDistances, drillInfo, saveCrewDrill]);

  const renderDrillContent = () => {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>DRILL NAME</Text>
          <View style={[styles.inputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.textInput, isDark && { color: '#FFFFFF' }]}
              placeholder="e.g. Long Putts"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              value={drillName}
              onChangeText={setDrillName}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.chip,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.15)' },
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.label);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.chipText, isDark && { color: 'rgba(255,255,255,0.8)' }, isSelected && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>ROUNDS</Text>
          <View style={styles.optionRow}>
            {ROUNDS_OPTIONS.map((val) => {
              const isSelected = selectedRounds === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.optionChip,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.15)' },
                    isSelected && styles.optionChipSelected,
                  ]}
                  onPress={() => handleRoundsChange(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isDark && { color: 'rgba(255,255,255,0.8)' }, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SHOTS PER ROUND</Text>
          <View style={styles.optionRow}>
            {SHOTS_OPTIONS.map((val) => {
              const isSelected = selectedShots === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.optionChip,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.15)' },
                    isSelected && styles.optionChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedShots(val);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isDark && { color: 'rgba(255,255,255,0.8)' }, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>ACCEPTED DISTANCE</Text>
          {acceptedDistances.map((dist, idx) => (
            <View key={idx} style={styles.distanceRow}>
              <Text style={[styles.distanceLabel, isDark && { color: 'rgba(255,255,255,0.6)' }]}>Round {idx + 1}</Text>
              <View style={[styles.distanceInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <TextInput
                  style={[styles.distanceInput, isDark && { color: '#FFFFFF' }]}
                  placeholder="0"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}
                  value={dist}
                  onChangeText={(val) => handleDistanceChange(idx, val)}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                <Text style={[styles.distanceUnit, isDark && { color: 'rgba(255,255,255,0.4)' }]}>m</Text>
              </View>
            </View>
          ))}

          <View style={[styles.previewCard, isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={[styles.previewLabel, isDark && { color: 'rgba(255,255,255,0.5)' }]}>PREVIEW</Text>
            <Text style={[styles.previewText, isDark && { color: '#FFFFFF' }]}>
              {selectedRounds} rounds × {selectedShots} shots = {totalShots} total shots
            </Text>
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>INFO</Text>
          <View style={[styles.infoInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.infoInput, isDark && { color: '#FFFFFF' }]}
              placeholder="Add description or instructions for this drill..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
              value={drillInfo}
              onChangeText={setDrillInfo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={handleSaveDrill}
            activeOpacity={0.8}
            disabled={!drillName.trim()}
            style={[styles.saveDrillBtnOuter, { opacity: drillName.trim() ? 1 : 0.5 }]}
          >
            <View style={[styles.saveDrillBtn, isDark && { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Text style={styles.saveDrillBtnText}>Save Drill</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderEmptyContent = (segment: CreateSegment) => {
    const emojiMap: Record<CreateSegment, string> = {
      Drill: '🎯',
      Round: '⛳',
      Tournament: '🏆',
    };
    const descMap: Record<CreateSegment, string> = {
      Drill: 'Create practice drills and training exercises for your crew.',
      Round: 'Set up a round for your crew members to play together.',
      Tournament: 'Organize tournaments and competitions for your crew.',
    };
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.emptyEmoji}>{emojiMap[segment]}</Text>
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>{segment}</Text>
          <Text style={[styles.emptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{descMap[segment]}</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 10, backgroundColor: bgColor }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.glassBackBtn}
            activeOpacity={0.7}
            testID="crew-create-back"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.segmentRow}>
            {SEGMENT_KEYS.map((seg, idx) => (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentBtn, { width: segmentWidth }]}
                onPress={() => handleSegmentChange(idx)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.segmentText,
                  isDark && { color: 'rgba(255,255,255,0.5)' },
                  activeSegment === idx && styles.segmentTextActive,
                  activeSegment === idx && isDark && { color: '#FFFFFF' },
                ]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.underlineContainer}>
          <Animated.View
            style={[
              styles.segmentUnderline,
              isDark && { backgroundColor: '#FFFFFF' },
              {
                width: underlineWidth,
                transform: [{ translateX: underlineTranslateX }],
              },
            ]}
          />
        </View>
        <View style={[styles.segmentDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      </View>

      {activeSegment === 0 ? renderDrillContent() : renderEmptyContent(SEGMENT_KEYS[activeSegment])}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 4,
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
  segmentRow: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  segmentBtn: {
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  segmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  underlineContainer: {
    paddingHorizontal: 0,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  inputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  optionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionChipSelected: {
    backgroundColor: '#2E7D32',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  distanceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 12,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    width: 70,
  },
  distanceInputWrapper: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  distanceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    paddingVertical: 12,
  },
  distanceUnit: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  previewCard: {
    marginTop: 24,
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  infoInputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  infoInput: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  saveDrillBtnOuter: {
    marginTop: 24,
  },
  saveDrillBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  saveDrillBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
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
});
