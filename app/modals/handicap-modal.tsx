import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';

const SEASON_START_HANDICAP = 16.0;
const CURRENT_HANDICAP = 14.2;
const SEASON_PROGRESS = +(CURRENT_HANDICAP - SEASON_START_HANDICAP).toFixed(1);
const SEASON_TREND: 'up' | 'down' = CURRENT_HANDICAP > SEASON_START_HANDICAP ? 'up' : 'down';

export default function HandicapModal() {
  const router = useRouter();
  const { profile } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
            testID="handicap-back-button"
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username} Handicap</Text>
          <TouchableOpacity
            onPress={() => router.push('/modals/rounds-history-modal')}
            activeOpacity={0.7}
            testID="handicap-sgf-icon"
          >
            <Image
              source={require('@/assets/images/sgf-icon.png')}
              style={styles.sgfIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.topSection}>
          <View style={styles.topRow}>
            <View style={styles.currentBlock}>
              <Text style={styles.handicapNumber}>{CURRENT_HANDICAP.toFixed(1)}</Text>
              <Text style={styles.currentLabel}>Player Current</Text>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressValueRow}>
                <Text style={styles.progressNumber}>
                  {SEASON_PROGRESS > 0 ? '+' : ''}{SEASON_PROGRESS.toFixed(1)}
                </Text>
                {SEASON_TREND === 'up' ? (
                  <TrendingUp size={14} color="#E74C3C" style={styles.trendIcon} />
                ) : (
                  <TrendingDown size={14} color="#2ECC40" style={styles.trendIcon} />
                )}
              </View>
              <Text style={styles.progressLabel}>Progress</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5BBF7F',
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
    color: '#fff',
    letterSpacing: 0.3,
  },
  sgfIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  body: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 20,
  },
  topSection: {
    alignItems: 'center' as const,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 32,
  },
  currentBlock: {
    alignItems: 'center' as const,
  },
  handicapNumber: {
    fontSize: 68,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 74,
  },
  currentLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffffCC',
    marginTop: 4,
  },
  progressBlock: {
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  progressValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  progressNumber: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: '#fff',
    lineHeight: 40,
  },
  trendIcon: {
    marginLeft: 2,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffffCC',
    marginTop: 4,
  },
});
