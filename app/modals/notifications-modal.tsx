import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, User, MessageCircle } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileCard from '@/components/ProfileCard';
import * as Haptics from 'expo-haptics';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'general';
  message: string;
  username: string;
  timestamp: string;
  read: boolean;
  userProfile: UserProfile | null;
}

export default function NotificationsModal() {
  const router = useRouter();
  const { followers, isFollowing, toggleFollow } = useProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileCardUser, setProfileCardUser] = useState<UserProfile | null>(null);
  const [profileCardVisible, setProfileCardVisible] = useState<boolean>(false);

  useEffect(() => {
    const generated: Notification[] = followers.map((f, idx) => ({
      id: f.id || `notif-${idx}`,
      type: 'follow' as const,
      message: `started following you`,
      username: f.display_name || f.username || 'Someone',
      timestamp: new Date(Date.now() - idx * 3600000 * (idx + 1)).toISOString(),
      read: idx > 1,
      userProfile: f,
    }));
    setNotifications(generated);
    setLoading(false);
  }, [followers]);

  const openProfileCard = useCallback((user: UserProfile | null) => {
    if (!user) return;
    console.log('[Notifications] Opening profile card for:', user.username);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileCardUser(user);
    setProfileCardVisible(true);
  }, []);

  const handleToggleFollow = useCallback(async (targetUserId: string) => {
    console.log('[Notifications] Toggle follow:', targetUserId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleFollow(targetUserId);
    } catch (err: any) {
      console.error('[Notifications] Toggle follow error:', err.message);
    }
  }, [toggleFollow]);

  const formatTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[s.notifRow, !item.read && s.notifUnread]}
      activeOpacity={0.7}
      onPress={() => openProfileCard(item.userProfile)}
    >
      <View style={s.notifIconWrap}>
        {item.userProfile?.avatar_url ? (
          <Image source={{ uri: item.userProfile.avatar_url }} style={s.notifAvatar} />
        ) : (
          <View style={s.notifAvatarPlaceholder}>
            <User size={16} color="rgba(0,0,0,0.35)" />
          </View>
        )}
      </View>
      <View style={s.notifContent}>
        <Text style={s.notifText}>
          <Text style={s.notifUsername}>{item.username}</Text>
          {' '}{item.message}
        </Text>
        <Text style={s.notifTime}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={s.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={s.gradientContainer}
    >
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <GlassBackButton onPress={() => router.back()} />
          <Text style={s.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={s.chatIconButton}
            activeOpacity={0.7}
            onPress={() => {
              console.log('[Notifications] Opening chat list');
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/chat-list-modal');
            }}
            testID="notifications-chat-icon"
          >
            <MessageCircle size={22} color="#1A1A1A" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.emptyState}>
          <Bell size={40} color="rgba(0,0,0,0.2)" />
          <Text style={s.emptyTitle}>No notifications</Text>
          <Text style={s.emptySubtext}>When someone follows you or interacts, it will show up here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ProfileCard
        visible={profileCardVisible}
        onClose={() => {
          setProfileCardVisible(false);
          setProfileCardUser(null);
        }}
        user={profileCardUser}
        isFollowingUser={profileCardUser ? isFollowing(profileCardUser.id) : false}
        onToggleFollow={profileCardUser ? () => handleToggleFollow(profileCardUser.id) : undefined}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  notifRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  notifUnread: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden' as const,
    marginRight: 14,
  },
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notifAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  notifUsername: {
    fontWeight: '700' as const,
    color: '#000000',
  },
  notifTime: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
});
