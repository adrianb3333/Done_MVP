import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';

export default function CompareModal() {
  const router = useRouter();
  const { profile, following } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
            testID="compare-back-button"
          >
            <ChevronLeft size={24} color="#EFEFEF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username} VS</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.vsSection}>
          <View style={styles.vsCard}>
            <View style={styles.vsPlayer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.vsAvatar} />
              ) : (
                <View style={styles.vsAvatarPlaceholder}>
                  <User size={28} color="#1DB954" />
                </View>
              )}
              <Text style={styles.vsName}>{username}</Text>
              <Text style={styles.vsHcp}>HCP 14.2</Text>
            </View>

            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.vsPlayer}>
              <View style={styles.vsAvatarEmpty}>
                <Search size={24} color="#555" />
              </View>
              <Text style={styles.vsNameEmpty}>Select Player</Text>
              <Text style={styles.vsHcpEmpty}>—</Text>
            </View>
          </View>
        </View>

        <View style={styles.selectSection}>
          <Text style={styles.selectTitle}>Choose opponent</Text>
          <Text style={styles.selectSubtitle}>Select a friend to compare stats</Text>

          {following.length > 0 ? (
            following.map((user) => (
              <TouchableOpacity key={user.id} style={styles.friendRow} activeOpacity={0.7}>
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.friendAvatar} />
                ) : (
                  <View style={styles.friendAvatarPlaceholder}>
                    <User size={18} color="#666" />
                  </View>
                )}
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{user.display_name || user.username}</Text>
                  <Text style={styles.friendUsername}>@{user.username}</Text>
                </View>
                <View style={styles.selectBtn}>
                  <Text style={styles.selectBtnText}>Compare</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Follow other players to compare stats</Text>
            </View>
          )}
        </View>

        <View style={styles.statsPreview}>
          <Text style={styles.statsPreviewTitle}>Stats Categories</Text>
          {['Avg Score', 'Best Round', 'Fairways Hit %', 'GIR %', 'Putts per Round', 'Handicap Trend'].map((stat, i) => (
            <View key={i} style={styles.statRow}>
              <Text style={styles.statName}>{stat}</Text>
              <View style={styles.statBar}>
                <View style={[styles.statBarFill, { width: '50%' }]} />
              </View>
              <Text style={styles.statDash}>—</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeTop: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 6,
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vsSection: {
    marginTop: 16,
  },
  vsCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: '#222',
  },
  vsPlayer: {
    flex: 1,
    alignItems: 'center' as const,
  },
  vsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1DB954',
    marginBottom: 8,
  },
  vsAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#1DB954',
    marginBottom: 8,
  },
  vsAvatarEmpty: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed' as const,
    marginBottom: 8,
  },
  vsName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#EFEFEF',
  },
  vsNameEmpty: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#555',
  },
  vsHcp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  vsHcpEmpty: {
    fontSize: 12,
    color: '#444',
    marginTop: 2,
  },
  vsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF4444',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#fff',
  },
  selectSection: {
    marginTop: 28,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 4,
  },
  selectSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  friendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },
  friendUsername: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  selectBtn: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptyState: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
  },
  statsPreview: {
    marginTop: 28,
    marginBottom: 40,
  },
  statsPreviewTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  statName: {
    fontSize: 13,
    color: '#888',
    width: 110,
  },
  statBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden' as const,
  },
  statBarFill: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  statDash: {
    fontSize: 13,
    color: '#444',
    width: 30,
    textAlign: 'right' as const,
  },
});
