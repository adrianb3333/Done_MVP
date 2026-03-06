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
import { Settings, X, User, Newspaper, TrendingUp, Bluetooth, Trophy, QrCode, Swords, Clock, Target, Zap, Hash, Menu, Video, BarChart2, MapPin, Award, Calendar, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import UiTra from '@/components/probygg/UiTra';
import ProfileCard from '@/components/ProfileCard';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DrillEntry {
  id: string;
  drill_name: string;
  score: number | null;
  created_at: string;
  user_id: string;
}

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
    fetchAll();
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

  const [followsModalVisible, setFollowsModalVisible] = useState<boolean>(false);
  const [followsTab, setFollowsTab] = useState<'hitta' | 'followers' | 'following'>('hitta');
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState<boolean>(false);
  const [lastRoundPopupVisible, setLastRoundPopupVisible] = useState<boolean>(false);
  const [lastPracticePopupVisible, setLastPracticePopupVisible] = useState<boolean>(false);
  const [profileCardUser, setProfileCardUser] = useState<UserProfile | null>(null);
  const [profileCardVisible, setProfileCardVisible] = useState<boolean>(false);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAvatarPreviewVisible(true);
  }, []);

  const openFollowsModal = useCallback((tab: 'hitta' | 'followers' | 'following') => {
    console.log('[Profile] Opening follows modal, tab:', tab);
    setFollowsTab(tab);
    setFollowsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleToggleFollow = useCallback(async (targetUserId: string) => {
    console.log('[Profile] Toggle follow:', targetUserId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleFollow(targetUserId);
    } catch (err: any) {
      console.error('[Profile] Toggle follow error:', err.message);
    }
  }, [toggleFollow]);

  const openProfileCard = useCallback((user: UserProfile) => {
    console.log('[Profile] Opening profile card for:', user.username);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (diff < 0) return '#4CAF50';
    if (diff === 0) return '#1DB954';
    return '#FF5252';
  };

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
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={openSidebar}
            style={styles.hamburgerBtn}
            activeOpacity={0.7}
            testID="hamburger-menu"
          >
            <Menu size={24} color="#F5F7F6" />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => router.push('/modals/pair-impact-modal' as any)}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              testID="pair-impact-button"
            >
              <Bluetooth size={20} color="#B0B0B0" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/modals/recap-modal' as any)}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              testID="recap-button"
            >
              <TrendingUp size={20} color="#B0B0B0" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/modals/news-modal' as any)}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              testID="news-button"
            >
              <Newspaper size={20} color="#B0B0B0" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/settings/settings1' as any)}
              style={styles.headerIconBtn}
              testID="settings-button"
            >
              <Settings size={22} color="#B0B0B0" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

          <View style={styles.profileTopRow}>
            <View style={styles.avatarAndName}>
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
              <Text style={styles.usernameText}>{profile?.username ?? 'user'}</Text>
            </View>

            <View style={styles.statsColumn}>
              <TouchableOpacity
                style={styles.statItemSmall}
                onPress={() => openFollowsModal('followers')}
                activeOpacity={0.7}
                testID="followers-button"
              >
                <Text style={styles.statNumberSmall}>{followersCount}</Text>
                <Text style={styles.statLabelSmall}>följare</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItemSmall}
                onPress={() => openFollowsModal('following')}
                activeOpacity={0.7}
                testID="following-button"
              >
                <Text style={styles.statNumberSmall}>{followingCount}</Text>
                <Text style={styles.statLabelSmall}>följer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.videoNavBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigateTo('data-overview', { initialTab: 'video' });
                }}
                activeOpacity={0.8}
                testID="video-nav-button"
              >
                <Video size={18} color="#4FC3F7" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.goldBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/modals/handicap-modal' as any);
                }}
                activeOpacity={0.8}
                testID="handicap-button"
              >
                <Trophy size={14} color="#D4AF37" />
                <Text style={styles.goldBtnText}>{randomHcp}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/modals/qr-modal' as any);
                }}
                activeOpacity={0.8}
                testID="qr-button"
              >
                <QrCode size={14} color="#EFEFEF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compareBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/modals/compare-modal' as any);
                }}
                activeOpacity={0.8}
                testID="compare-button"
              >
                <Swords size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.liveSection}>
            <Text style={styles.liveSectionTitle}>LIVE</Text>
            <View style={styles.liveEmptyState}>
              <View style={styles.liveDot} />
              <Text style={styles.liveEmptyText}>No friends playing right now</Text>
            </View>
          </View>

          <View style={styles.cardsColumn}>
            <TouchableOpacity
              style={styles.roundCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLastRoundPopupVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Last Round</Text>
                {lastRound ? (
                  <Text style={[styles.cardToParBadge, { color: getToParColor() }]}>{getToParDisplay()}</Text>
                ) : null}
              </View>
              {lastRound ? (
                <View style={styles.cardInnerRow}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardCourse} numberOfLines={1}>{lastRound.courseName}</Text>
                    <Text style={styles.cardDate}>{lastRound.roundDate}</Text>
                    <Text style={styles.cardHoles}>{lastRound.holesPlayed} holes</Text>
                  </View>
                  <Text style={styles.cardScore}>{lastRound.totalScore}</Text>
                </View>
              ) : (
                <Text style={styles.cardEmpty}>No rounds yet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.practiceCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLastPracticePopupVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Last Practice</Text>
              <UiTra />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tourCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigateTo('community');
              }}
              activeOpacity={0.8}
              testID="tour-card"
            >
              <View style={styles.tourCardHeader}>
                <View style={styles.tourCardTitleRow}>
                  <Trophy size={16} color="#FFB74D" />
                  <Text style={styles.tourCardTitle}>Tour</Text>
                </View>
                <ChevronRight size={16} color="#555" />
              </View>
              <View style={styles.tourDataGrid}>
                <View style={styles.tourDataItem}>
                  <View style={styles.tourDataIconWrap}>
                    <Calendar size={13} color="#4FC3F7" />
                  </View>
                  <Text style={styles.tourDataValue}>4</Text>
                  <Text style={styles.tourDataLabel}>Events Played</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <View style={styles.tourDataIconWrap}>
                    <Award size={13} color="#FFB74D" />
                  </View>
                  <Text style={styles.tourDataValue}>2</Text>
                  <Text style={styles.tourDataLabel}>Placements</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <View style={styles.tourDataIconWrap}>
                    <Text style={styles.tourDataIconText}>$</Text>
                  </View>
                  <Text style={styles.tourDataValue}>8,500</Text>
                  <Text style={styles.tourDataLabel}>Earnings</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <View style={styles.tourDataIconWrap}>
                    <TrendingUp size={13} color="#1DB954" />
                  </View>
                  <Text style={styles.tourDataValue}>#12</Text>
                  <Text style={styles.tourDataLabel}>Rank</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <View style={styles.tourDataIconWrap}>
                    <MapPin size={13} color="#E040FB" />
                  </View>
                  <Text style={styles.tourDataValue} numberOfLines={1}>Bro Hof</Text>
                  <Text style={styles.tourDataLabel}>Home Course</Text>
                </View>
                <View style={styles.tourDataItem}>
                  <View style={styles.tourDataIconWrap}>
                    <User size={13} color="#FF5252" />
                  </View>
                  <Text style={styles.tourDataValue}>24</Text>
                  <Text style={styles.tourDataLabel}>Age</Text>
                </View>
              </View>
            </TouchableOpacity>
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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

  profileTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 24,
    gap: 12,
  },
  avatarAndName: {
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
    borderColor: '#2A2A2A',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E1E1E',
    borderWidth: 3,
    borderColor: '#2A2A2A',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: '#1DB954',
  },
  usernameText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#B0B0B0',
    marginTop: 6,
    letterSpacing: 0.2,
    maxWidth: 90,
    textAlign: 'center' as const,
  },
  statsColumn: {
    gap: 8,
    justifyContent: 'center' as const,
  },
  statItemSmall: {
    backgroundColor: '#141414',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statNumberSmall: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  statLabelSmall: {
    fontSize: 9,
    color: '#666',
    marginTop: 1,
  },
  videoNavBtn: {
    backgroundColor: '#141414',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#4FC3F720',
  },

  actionButtons: {
    flexDirection: 'row' as const,
    gap: 6,
    alignItems: 'flex-start' as const,
    justifyContent: 'flex-end' as const,
    flex: 1,
  },
  goldBtn: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 3,
    backgroundColor: '#141414',
    borderRadius: 10,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#D4AF3740',
  },
  goldBtnText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#D4AF37',
  },
  qrBtn: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#141414',
    borderRadius: 10,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  compareBtn: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FF444420',
    borderRadius: 10,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#FF444440',
  },

  liveSection: {
    marginBottom: 20,
  },
  liveSectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FF3B30',
    letterSpacing: 1,
    marginBottom: 10,
  },
  liveEmptyState: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  liveEmptyText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500' as const,
  },

  cardsColumn: {
    gap: 12,
  },
  roundCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1B5E2040',
  },
  practiceCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2e7d3240',
    overflow: 'hidden' as const,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#888',
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
    color: '#EFEFEF',
  },
  cardDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  cardScore: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#1DB954',
  },
  cardHoles: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  cardEmpty: {
    fontSize: 13,
    color: '#444',
    marginTop: 12,
  },

  tourCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFB74D20',
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
    color: '#FFB74D',
  },
  tourDataGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tourDataItem: {
    width: '30%' as any,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#222',
  },
  tourDataIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 5,
  },
  tourDataIconText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#1DB954',
  },
  tourDataValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  tourDataLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
    textAlign: 'center' as const,
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
    backgroundColor: '#141414',
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
    backgroundColor: '#141414',
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
    borderColor: '#1B5E2040',
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
});
