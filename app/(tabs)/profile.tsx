import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Dimensions,

} from 'react-native';
import { useRouter } from 'expo-router';
import { HelpCircle, X, User, Newspaper, Bluetooth, Trophy, QrCode, Swords, Clock, Target, Zap, Hash, Menu, BarChart2, ChevronRight, Share2, Settings, Camera, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const PROFILE_HEADER_HEIGHT = 56;
import * as Haptics from 'expo-haptics';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { useAppNavigation } from '@/contexts/AppNavigationContext';

import ProfileCard from '@/components/ProfileCard';
import { supabase } from '@/lib/supabase';
import { useScrollHeader } from '@/hooks/useScrollHeader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DrillEntry {
  id: string;
  drill_name: string;
  score: number | null;
  created_at: string;
  user_id: string;
}

function usePracticeCardData() {
  const [loading, setLoading] = useState<boolean>(true);
  const [drillCount, setDrillCount] = useState<number>(0);
  const [latestDrill, setLatestDrill] = useState<{ drill_name: string; score: number | null; created_at: string } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { count, error: countErr } = await supabase
          .from('golf_drills')
          .select('*', { count: 'exact', head: true });
        if (countErr) console.log('[PracticeCard] count error:', countErr.message);
        setDrillCount(count || 0);

        const { data, error } = await supabase
          .from('golf_drills')
          .select('drill_name, score, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          console.log('[PracticeCard] fetch error:', error.message);
        } else {
          setLatestDrill(data);
        }
      } catch (e: any) {
        console.log('[PracticeCard] error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  return { loading, drillCount, latestDrill };
}

function PracticeCardContent() {
  const { loading, drillCount, latestDrill } = usePracticeCardData();

  if (loading) {
    return (
      <View style={practiceCardStyles.centered}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  const dateString = latestDrill?.created_at
    ? new Date(latestDrill.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={practiceCardStyles.content}>
      {latestDrill ? (
        <View style={practiceCardStyles.innerRow}>
          <View style={practiceCardStyles.left}>
            <Text style={practiceCardStyles.drillName}>{latestDrill.drill_name}</Text>
            <Text style={practiceCardStyles.date}>{dateString}</Text>
            <Text style={practiceCardStyles.count}>{drillCount} drills total</Text>
          </View>
          <Text style={practiceCardStyles.score}>{latestDrill.score ?? '-'}</Text>
        </View>
      ) : (
        <Text style={practiceCardStyles.empty}>No practice yet</Text>
      )}
    </View>
  );
}

const practiceCardStyles = StyleSheet.create({
  centered: {
    paddingVertical: 30,
    alignItems: 'center' as const,
  },
  content: {
    flex: 1,
  },
  innerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  left: {
    flex: 1,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  count: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  score: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  empty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
});

function PracticePopupContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [drills, setDrills] = useState<DrillEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { count, error: countErr } = await supabase
          .from('golf_drills')
          .select('*', { count: 'exact', head: true });
        if (countErr) console.log('[PracticePopup] count error:', countErr.message);
        setTotalCount(count || 0);

        const { data, error } = await supabase
          .from('golf_drills')
          .select('id, drill_name, score, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) {
          console.log('[PracticePopup] fetch error:', error.message);
        } else {
          setDrills((data as DrillEntry[]) || []);
        }
      } catch (e: any) {
        console.log('[PracticePopup] error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  if (loading) {
    return (
      <View style={practiceStyles.centered}>
        <ActivityIndicator size="small" color="#1DB954" />
      </View>
    );
  }

  if (drills.length === 0) {
    return (
      <View style={practiceStyles.centered}>
        <Text style={practiceStyles.emptyText}>No practice sessions recorded yet</Text>
      </View>
    );
  }

  const latestDrill = drills[0];
  const latestDate = new Date(latestDrill.created_at);
  const sessionDrills = drills.filter(
    (d) => new Date(d.created_at).toDateString() === latestDate.toDateString()
  );
  const uniqueDrillNames = [...new Set(sessionDrills.map((d) => d.drill_name))];
  const scores = sessionDrills.filter((d) => d.score !== null).map((d) => d.score as number);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const worstScore = scores.length > 0 ? Math.min(...scores) : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const firstDrillTime = sessionDrills.length > 0 ? new Date(sessionDrills[sessionDrills.length - 1].created_at) : null;
  const lastDrillTime = sessionDrills.length > 0 ? new Date(sessionDrills[0].created_at) : null;
  let durationStr = '-';
  if (firstDrillTime && lastDrillTime) {
    const diffMs = lastDrillTime.getTime() - firstDrillTime.getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) {
      durationStr = `${Math.max(mins, 1)} min`;
    } else {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      durationStr = `${h}h ${m}m`;
    }
  }

  return (
    <View style={practiceStyles.wrapper}>
      <View style={practiceStyles.overviewCard}>
        <Text style={practiceStyles.overviewDate}>{formatDate(latestDrill.created_at)}</Text>
        <Text style={practiceStyles.overviewTime}>Started {formatTime(sessionDrills[sessionDrills.length - 1]?.created_at || latestDrill.created_at)}</Text>
      </View>

      <View style={practiceStyles.statsGrid}>
        <View style={practiceStyles.statBox}>
          <Clock size={16} color="#1DB954" />
          <Text style={practiceStyles.statValue}>{durationStr}</Text>
          <Text style={practiceStyles.statLabel}>Duration</Text>
        </View>
        <View style={practiceStyles.statBox}>
          <Hash size={16} color="#4FC3F7" />
          <Text style={practiceStyles.statValue}>{sessionDrills.length}</Text>
          <Text style={practiceStyles.statLabel}>Drills</Text>
        </View>
        <View style={practiceStyles.statBox}>
          <Target size={16} color="#FFB74D" />
          <Text style={practiceStyles.statValue}>{avgScore}</Text>
          <Text style={practiceStyles.statLabel}>Avg Score</Text>
        </View>
        <View style={practiceStyles.statBox}>
          <Zap size={16} color="#E040FB" />
          <Text style={practiceStyles.statValue}>{uniqueDrillNames.length}</Text>
          <Text style={practiceStyles.statLabel}>Drill Types</Text>
        </View>
      </View>

      {bestScore !== null && (
        <View style={practiceStyles.highlightsRow}>
          <View style={[practiceStyles.highlightBox, { borderColor: '#1DB95430' }]}>
            <Text style={practiceStyles.highlightLabel}>Best</Text>
            <Text style={[practiceStyles.highlightValue, { color: '#1DB954' }]}>{bestScore}</Text>
          </View>
          <View style={[practiceStyles.highlightBox, { borderColor: '#FF525230' }]}>
            <Text style={practiceStyles.highlightLabel}>Worst</Text>
            <Text style={[practiceStyles.highlightValue, { color: '#FF5252' }]}>{worstScore}</Text>
          </View>
        </View>
      )}

      <View style={practiceStyles.drillTypesSection}>
        <Text style={practiceStyles.sectionTitle}>Drill Types Performed</Text>
        {uniqueDrillNames.map((name, idx) => {
          const drillsOfType = sessionDrills.filter((d) => d.drill_name === name);
          const typeScores = drillsOfType.filter((d) => d.score !== null).map((d) => d.score as number);
          const typeAvg = typeScores.length > 0 ? (typeScores.reduce((a, b) => a + b, 0) / typeScores.length).toFixed(1) : '-';
          return (
            <View key={idx} style={practiceStyles.drillTypeRow}>
              <View style={practiceStyles.drillTypeDot} />
              <View style={practiceStyles.drillTypeInfo}>
                <Text style={practiceStyles.drillTypeName}>{name}</Text>
                <Text style={practiceStyles.drillTypeMeta}>{drillsOfType.length} reps · avg {typeAvg}</Text>
              </View>
              {typeScores.length > 0 && (
                <Text style={practiceStyles.drillTypeBest}>{Math.max(...typeScores)}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={practiceStyles.allDrillsSection}>
        <Text style={practiceStyles.sectionTitle}>All Drills ({sessionDrills.length})</Text>
        {sessionDrills.map((drill, idx) => (
          <View key={drill.id || idx} style={practiceStyles.drillRow}>
            <View style={practiceStyles.drillRowLeft}>
              <Text style={practiceStyles.drillRowName}>{drill.drill_name}</Text>
              <Text style={practiceStyles.drillRowTime}>{formatTime(drill.created_at)}</Text>
            </View>
            <Text style={[
              practiceStyles.drillRowScore,
              drill.score !== null && drill.score === bestScore && { color: '#1DB954' },
            ]}>
              {drill.score ?? '-'}
            </Text>
          </View>
        ))}
      </View>

      <View style={practiceStyles.totalSection}>
        <Text style={practiceStyles.totalLabel}>Total Drills Recorded</Text>
        <Text style={practiceStyles.totalValue}>{totalCount}</Text>
      </View>
    </View>
  );
}

const practiceStyles = StyleSheet.create({
  wrapper: {
    paddingBottom: 30,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 15,
    color: '#555',
  },
  overviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  overviewDate: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  overviewTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '47%' as any,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  highlightsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 24,
    fontWeight: '900' as const,
  },
  drillTypesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 12,
  },
  drillTypeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  drillTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
    marginRight: 12,
  },
  drillTypeInfo: {
    flex: 1,
  },
  drillTypeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },
  drillTypeMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  drillTypeBest: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#D4AF37',
  },
  allDrillsSection: {
    marginBottom: 20,
  },
  drillRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  drillRowLeft: {
    flex: 1,
  },
  drillRowName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },
  drillRowTime: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  drillRowScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  totalSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#1DB95420',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#1DB954',
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    followers,
    following,
    followersCount,
    followingCount,
    toggleFollow,
    isTogglingFollow,
    isFollowing,
    allUsers,
    isLoadingAllUsers,
  } = useProfile();

  const { lastRound } = useSession();
  const { openSidebar, navigateTo } = useAppNavigation();
  const insets = useSafeAreaInsets();

  const [followsModalVisible, setFollowsModalVisible] = useState<boolean>(false);
  const [followsTab, setFollowsTab] = useState<'hitta' | 'followers' | 'following'>('hitta');
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState<boolean>(false);
  const [lastRoundPopupVisible, setLastRoundPopupVisible] = useState<boolean>(false);
  const [lastPracticePopupVisible, setLastPracticePopupVisible] = useState<boolean>(false);
  const [profileCardUser, setProfileCardUser] = useState<UserProfile | null>(null);
  const [profileCardVisible, setProfileCardVisible] = useState<boolean>(false);
  const [helpMenuVisible, setHelpMenuVisible] = useState<boolean>(false);
  const helpMenuAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const randomHcp = useRef((Math.random() * 20 + 5).toFixed(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleAvatarPress = useCallback(() => {
    console.log('[Profile] Opening avatar preview');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAvatarPreviewVisible(true);
  }, []);

  const openFollowsModal = useCallback((tab: 'hitta' | 'followers' | 'following') => {
    console.log('[Profile] Opening follows modal, tab:', tab);
    setFollowsTab(tab);
    setFollowsModalVisible(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleToggleFollow = useCallback(async (targetUserId: string) => {
    console.log('[Profile] Toggle follow:', targetUserId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleFollow(targetUserId);
    } catch (err: any) {
      console.error('[Profile] Toggle follow error:', err.message);
    }
  }, [toggleFollow]);

  const openProfileCard = useCallback((user: UserProfile) => {
    console.log('[Profile] Opening profile card for:', user.username);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileCardUser(user);
    setProfileCardVisible(true);
  }, []);

  const renderFollowUser = useCallback(({ item }: { item: UserProfile }) => {
    const amFollowing = isFollowing(item.id);
    return (
      <View style={styles.followUserRow}>
        <TouchableOpacity
          style={styles.followUserLeft}
          onPress={() => openProfileCard(item)}
          activeOpacity={0.7}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.followUserAvatar} />
          ) : (
            <View style={styles.followUserAvatarPlaceholder}>
              <User size={20} color="#666" />
            </View>
          )}
          <View style={styles.followUserInfo}>
            <Text style={styles.followUserName} numberOfLines={1}>{item.display_name || item.username || 'Användare'}</Text>
            <Text style={styles.followUserUsername} numberOfLines={1}>@{item.username}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, amFollowing && styles.followBtnFollowing]}
          onPress={() => handleToggleFollow(item.id)}
          disabled={isTogglingFollow}
          activeOpacity={0.7}
        >
          <Text style={[styles.followBtnText, amFollowing && styles.followBtnTextFollowing]}>
            {amFollowing ? 'Följer' : 'Följ'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isFollowing, handleToggleFollow, isTogglingFollow, openProfileCard]);

  const getModalTitle = useCallback(() => {
    if (followsTab === 'hitta') return 'Hitta';
    if (followsTab === 'followers') return 'Följare';
    return 'Följer';
  }, [followsTab]);

  const getListData = useCallback(() => {
    if (followsTab === 'hitta') return allUsers;
    if (followsTab === 'followers') return followers;
    return following;
  }, [followsTab, allUsers, followers, following]);

  const getEmptyText = useCallback(() => {
    if (followsTab === 'hitta') return 'Inga användare hittades';
    if (followsTab === 'followers') return 'Inga följare ännu';
    return 'Följer ingen ännu';
  }, [followsTab]);

  const initials = (profile?.display_name || profile?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getToParDisplay = () => {
    if (!lastRound) return '';
    const diff = lastRound.totalScore - lastRound.totalPar;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const getToParColor = () => {
    if (!lastRound) return '#888';
    const diff = lastRound.totalScore - lastRound.totalPar;
    if (diff < 0) return '#3D954D';
    if (diff === 0) return '#3D954D';
    return '#FF5252';
  };

  const toggleHelpMenu = useCallback(() => {
    const toValue = helpMenuVisible ? 0 : 1;
    Animated.spring(helpMenuAnim, {
      toValue,
      friction: 12,
      tension: 60,
      useNativeDriver: true,
    }).start();
    setHelpMenuVisible(!helpMenuVisible);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [helpMenuVisible, helpMenuAnim]);

  const { headerTranslateY, onScroll: onHeaderScroll } = useScrollHeader(56);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerAbsolute, { transform: [{ translateY: headerTranslateY }] }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={openSidebar}
            style={styles.hamburgerBtn}
            activeOpacity={0.7}
            testID="hamburger-menu"
          >
            <Menu size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/recap-modal' as any);
              }}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              testID="weekly-summary-button"
            >
              <Image source={require('@/assets/images/coach-icon.png')} style={styles.coachHeaderIcon} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleHelpMenu}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              testID="help-menu-button"
            >
              <HelpCircle size={22} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </Animated.View>

      {helpMenuVisible && (
        <Animated.View style={[
          styles.helpMenuOverlay,
          { paddingTop: insets.top + PROFILE_HEADER_HEIGHT + 4, opacity: helpMenuAnim, transform: [{ scale: helpMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
        ]}>
          <TouchableOpacity style={styles.helpMenuBackdrop} activeOpacity={1} onPress={toggleHelpMenu} />
          <View style={styles.helpMenu}>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); router.push('/settings/settings1' as any); }}
              activeOpacity={0.7}
            >
              <Settings size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); router.push('/modals/news-modal' as any); }}
              activeOpacity={0.7}
            >
              <Newspaper size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>News</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); router.push('/modals/pair-impact-modal' as any); }}
              activeOpacity={0.7}
            >
              <Bluetooth size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Pair Sensors</Text>
            </TouchableOpacity>
            <View style={styles.helpMenuDivider} />
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); router.push('/modals/notifications-modal' as any); }}
              activeOpacity={0.7}
            >
              <Bell size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Friends</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView style={[styles.scrollView, { paddingTop: insets.top + PROFILE_HEADER_HEIGHT }]} showsVerticalScrollIndicator={false} onScroll={onHeaderScroll} scrollEventThrottle={16}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

          <View style={styles.profileTopSection}>
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                style={styles.avatarTouchable}
                activeOpacity={0.8}
                testID="avatar-button"
              >
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.followRow}>
                <TouchableOpacity
                  style={styles.followStatBtn}
                  onPress={() => openFollowsModal('followers')}
                  activeOpacity={0.7}
                  testID="followers-button"
                >
                  <Text style={styles.followStatNumber}>{followersCount}</Text>
                  <Text style={styles.followStatLabel}>följare</Text>
                </TouchableOpacity>
                <View style={styles.followDivider} />
                <TouchableOpacity
                  style={styles.followStatBtn}
                  onPress={() => openFollowsModal('following')}
                  activeOpacity={0.7}
                  testID="following-button"
                >
                  <Text style={styles.followStatNumber}>{followingCount}</Text>
                  <Text style={styles.followStatLabel}>följer</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionGrid}>
              <View style={styles.actionGridRow}>
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/modals/handicap-modal' as any);
                  }}
                  activeOpacity={0.8}
                  testID="handicap-button"
                  style={styles.handicapGradientBtn}
                >
                  <LinearGradient
                    colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.handicapGradientInner}
                  >
                    <Text style={styles.handicapBoldText}>{randomHcp}</Text>
                    <Image
                      source={require('@/assets/images/sgf-icon.png')}
                      style={styles.handicapSgfIcon}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridBtn}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/modals/qr-modal' as any);
                  }}
                  activeOpacity={0.8}
                  testID="qr-button"
                >
                  <QrCode size={16} color="#EFEFEF" />
                  <Text style={styles.gridBtnLabel}>QR</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actionGridRow}>
                <TouchableOpacity
                  style={styles.gridBtn}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigateTo('data-overview', { initialTab: 'video' });
                  }}
                  activeOpacity={0.8}
                  testID="camera-button"
                >
                  <Camera size={16} color="#4FC3F7" />
                  <Text style={styles.gridBtnLabel}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gridBtn, styles.gridBtnCompare]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/modals/compare-modal' as any);
                  }}
                  activeOpacity={0.8}
                  testID="compare-button"
                >
                  <Swords size={16} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.liveSection}>
            <Text style={styles.liveSectionTitle}>LIVE</Text>
            <View style={styles.liveCard}>
              <View style={styles.liveEmptyState}>
                <View style={styles.liveDot} />
                <Text style={styles.liveEmptyText}>No friends playing right now</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardsColumn}>
            <View>
              <Text style={styles.cardSectionHeader}>Last Round</Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLastRoundPopupVisible(true);
                }}
                activeOpacity={0.8}
                style={styles.roundCardOuter}
              >
                <LinearGradient
                  colors={['#4BA35B', '#3D954D', '#2D803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.roundCardGradient}
                >
                  {lastRound ? (
                    <View style={styles.gradientCardContent}>
                      <View style={styles.gradientCardTop}>
                        <Text style={styles.gradientCardToParBadge}>{getToParDisplay()}</Text>
                      </View>
                      <View style={styles.gradientCardInnerRow}>
                        <View style={styles.gradientCardLeft}>
                          <Text style={styles.gradientCardCourse} numberOfLines={1}>{lastRound.courseName}</Text>
                          <Text style={styles.gradientCardDate}>{lastRound.roundDate}</Text>
                          <Text style={styles.gradientCardHoles}>{lastRound.holesPlayed} holes</Text>
                        </View>
                        <Text style={styles.gradientCardScore}>{lastRound.totalScore}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.gradientCardContent}>
                      <Text style={styles.gradientCardEmpty}>No rounds yet</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.cardSectionHeader}>Last Practice</Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLastPracticePopupVisible(true);
                }}
                activeOpacity={0.8}
                style={styles.practiceCardOuter}
              >
                <LinearGradient
                  colors={['#1C8CFF', '#1075E3', '#0059B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.practiceCardGradient}
                >
                  <PracticeCardContent />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View>
            <Text style={styles.cardSectionHeader}>Tour</Text>
            <TouchableOpacity
              style={styles.tourCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigateTo('community');
              }}
              activeOpacity={0.8}
              testID="tour-card"
            >
              <View style={styles.tourCardHeader}>
                <View style={styles.tourCardTitleRow}>
                  <Trophy size={16} color="#FFB74D" />
                </View>
                <ChevronRight size={16} color="#999" />
              </View>
              <View style={styles.tourDataGrid}>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>4</Text>
                  <Text style={styles.tourDataLabel}>Events Played</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>2</Text>
                  <Text style={styles.tourDataLabel}>Placements</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>8,500</Text>
                  <Text style={styles.tourDataLabel}>Earnings</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>#12</Text>
                  <Text style={styles.tourDataLabel}>Rank</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue} numberOfLines={1}>Bro Hof</Text>
                  <Text style={styles.tourDataLabel}>Home Course</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>24</Text>
                  <Text style={styles.tourDataLabel}>Age</Text>
                </View>
              </View>
            </TouchableOpacity>
            </View>

            <View>
            <Text style={styles.cardSectionHeader}>Affiliate</Text>
            <TouchableOpacity
              style={styles.affiliateCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigateTo('community', { communityTab: 'affiliate' });
              }}
              activeOpacity={0.8}
              testID="affiliate-card"
            >
              <View style={styles.affiliateCardHeader}>
                <View style={styles.affiliateCardTitleRow}>
                  <Share2 size={16} color="#4FC3F7" />
                </View>
                <ChevronRight size={16} color="#999" />
              </View>
              <View style={styles.tourDataGrid}>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>19</Text>
                  <Text style={styles.tourDataLabel}>Referrals</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>100</Text>
                  <Text style={styles.tourDataLabel}>Goal</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue} numberOfLines={1}>5 Rounds</Text>
                  <Text style={styles.tourDataLabel}>Next Perk</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>2,400</Text>
                  <Text style={styles.tourDataLabel}>Earnings</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>3</Text>
                  <Text style={styles.tourDataLabel}>Perks Won</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <Text style={styles.tourDataValue}>19%</Text>
                  <Text style={styles.tourDataLabel}>Progress</Text>
                </View>
              </View>
            </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Avatar Preview Modal */}
      <Modal
        visible={avatarPreviewVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAvatarPreviewVisible(false)}
      >
        <View style={styles.avatarPreviewOverlay}>
          <TouchableOpacity
            style={styles.avatarPreviewClose}
            onPress={() => setAvatarPreviewVisible(false)}
            activeOpacity={0.7}
          >
            <X size={26} color="#fff" />
          </TouchableOpacity>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatarPreviewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.avatarPreviewPlaceholder}>
              <Text style={styles.avatarPreviewInitials}>{initials}</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Follows Modal - almost full screen */}
      <Modal
        visible={followsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFollowsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.followsSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={() => setFollowsModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabBtn, followsTab === 'hitta' && styles.tabBtnActive]}
                onPress={() => setFollowsTab('hitta')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, followsTab === 'hitta' && styles.tabBtnTextActive]}>
                  Hitta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, followsTab === 'followers' && styles.tabBtnActive]}
                onPress={() => setFollowsTab('followers')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, followsTab === 'followers' && styles.tabBtnTextActive]}>
                  Följare ({followersCount})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, followsTab === 'following' && styles.tabBtnActive]}
                onPress={() => setFollowsTab('following')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, followsTab === 'following' && styles.tabBtnTextActive]}>
                  Följer ({followingCount})
                </Text>
              </TouchableOpacity>
            </View>

            {followsTab === 'hitta' && isLoadingAllUsers ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#1DB954" />
              </View>
            ) : (
              <FlatList
                data={getListData()}
                keyExtractor={(item) => item.id}
                renderItem={renderFollowUser}
                contentContainerStyle={styles.followsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{getEmptyText()}</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Last Round Popup */}
      <Modal
        visible={lastRoundPopupVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLastRoundPopupVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupSheet}>
            <View style={styles.popupHeader}>
              <TouchableOpacity
                onPress={() => setLastRoundPopupVisible(false)}
                style={styles.popupCloseBtn}
                activeOpacity={0.7}
              >
                <X size={22} color="#999" />
              </TouchableOpacity>
              <Text style={styles.popupTitle}>Last Round</Text>
              <TouchableOpacity
                style={styles.popupStatsBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLastRoundPopupVisible(false);
                  navigateTo('data-overview', { initialTab: 'stats', initialStatsSegment: 'round' });
                }}
                activeOpacity={0.7}
                testID="round-stats-button"
              >
                <BarChart2 size={14} color="#4FC3F7" />
                <Text style={styles.popupStatsBtnText}>Round Stats</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.popupScroll} showsVerticalScrollIndicator={false}>
              {lastRound ? (
                <>
                  <View style={styles.popupRoundInfo}>
                    <Text style={styles.popupCourseName}>{lastRound.courseName}</Text>
                    <Text style={styles.popupDate}>{lastRound.roundDate}</Text>
                    {lastRound.duration ? (
                      <Text style={styles.popupDuration}>Duration: {lastRound.duration}</Text>
                    ) : null}
                  </View>

                  <View style={styles.popupScoreSection}>
                    <View style={styles.popupScoreBig}>
                      <Text style={styles.popupScoreValue}>{lastRound.totalScore}</Text>
                      <Text style={[styles.popupToPar, { color: getToParColor() }]}>{getToParDisplay()}</Text>
                    </View>
                    <View style={styles.popupScoreDetails}>
                      <View style={styles.popupDetailItem}>
                        <Text style={styles.popupDetailValue}>{lastRound.holesPlayed}</Text>
                        <Text style={styles.popupDetailLabel}>Holes</Text>
                      </View>
                      <View style={styles.popupDetailItem}>
                        <Text style={styles.popupDetailValue}>{lastRound.totalPar}</Text>
                        <Text style={styles.popupDetailLabel}>Par</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.popupPlayersSection}>
                    <Text style={styles.popupSectionTitle}>Players</Text>
                    {lastRound.players.map((p, i) => (
                      <View key={i} style={styles.popupPlayerRow}>
                        <View style={styles.popupPlayerAvatar}>
                          <User size={16} color="#888" />
                        </View>
                        <Text style={styles.popupPlayerName}>{p}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.popupSummarySection}>
                    <Text style={styles.popupSectionTitle}>Summary</Text>
                    <View style={styles.popupSummaryGrid}>
                      {[
                        { label: 'Score', value: `${lastRound.totalScore}` },
                        { label: 'To Par', value: getToParDisplay() },
                        { label: 'Holes', value: `${lastRound.holesPlayed}` },
                        { label: 'Course Par', value: `${lastRound.totalPar}` },
                      ].map((item, idx) => (
                        <View key={idx} style={styles.popupSummaryItem}>
                          <Text style={styles.popupSummaryValue}>{item.value}</Text>
                          <Text style={styles.popupSummaryLabel}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.popupEmpty}>
                  <Text style={styles.popupEmptyText}>No round data available yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Last Practice Popup */}
      <Modal
        visible={lastPracticePopupVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLastPracticePopupVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupSheet}>
            <View style={styles.popupHeader}>
              <TouchableOpacity
                onPress={() => setLastPracticePopupVisible(false)}
                style={styles.popupCloseBtn}
                activeOpacity={0.7}
              >
                <X size={22} color="#999" />
              </TouchableOpacity>
              <Text style={styles.popupTitle}>Last Practice</Text>
              <TouchableOpacity
                style={styles.popupStatsBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLastPracticePopupVisible(false);
                  navigateTo('data-overview', { initialTab: 'stats', initialStatsSegment: 'practice' });
                }}
                activeOpacity={0.7}
                testID="practice-stats-button"
              >
                <BarChart2 size={14} color="#4FC3F7" />
                <Text style={styles.popupStatsBtnText}>Practice Stats</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.popupScroll} showsVerticalScrollIndicator={false}>
              <PracticePopupContent />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Card for viewing other users */}
      <ProfileCard
        visible={profileCardVisible}
        onClose={() => setProfileCardVisible(false)}
        user={profileCardUser}
        isFollowingUser={profileCardUser ? isFollowing(profileCardUser.id) : false}
        onToggleFollow={profileCardUser ? () => handleToggleFollow(profileCardUser.id) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerAbsolute: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerIcons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 30,
  },


  liveDivider: {
    height: 2,
    backgroundColor: '#ECECEC',
    marginHorizontal: -20,
    marginBottom: 4,
  },
  cardSectionHeader: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  profileTopSection: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center' as const,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F0F0',
    borderWidth: 3,
    borderColor: '#E0E0E0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: '#3D954D',
  },
  followRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 0,
  },
  followStatBtn: {
    alignItems: 'center' as const,
    paddingHorizontal: 10,
  },
  followStatNumber: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  followStatLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  followDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D0D0D0',
  },
  actionGrid: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-start' as const,
    alignItems: 'flex-end' as const,
  },
  actionGridRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  gridBtn: {
    width: 52,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  gridBtnCompare: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFD0D0',
  },
  gridBtnText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#D4AF37',
  },
  gridBtnLabel: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#888',
  },
  handicapGradientBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  handicapGradientInner: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    borderRadius: 12,
  },
  handicapBoldText: {
    fontSize: 13,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  handicapSgfIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  helpMenuOverlay: {
    position: 'absolute' as const,
    top: 0,
    right: 20,
    zIndex: 200,
  },
  helpMenuBackdrop: {
    position: 'absolute' as const,
    top: -200,
    left: -400,
    right: -400,
    bottom: -2000,
  },
  helpMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    width: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  helpMenuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  helpMenuText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  helpMenuDivider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginHorizontal: 10,
    marginVertical: 4,
  },

  liveSection: {
    marginBottom: 32,
    marginTop: 20,
  },
  liveSectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FF3B30',
    letterSpacing: 1,
    marginBottom: 14,
  },
  liveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  liveEmptyState: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
  },
  liveEmptyText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500' as const,
  },

  cardsColumn: {
    gap: 32,
  },
  roundCardOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  roundCardGradient: {
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
  },
  practiceCardOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  practiceCardGradient: {
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
  },
  gradientCardContent: {
    flex: 1,
  },
  gradientCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    marginBottom: 8,
  },
  gradientCardToParBadge: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  gradientCardInnerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  gradientCardLeft: {
    flex: 1,
  },
  gradientCardCourse: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  gradientCardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  gradientCardHoles: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  gradientCardScore: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  gradientCardEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#666',
  },
  cardHeaderRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  cardToParBadge: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  cardInnerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  cardLeft: {
    flex: 1,
  },
  cardCourse: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  cardDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  cardScore: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#3D954D',
  },
  cardHoles: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  cardEmpty: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 12,
  },

  tourCard: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tourCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  tourCardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  tourCardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  tourDataGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tourDataItem: {
    width: '30%' as any,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tourDataValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  tourDataLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center' as const,
  },

  affiliateCard: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  affiliateCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  affiliateCardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  affiliateCardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },

  avatarPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarPreviewClose: {
    position: 'absolute' as const,
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  avatarPreviewImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  avatarPreviewPlaceholder: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: SCREEN_WIDTH * 0.3,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarPreviewInitials: {
    fontSize: 72,
    fontWeight: '700' as const,
    color: '#1DB954',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end' as const,
  },
  followsSheet: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.88,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center' as const,
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EFEFEF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  tabSwitcher: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  tabBtnActive: {
    backgroundColor: '#2A2A2A',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabBtnTextActive: {
    color: '#EFEFEF',
  },
  followsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  followUserRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
  },
  followUserLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: 12,
  },
  followUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  followUserAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  followUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  followUserName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },
  followUserUsername: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  followBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center' as const,
  },
  followBtnFollowing: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  followBtnTextFollowing: {
    color: '#EFEFEF',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  popupSheet: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    width: '100%' as const,
    maxHeight: SCREEN_HEIGHT * 0.82,
    overflow: 'hidden' as const,
  },
  popupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  popupCloseBtn: {
    padding: 4,
    width: 32,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#EFEFEF',
  },
  popupHeaderSpacer: {
    width: 32,
  },
  popupStatsBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: '#4FC3F715',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4FC3F730',
  },
  popupStatsBtnText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#4FC3F7',
  },
  popupScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  popupRoundInfo: {
    marginBottom: 20,
  },
  popupCourseName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  popupDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  popupDuration: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },

  popupScoreSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#33333340',
  },
  popupScoreBig: {
    flex: 1,
    alignItems: 'center' as const,
  },
  popupScoreValue: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#1DB954',
  },
  popupToPar: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  popupScoreDetails: {
    flex: 1,
    gap: 12,
  },
  popupDetailItem: {
    alignItems: 'center' as const,
  },
  popupDetailValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  popupDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  popupPlayersSection: {
    marginBottom: 20,
  },
  popupSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 12,
  },
  popupPlayerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  popupPlayerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  popupPlayerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },

  popupSummarySection: {
    marginBottom: 30,
  },
  popupSummaryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  popupSummaryItem: {
    width: '47%' as any,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
  },
  popupSummaryValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  popupSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  popupEmpty: {
    paddingVertical: 60,
    alignItems: 'center' as const,
  },
  popupEmptyText: {
    fontSize: 15,
    color: '#555',
  },
  popupPracticeWrap: {
    paddingBottom: 20,
  },
  coachHeaderIcon: {
    width: 22,
    height: 22,
    tintColor: '#555',
  },
});
