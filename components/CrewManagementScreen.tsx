import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Search, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SEGMENT_KEYS = ['Create', 'Settings', 'Schedule'] as const;
const COLOR_OPTIONS = [
  '#1A1A1A', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
  '#8B5E3C', '#3A8E56', '#1075E3', '#0F6FAF', '#6B7280',
];

interface CrewManagementScreenProps {
  initialSegment: number;
  onClose: () => void;
}

export default function CrewManagementScreen({ initialSegment, onClose }: CrewManagementScreenProps) {
  const { allUsers, isLoadingAllUsers } = useProfile();
  const [activeSegment, setActiveSegment] = useState<number>(initialSegment);
  const underlineAnim = useRef(new Animated.Value(initialSegment)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [crewName, setCrewName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#1A1A1A');
  const [crewLogo, _setCrewLogo] = useState<string | null>(null);

  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [managerSearch, setManagerSearch] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

  const segmentWidth = (SCREEN_WIDTH - 40) / SEGMENT_KEYS.length;
  const underlineWidth = 40;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      (segmentWidth - underlineWidth) / 2,
      segmentWidth + (segmentWidth - underlineWidth) / 2,
      segmentWidth * 2 + (segmentWidth - underlineWidth) / 2,
    ],
  });

  useEffect(() => {
    underlineAnim.setValue(initialSegment);
    setActiveSegment(initialSegment);
    scrollRef.current?.scrollTo({ x: initialSegment * SCREEN_WIDTH, animated: false });
  }, [initialSegment, underlineAnim]);

  const handleSegmentChange = useCallback((index: number) => {
    setActiveSegment(index);
    Animated.spring(underlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [underlineAnim]);

  const handleScrollEnd = useCallback((e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (page !== activeSegment) {
      setActiveSegment(page);
      Animated.spring(underlineAnim, {
        toValue: page,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeSegment, underlineAnim]);

  const togglePlayer = useCallback((userId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const toggleManager = useCallback((userId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedManagers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const filteredPlayersUsers = allUsers.filter((u) => {
    if (!playerSearch.trim()) return true;
    const q = playerSearch.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const filteredManagerUsers = allUsers.filter((u) => {
    if (!managerSearch.trim()) return true;
    const q = managerSearch.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const renderUserRow = useCallback((user: UserProfile, isSelected: boolean, onToggle: () => void) => {
    const initials = (user.display_name || user.username || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        key={user.id}
        style={styles.userRow}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.display_name || user.username}</Text>
          <Text style={styles.userHandle}>@{user.username}</Text>
        </View>
        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    );
  }, []);

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
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crew Management</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.segmentBar}>
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
                  activeSegment === idx && styles.segmentTextActive,
                ]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View
            style={[
              styles.segmentUnderline,
              {
                width: underlineWidth,
                transform: [{ translateX: underlineTranslateX }],
              },
            ]}
          />
          <View style={styles.segmentDivider} />
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.pagerScroll}
      >
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>✨</Text>
              </View>
              <Text style={styles.emptyTitle}>Create</Text>
              <Text style={styles.emptyText}>
                Create drills, sessions, and training plans for your crew members.
              </Text>
            </View>
          </ScrollView>
        </View>

        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
            <View style={styles.addButtonsRow}>
              <View style={styles.addButtonCol}>
                <TouchableOpacity
                  style={styles.addCircleBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('[CrewMgmt] Add Players pressed');
                  }}
                >
                  <Plus size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.addCircleLabel}>Add Players</Text>
              </View>
              <View style={styles.addButtonCol}>
                <TouchableOpacity
                  style={styles.addCircleBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('[CrewMgmt] Add Manager pressed');
                  }}
                >
                  <Plus size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.addCircleLabel}>Add Manager</Text>
              </View>
            </View>

            {/* Players Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.searchSectionTitle}>Players ({selectedPlayers.length})</Text>
              <View style={styles.searchBar}>
                <Search size={16} color="rgba(0,0,0,0.35)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users..."
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={playerSearch}
                  onChangeText={setPlayerSearch}
                />
                {playerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPlayerSearch('')}>
                    <X size={16} color="rgba(0,0,0,0.35)" />
                  </TouchableOpacity>
                )}
              </View>
              {isLoadingAllUsers ? (
                <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" style={{ marginTop: 20 }} />
              ) : playerSearch.trim().length > 0 ? (
                <View style={styles.userList}>
                  {filteredPlayersUsers.length === 0 ? (
                    <Text style={styles.noResultsText}>No users found</Text>
                  ) : (
                    filteredPlayersUsers.slice(0, 15).map((user) =>
                      renderUserRow(user, selectedPlayers.includes(user.id), () => togglePlayer(user.id))
                    )
                  )}
                </View>
              ) : selectedPlayers.length > 0 ? (
                <View style={styles.userList}>
                  {allUsers.filter((u) => selectedPlayers.includes(u.id)).map((user) =>
                    renderUserRow(user, true, () => togglePlayer(user.id))
                  )}
                </View>
              ) : null}
            </View>

            {/* Managers Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.searchSectionTitle}>Managers ({selectedManagers.length})</Text>
              <View style={styles.searchBar}>
                <Search size={16} color="rgba(0,0,0,0.35)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users..."
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={managerSearch}
                  onChangeText={setManagerSearch}
                />
                {managerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setManagerSearch('')}>
                    <X size={16} color="rgba(0,0,0,0.35)" />
                  </TouchableOpacity>
                )}
              </View>
              {isLoadingAllUsers ? (
                <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" style={{ marginTop: 20 }} />
              ) : managerSearch.trim().length > 0 ? (
                <View style={styles.userList}>
                  {filteredManagerUsers.length === 0 ? (
                    <Text style={styles.noResultsText}>No users found</Text>
                  ) : (
                    filteredManagerUsers.slice(0, 15).map((user) =>
                      renderUserRow(user, selectedManagers.includes(user.id), () => toggleManager(user.id))
                    )
                  )}
                </View>
              ) : selectedManagers.length > 0 ? (
                <View style={styles.userList}>
                  {allUsers.filter((u) => selectedManagers.includes(u.id)).map((user) =>
                    renderUserRow(user, true, () => toggleManager(user.id))
                  )}
                </View>
              ) : null}
            </View>

            <View style={styles.settingsDivider} />

            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardLabel}>Name</Text>
              <TextInput
                style={styles.settingsCardInput}
                placeholder="Enter crew name..."
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={crewName}
                onChangeText={setCrewName}
              />
            </View>

            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSwatchSelected,
                    ]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedColor(color);
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedColor === color && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardLabel}>Logo</Text>
              <TouchableOpacity
                style={styles.logoUploadBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  console.log('[CrewMgmt] Logo upload pressed');
                }}
                activeOpacity={0.7}
              >
                {crewLogo ? (
                  <Image source={{ uri: crewLogo }} style={styles.logoPreview} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Plus size={24} color="rgba(0,0,0,0.3)" />
                    <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
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
        </View>
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
  segmentBar: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  segmentRow: {
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
  pagerScroll: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
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
  addButtonsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 32,
    marginBottom: 28,
  },
  addButtonCol: {
    alignItems: 'center' as const,
    gap: 10,
  },
  addCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addCircleLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
  },
  userList: {
    marginTop: 10,
    gap: 2,
  },
  userRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userAvatarInitials: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#888',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  userHandle: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkCircleActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginVertical: 16,
  },
  settingsCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  settingsCardLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  settingsCardInput: {
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  logoUploadBtn: {
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  logoPreview: {
    width: '100%' as const,
    height: 120,
    borderRadius: 14,
  },
  logoPlaceholder: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  logoPlaceholderText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.3)',
    fontWeight: '600' as const,
  },
});
