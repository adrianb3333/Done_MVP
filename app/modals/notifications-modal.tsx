import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlus, Heart, MessageCircle, Bell } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'general';
  message: string;
  username: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationsModal() {
  const router = useRouter();
  const { followers } = useProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const generated: Notification[] = followers.map((f, idx) => ({
      id: f.id || `notif-${idx}`,
      type: 'follow' as const,
      message: `started following you`,
      username: f.display_name || f.username || 'Someone',
      timestamp: new Date(Date.now() - idx * 3600000 * (idx + 1)).toISOString(),
      read: idx > 1,
    }));
    setNotifications(generated);
    setLoading(false);
  }, [followers]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={18} color="#1DB954" />;
      case 'like':
        return <Heart size={18} color="#FF5252" />;
      case 'comment':
        return <MessageCircle size={18} color="#4FC3F7" />;
      default:
        return <Bell size={18} color="#B0B0B0" />;
    }
  };

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
    <View style={[s.notifRow, !item.read && s.notifUnread]}>
      <View style={s.notifIconWrap}>
        {getIcon(item.type)}
      </View>
      <View style={s.notifContent}>
        <Text style={s.notifText}>
          <Text style={s.notifUsername}>{item.username}</Text>
          {' '}{item.message}
        </Text>
        <Text style={s.notifTime}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={s.unreadDot} />}
    </View>
  );

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <GlassBackButton onPress={() => router.back()} />
          <Text style={s.headerTitle}>Aviseringar</Text>
          <View style={s.headerSpacer} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="small" color="#1DB954" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.emptyState}>
          <Bell size={40} color="#333" />
          <Text style={s.emptyTitle}>Inga aviseringar</Text>
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
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeTop: {
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backBtnUnused: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EFEFEF',
  },
  headerSpacer: {
    width: 36,
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
    color: '#555',
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#444',
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
    borderBottomColor: '#141414',
  },
  notifUnread: {
    backgroundColor: '#1DB95408',
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  notifUsername: {
    fontWeight: '700' as const,
    color: '#EFEFEF',
  },
  notifTime: {
    fontSize: 11,
    color: '#555',
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
    marginLeft: 8,
  },
});
