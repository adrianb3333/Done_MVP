import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { UserProfile } from '@/contexts/ProfileContext';

interface ProfileCardProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  followersCount?: number;
  followingCount?: number;
  isFollowingUser?: boolean;
  onToggleFollow?: () => void;
}

export default function ProfileCard({
  visible,
  onClose,
  user,
  followersCount = 0,
  followingCount = 0,
  isFollowingUser = false,
  onToggleFollow,
}: ProfileCardProps) {
  if (!user) return null;

  const initials = (user.display_name || user.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const randomHcp = (Math.random() * 30 + 2).toFixed(1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            activeOpacity={0.7}
            testID="profile-card-back"
          >
            <ChevronLeft size={24} color="#EFEFEF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.avatarSection}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <Text style={styles.displayName}>{user.display_name || user.username}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.handicapCard}>
            <Trophy size={24} color="#D4AF37" />
            <View style={styles.handicapInfo}>
              <Text style={styles.handicapLabel}>Handicap</Text>
              <Text style={styles.handicapValue}>{randomHcp}</Text>
            </View>
          </View>

          {onToggleFollow && (
            <TouchableOpacity
              style={[styles.followButton, isFollowingUser && styles.followButtonActive]}
              onPress={onToggleFollow}
              activeOpacity={0.8}
            >
              <Text style={[styles.followButtonText, isFollowingUser && styles.followButtonTextActive]}>
                {isFollowingUser ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 6,
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#EFEFEF',
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
  avatarSection: {
    alignItems: 'center' as const,
    paddingTop: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2A2A2A',
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E1E1E',
    borderWidth: 3,
    borderColor: '#2A2A2A',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1DB954',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#2A2A2A',
  },
  handicapCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4AF3730',
    gap: 14,
  },
  handicapInfo: {
    flex: 1,
  },
  handicapLabel: {
    fontSize: 12,
    color: '#888',
  },
  handicapValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#D4AF37',
  },
  followButton: {
    backgroundColor: '#1DB954',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  followButtonActive: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  followButtonTextActive: {
    color: '#EFEFEF',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  infoEmpty: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center' as const,
  },
});
