import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';

export default function HandicapModal() {
  const router = useRouter();
  const { profile } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';
  const handicap = 14.2;

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
            <ChevronLeft size={24} color="#EFEFEF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username} Handicap</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.handicapCard}>
          <View style={styles.trophyCircle}>
            <Trophy size={40} color="#D4AF37" />
          </View>
          <Text style={styles.handicapLabel}>Current Handicap</Text>
          <Text style={styles.handicapValue}>{handicap.toFixed(1)}</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>78</Text>
              <Text style={styles.infoLabel}>Best Round</Text>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>84.3</Text>
              <Text style={styles.infoLabel}>Avg Score</Text>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>12</Text>
              <Text style={styles.infoLabel}>Rounds</Text>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Handicap History</Text>
          {[
            { date: '2026-02-28', hcp: 14.2 },
            { date: '2026-02-15', hcp: 14.8 },
            { date: '2026-01-30', hcp: 15.1 },
            { date: '2026-01-12', hcp: 15.6 },
            { date: '2025-12-20', hcp: 16.0 },
          ].map((entry, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{entry.date}</Text>
              <Text style={styles.historyHcp}>{entry.hcp.toFixed(1)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.apiNotice}>
          <Text style={styles.apiNoticeText}>Live handicap updates coming soon</Text>
        </View>
      </View>
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
    paddingTop: 20,
  },
  handicapCard: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#D4AF3730',
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4AF3712',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  handicapLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  handicapValue: {
    fontSize: 52,
    fontWeight: '900' as const,
    color: '#D4AF37',
    letterSpacing: -1,
  },
  divider: {
    width: '80%' as const,
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  infoSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#2A2A2A',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#EFEFEF',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  historySection: {
    marginTop: 28,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 14,
  },
  historyRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  historyDate: {
    fontSize: 14,
    color: '#888',
  },
  historyHcp: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  apiNotice: {
    marginTop: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center' as const,
  },
  apiNoticeText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic' as const,
  },
});
