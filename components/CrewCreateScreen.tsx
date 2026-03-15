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
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Trash2, X } from 'lucide-react-native';
import { CircleCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProfile, CrewDrill, CrewRound } from '@/contexts/ProfileContext';

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

type HoleOption = '18' | '9_first' | '9_back';

const HOLE_OPTIONS: { key: HoleOption; title: string; subtitle: string }[] = [
  { key: '18', title: '18 holes', subtitle: 'Full round' },
  { key: '9_first', title: 'First 9', subtitle: 'Holes 1-9' },
  { key: '9_back', title: 'Back 9', subtitle: 'Holes 10-18' },
];

export default function CrewCreateScreen({ onClose }: CrewCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const { crewColor, saveCrewDrill, saveCrewRound, crewPlayers, crewManagers, allUsers } = useProfile();
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

  const [roundName, setRoundName] = useState<string>('');
  const [roundGroups, setRoundGroups] = useState<{ id: string; players: (string | null)[] }[]>([
    { id: '1', players: [null, null, null, null] },
  ]);
  const [roundCourseName, setRoundCourseName] = useState<string>('');
  const [roundHoleOption, setRoundHoleOption] = useState<HoleOption>('18');
  const [roundInfo, setRoundInfo] = useState<string>('');
  const [deleteGroupMode, setDeleteGroupMode] = useState<boolean>(false);
  const [selectedGroupsToDelete, setSelectedGroupsToDelete] = useState<string[]>([]);
  const [playerPickerVisible, setPlayerPickerVisible] = useState<boolean>(false);
  const [playerPickerTarget, setPlayerPickerTarget] = useState<{ groupId: string; slotIndex: number } | null>(null);

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

  const crewMemberIds = [...crewPlayers, ...crewManagers];
  const crewMemberProfiles = allUsers.filter((u) => crewMemberIds.includes(u.id));

  const handleAddGroup = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newId = (roundGroups.length + 1).toString() + '_' + Date.now();
    setRoundGroups((prev) => [...prev, { id: newId, players: [null, null, null, null] }]);
  }, [roundGroups.length]);

  const handleToggleDeleteGroup = useCallback((groupId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGroupsToDelete((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const handleConfirmDeleteGroups = useCallback(() => {
    if (selectedGroupsToDelete.length === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRoundGroups((prev) => {
      const filtered = prev.filter((g) => !selectedGroupsToDelete.includes(g.id));
      return filtered.length === 0 ? [{ id: '1', players: [null, null, null, null] }] : filtered;
    });
    setSelectedGroupsToDelete([]);
    setDeleteGroupMode(false);
  }, [selectedGroupsToDelete]);

  const handleOpenPlayerPicker = useCallback((groupId: string, slotIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerPickerTarget({ groupId, slotIndex });
    setPlayerPickerVisible(true);
  }, []);

  const handleSelectPlayer = useCallback((playerId: string) => {
    if (!playerPickerTarget) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRoundGroups((prev) =>
      prev.map((g) => {
        if (g.id !== playerPickerTarget.groupId) return g;
        const updated = [...g.players];
        updated[playerPickerTarget.slotIndex] = playerId;
        return { ...g, players: updated };
      })
    );
    setPlayerPickerVisible(false);
    setPlayerPickerTarget(null);
  }, [playerPickerTarget]);

  const handleRemovePlayerFromSlot = useCallback((groupId: string, slotIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoundGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updated = [...g.players];
        updated[slotIndex] = null;
        return { ...g, players: updated };
      })
    );
  }, []);

  const handleSaveRound = useCallback(async () => {
    if (!roundName.trim()) {
      Alert.alert('Missing Name', 'Please enter a round name.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const round: CrewRound = {
      id: Date.now().toString(),
      name: roundName.trim(),
      groups: roundGroups.map((g, idx) => ({
        id: (idx + 1).toString(),
        players: g.players.filter((p): p is string => p !== null),
      })),
      courseName: roundCourseName.trim(),
      holeOption: roundHoleOption,
      info: roundInfo.trim(),
      createdAt: Date.now(),
    };
    try {
      await saveCrewRound(round);
      console.log('[CrewCreate] Round saved:', round.name);
      Alert.alert('Round Saved', `"${round.name}" has been saved to Storage.`);
      setRoundName('');
      setRoundGroups([{ id: '1', players: [null, null, null, null] }]);
      setRoundCourseName('');
      setRoundHoleOption('18');
      setRoundInfo('');
    } catch (err: any) {
      console.log('[CrewCreate] Save round error:', err.message);
      Alert.alert('Error', 'Failed to save round.');
    }
  }, [roundName, roundGroups, roundCourseName, roundHoleOption, roundInfo, saveCrewRound]);

  const getPlayerName = useCallback((playerId: string) => {
    const user = allUsers.find((u) => u.id === playerId);
    return user?.display_name || user?.username || 'Unknown';
  }, [allUsers]);

  const getPlayerAvatar = useCallback((playerId: string) => {
    const user = allUsers.find((u) => u.id === playerId);
    return user?.avatar_url || null;
  }, [allUsers]);

  const allAssignedPlayers = roundGroups.flatMap((g) => g.players.filter((p): p is string => p !== null));

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

  const renderRoundContent = () => {
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
          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }, { marginTop: 4 }]}>NAME</Text>
          <View style={[styles.inputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.textInput, isDark && { color: '#FFFFFF' }]}
              placeholder="e.g. Saturday Round"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              value={roundName}
              onChangeText={setRoundName}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT PLAYERS</Text>

          {roundGroups.map((group, groupIdx) => {
            const isSelectedForDelete = selectedGroupsToDelete.includes(group.id);
            return (
              <View
                key={group.id}
                style={[
                  styles.groupCard,
                  isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                  deleteGroupMode && isSelectedForDelete && { borderColor: '#FF3B30', borderWidth: 2 },
                ]}
              >
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupHeaderText, isDark && { color: '#FFFFFF' }]}>Group {groupIdx + 1}</Text>
                  {deleteGroupMode && roundGroups.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleToggleDeleteGroup(group.id)}
                      style={[styles.groupDeleteCheck, isSelectedForDelete && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}
                    >
                      {isSelectedForDelete && <CircleCheck size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.groupSlots}>
                  {group.players.map((playerId, slotIdx) => (
                    <View key={slotIdx} style={styles.roundSlot}>
                      {playerId ? (
                        <View style={[styles.roundPlayerSlot, isDark && { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                          {getPlayerAvatar(playerId) ? (
                            <Image source={{ uri: getPlayerAvatar(playerId)! }} style={styles.roundAvatar} />
                          ) : (
                            <View style={styles.roundAvatarPlaceholder}>
                              <Text style={styles.roundAvatarInitial}>
                                {getPlayerName(playerId).charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.roundPlayerName, isDark && { color: '#FFFFFF' }]} numberOfLines={1}>
                            {getPlayerName(playerId)}
                          </Text>
                          <TouchableOpacity
                            style={styles.roundRemoveBtn}
                            onPress={() => handleRemovePlayerFromSlot(group.id, slotIdx)}
                          >
                            <X size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.roundAddSlot, isDark && { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)' }]}
                          onPress={() => handleOpenPlayerPicker(group.id, slotIdx)}
                          activeOpacity={0.7}
                        >
                          <Plus size={18} color={isDark ? '#FFFFFF' : '#999'} />
                          <Text style={[styles.roundAddSlotText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={styles.groupActions}>
            <TouchableOpacity
              style={[styles.groupActionBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
              onPress={handleAddGroup}
              activeOpacity={0.7}
            >
              <Plus size={20} color={isDark ? '#FFFFFF' : '#333'} />
            </TouchableOpacity>
            {roundGroups.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.groupActionBtn,
                  isDark && { backgroundColor: 'rgba(255,255,255,0.12)' },
                  deleteGroupMode && { backgroundColor: '#FF3B30' },
                ]}
                onPress={() => {
                  if (deleteGroupMode) {
                    handleConfirmDeleteGroups();
                  } else {
                    setDeleteGroupMode(true);
                    setSelectedGroupsToDelete([]);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                }}
                activeOpacity={0.7}
              >
                {deleteGroupMode ? (
                  <CircleCheck size={20} color="#FFFFFF" />
                ) : (
                  <Trash2 size={20} color={isDark ? '#FFFFFF' : '#333'} />
                )}
              </TouchableOpacity>
            )}
            {deleteGroupMode && (
              <TouchableOpacity
                style={[styles.groupActionBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
                onPress={() => {
                  setDeleteGroupMode(false);
                  setSelectedGroupsToDelete([]);
                }}
                activeOpacity={0.7}
              >
                <X size={20} color={isDark ? '#FFFFFF' : '#333'} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT COURSE</Text>
          <View style={[styles.roundCourseBanner, isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}>
            <View style={styles.roundCourseInner}>
              {roundCourseName ? (
                <View style={styles.roundCourseSelected}>
                  <Text style={[styles.roundCourseName, isDark && { color: '#FFFFFF' }]}>{roundCourseName}</Text>
                  <TouchableOpacity onPress={() => setRoundCourseName('')}>
                    <X size={18} color={isDark ? 'rgba(255,255,255,0.5)' : '#999'} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[styles.roundCourseInput, isDark && { color: '#FFFFFF' }]}
                  placeholder="Type course name..."
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
                  value={roundCourseName}
                  onChangeText={setRoundCourseName}
                  returnKeyType="done"
                />
              )}
            </View>
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>SELECT HOLES</Text>
          <View style={styles.holeOptionsContainer}>
            {HOLE_OPTIONS.map((opt) => {
              const isActive = roundHoleOption === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.holeOptionCard,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
                    isActive && styles.holeOptionCardActive,
                    isActive && isDark && { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)' },
                  ]}
                  onPress={() => {
                    setRoundHoleOption(opt.key);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.holeOptionContent}>
                    <Text style={[
                      styles.holeOptionTitle,
                      isDark && { color: '#FFFFFF' },
                    ]}>
                      {opt.title}
                    </Text>
                    <Text style={[
                      styles.holeOptionSubtitle,
                      isDark && { color: 'rgba(255,255,255,0.5)' },
                    ]}>
                      {opt.subtitle}
                    </Text>
                  </View>
                  {isActive && <CircleCheck size={22} color={isDark ? '#FFFFFF' : '#2E7D32'} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>INFO</Text>
          <View style={[styles.infoInputWrapper, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <TextInput
              style={[styles.infoInput, isDark && { color: '#FFFFFF' }]}
              placeholder="Add details about this round..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
              value={roundInfo}
              onChangeText={setRoundInfo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={handleSaveRound}
            activeOpacity={0.8}
            disabled={!roundName.trim()}
            style={[styles.saveDrillBtnOuter, { opacity: roundName.trim() ? 1 : 0.5 }]}
          >
            <View style={[styles.saveDrillBtn, isDark && { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Text style={styles.saveDrillBtnText}>Save Round</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={playerPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPlayerPickerVisible(false)}
        >
          <View style={styles.playerPickerOverlay}>
            <View style={[styles.playerPickerCard, { backgroundColor: isDark ? bgColor : '#FFFFFF' }]}>
              <View style={styles.playerPickerHeader}>
                <Text style={[styles.playerPickerTitle, isDark && { color: '#FFFFFF' }]}>Select Player</Text>
                <TouchableOpacity onPress={() => setPlayerPickerVisible(false)}>
                  <X size={22} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.playerPickerList} showsVerticalScrollIndicator={false}>
                {crewMemberProfiles.length === 0 ? (
                  <View style={styles.playerPickerEmpty}>
                    <Text style={[styles.playerPickerEmptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                      No crew members added yet. Add players in Crew Settings.
                    </Text>
                  </View>
                ) : (
                  crewMemberProfiles.map((user) => {
                    const isAlreadyAssigned = allAssignedPlayers.includes(user.id);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.playerPickerItem,
                          isDark && { backgroundColor: 'rgba(255,255,255,0.08)' },
                          isAlreadyAssigned && { opacity: 0.4 },
                        ]}
                        onPress={() => !isAlreadyAssigned && handleSelectPlayer(user.id)}
                        activeOpacity={isAlreadyAssigned ? 1 : 0.7}
                        disabled={isAlreadyAssigned}
                      >
                        {user.avatar_url ? (
                          <Image source={{ uri: user.avatar_url }} style={styles.playerPickerAvatar} />
                        ) : (
                          <View style={styles.playerPickerAvatarPlaceholder}>
                            <Text style={styles.playerPickerAvatarInitial}>
                              {(user.display_name || user.username).charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.playerPickerName, isDark && { color: '#FFFFFF' }]}>
                          {user.display_name || user.username}
                        </Text>
                        {isAlreadyAssigned && (
                          <Text style={[styles.playerPickerAssigned, isDark && { color: 'rgba(255,255,255,0.3)' }]}>Assigned</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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

      {activeSegment === 0 && renderDrillContent()}
      {activeSegment === 1 && renderRoundContent()}
      {activeSegment === 2 && renderEmptyContent('Tournament')}
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
  groupCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  groupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupHeaderText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  groupDeleteCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  groupSlots: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 10,
    gap: 8,
  },
  roundSlot: {
    width: '47%' as any,
    minHeight: 70,
  },
  roundPlayerSlot: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 10,
    minHeight: 70,
    position: 'relative' as const,
  },
  roundAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  roundAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundAvatarInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  roundPlayerName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  roundRemoveBtn: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e53935',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundAddSlot: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 70,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  roundAddSlotText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600' as const,
  },
  groupActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 8,
  },
  groupActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundCourseBanner: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    overflow: 'hidden' as const,
  },
  roundCourseInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roundCourseSelected: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  roundCourseName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  roundCourseInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    padding: 0,
  },
  holeOptionsContainer: {
    gap: 10,
  },
  holeOptionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  holeOptionCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(46,125,50,0.06)',
  },
  holeOptionContent: {
    flex: 1,
  },
  holeOptionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  holeOptionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  playerPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  playerPickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%' as any,
    paddingBottom: 40,
  },
  playerPickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  playerPickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  playerPickerList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  playerPickerEmpty: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  playerPickerEmptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
  },
  playerPickerItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  playerPickerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playerPickerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  playerPickerAvatarInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  playerPickerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  playerPickerAssigned: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#BBB',
  },
});
