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
import { User, Search } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '@/contexts/ProfileContext';

export default function CompareModal() {
  const router = useRouter();
  const { profile, following } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';

  return (
    <LinearGradient
      colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <GlassBackButton onPress={() => router.back()} />
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
                  <User size={28} color="#FFFFFF" />
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
                <Search size={24} color="rgba(255,255,255,0.5)" />
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
                    <User size={18} color="rgba(255,255,255,0.6)" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeTop: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  vsAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  vsAvatarEmpty: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed' as const,
    marginBottom: 8,
  },
  vsName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  vsNameEmpty: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  vsHcp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  vsHcpEmpty: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  vsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  selectSection: {
    marginTop: 28,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  friendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    color: '#FFFFFF',
  },
  friendUsername: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  selectBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  statsPreview: {
    marginTop: 28,
    marginBottom: 40,
  },
  statsPreviewTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  statName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    width: 110,
  },
  statBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden' as const,
  },
  statBarFill: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  statDash: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    width: 30,
    textAlign: 'right' as const,
  },
});
