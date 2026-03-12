import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Trophy, MessageSquare } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface TourData {
  eventsPlayed: number;
  placements: string;
  earnings: string;
  rank: string;
  age: number;
}

const MOCK_TOUR_DATA: TourData = {
  eventsPlayed: 3,
  placements: 'T5',
  earnings: '1.2k SEK',
  rank: '#42',
  age: 27,
};

interface ProfileCardProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  isFollowingUser?: boolean;
  onToggleFollow?: () => void;
}

function useUserSocialCounts(userId: string | null, visible: boolean) {
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId || !visible) {
      setFollowersCount(0);
      setFollowingCount(0);
      setLoading(true);
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      try {
        console.log('[ProfileCard] Fetching social counts for:', userId);
        const [followersRes, followingRes] = await Promise.all([
          supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId),
          supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId),
        ]);

        if (cancelled) return;

        const fwersCount = followersRes.count ?? 0;
        const fwingCount = followingRes.count ?? 0;
        console.log('[ProfileCard] Social counts:', { followersCount: fwersCount, followingCount: fwingCount });
        setFollowersCount(fwersCount);
        setFollowingCount(fwingCount);
      } catch (err: any) {
        console.log('[ProfileCard] Error fetching social counts:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchCounts();
    return () => { cancelled = true; };
  }, [userId, visible]);

  return { followersCount, followingCount, loading };
}

export default function ProfileCard({
  visible,
  onClose,
  user,
  isFollowingUser = false,
  onToggleFollow,
}: ProfileCardProps) {
  const router = useRouter();
  const [tourModalVisible, setTourModalVisible] = useState<boolean>(false);
  const { followersCount, followingCount, loading: socialLoading } = useUserSocialCounts(
    user?.id ?? null,
    visible
  );

  const handleOpenChat = useCallback(() => {
    if (!user) return;
    console.log('[ProfileCard] Opening chat with:', user.username);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/modals/chat-conversation-modal',
        params: {
          otherUserId: user.id,
          otherUsername: user.username || user.display_name || 'User',
          otherAvatar: user.avatar_url || '',
        },
      });
    }, 350);
  }, [user, onClose, router]);

  if (!user) return null;

  const initials = (user.display_name || user.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const homeCourse = 'Bro Hof Slott GC';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.header}>
          <GlassBackButton onPress={onClose} />
          <Text style={styles.headerTitle}>@{user.username}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topRow}>
            <View style={styles.profileCardHalf}>
              <View style={styles.miniAvatarSection}>
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.miniAvatar} />
                ) : (
                  <View style={styles.miniAvatarPlaceholder}>
                    <Text style={styles.miniAvatarInitials}>{initials}</Text>
                  </View>
                )}
                <Text style={styles.miniHomeCourse} numberOfLines={1}>{homeCourse}</Text>
              </View>

              <View style={styles.miniStatsRow}>
                {socialLoading ? (
                  <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
                ) : (
                  <>
                    <View style={styles.miniStatItem}>
                      <Text style={styles.miniStatNumber}>{followersCount}</Text>
                      <Text style={styles.miniStatLabel}>Followers</Text>
                    </View>
                    <View style={styles.miniStatSep} />
                    <View style={styles.miniStatItem}>
                      <Text style={styles.miniStatNumber}>{followingCount}</Text>
                      <Text style={styles.miniStatLabel}>Following</Text>
                    </View>
                  </>
                )}
              </View>

              {onToggleFollow && (
                <TouchableOpacity
                  style={[styles.miniFollowBtn, isFollowingUser && styles.miniFollowBtnActive]}
                  onPress={onToggleFollow}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.miniFollowBtnText, isFollowingUser && styles.miniFollowBtnTextActive]}>
                    {isFollowingUser ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.textButtonHalf}
              activeOpacity={0.8}
              onPress={handleOpenChat}
              testID="profile-card-text-button"
            >
              <MessageSquare size={28} color="#1A1A1A" strokeWidth={2} />
              <Text style={styles.textButtonLabel}>Text</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgeRow}>
            <LinearGradient
              colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.handicapCard}
            >
              <Text style={styles.handicapValue}>HCP</Text>
              <Image
                source={require('@/assets/images/sgf-icon.png')}
                style={styles.handicapSgfIcon}
                resizeMode="contain"
              />
            </LinearGradient>

            <TouchableOpacity
              style={styles.tourCard}
              activeOpacity={0.7}
              onPress={() => {
                console.log('[ProfileCard] TOUR pressed');
                setTourModalVisible(true);
              }}
            >
              <Trophy size={16} color="#FFB74D" />
              <Text style={styles.tourButtonText}>TOUR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Last Round</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmpty}>No round data available</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Last Practice</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmpty}>No practice data available</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={tourModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTourModalVisible(false)}
      >
        <View style={tourStyles.overlay}>
          <View style={tourStyles.modalCard}>
            <Text style={tourStyles.modalTitle}>Tour Stats</Text>

            <View style={tourStyles.dataGrid}>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.eventsPlayed}</Text>
                <Text style={tourStyles.dataLabel}>Events Played</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.placements}</Text>
                <Text style={tourStyles.dataLabel}>Placements</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.earnings}</Text>
                <Text style={tourStyles.dataLabel}>Earnings</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.rank}</Text>
                <Text style={tourStyles.dataLabel}>Rank</Text>
              </View>
              <View style={tourStyles.dataItem}>
                <Text style={tourStyles.dataValue}>{MOCK_TOUR_DATA.age}</Text>
                <Text style={tourStyles.dataLabel}>Age</Text>
              </View>
            </View>

            <View style={tourStyles.closeRow}>
              <TouchableOpacity
                style={tourStyles.closeButton}
                activeOpacity={0.7}
                onPress={() => setTourModalVisible(false)}
              >
                <Text style={tourStyles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
    paddingTop: 10,
  },
  profileCardHalf: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  miniAvatarSection: {
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  miniAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 6,
  },
  miniAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  miniAvatarInitials: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  miniHomeCourse: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center' as const,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
    gap: 8,
  },
  miniStatItem: {
    alignItems: 'center' as const,
  },
  miniStatNumber: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  miniStatLabel: {
    fontSize: 9,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 1,
  },
  miniStatSep: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  miniFollowBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  miniFollowBtnActive: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  miniFollowBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  miniFollowBtnTextActive: {
    color: '#1A1A1A',
  },
  textButtonHalf: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  textButtonLabel: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  badgeRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
  },
  handicapCard: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  handicapValue: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  handicapSgfIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  tourCard: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFB74D30',
    gap: 8,
  },
  tourButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFB74D',
    letterSpacing: 1,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  infoEmpty: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.35)',
    textAlign: 'center' as const,
  },
});

const tourStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start' as const,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  dataGrid: {
    gap: 12,
  },
  dataItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  dataLabel: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
    fontWeight: '600' as const,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFB74D',
  },
  closeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
});
