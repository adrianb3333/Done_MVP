import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, QrCode, Share2, Download, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProfile } from '@/contexts/ProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function QrModal() {
  const router = useRouter();
  const { profile } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page < 2) {
      setCurrentPage(page);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentPage]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
            testID="qr-back-button"
          >
            <ChevronLeft size={24} color="#EFEFEF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, currentPage === 0 && styles.dotActive]} />
          <View style={[styles.dot, currentPage === 1 && styles.dotActive]} />
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        <View style={styles.page}>
          <View style={styles.qrCard}>
            <View style={styles.qrPlaceholder}>
              <QrCode size={120} color="#EFEFEF" />
            </View>
            <Text style={styles.qrUsername}>@{profile?.username || 'user'}</Text>
            <Text style={styles.qrHint}>Scan to add as friend</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Share2 size={20} color="#1DB954" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Download size={20} color="#1DB954" />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.page}>
          <View style={styles.scanCard}>
            <View style={styles.scanIconCircle}>
              <Users size={48} color="#4A90D9" />
            </View>
            <Text style={styles.scanTitle}>Scan a Friend</Text>
            <Text style={styles.scanDescription}>
              Point your camera at another player&apos;s QR code to instantly add them as a friend and start tracking rounds together.
            </Text>

            <TouchableOpacity style={styles.scanBtn} activeOpacity={0.8}>
              <QrCode size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Open Scanner</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentScansSection}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            <View style={styles.emptyScans}>
              <Text style={styles.emptyScansText}>No recent scans</Text>
            </View>
          </View>
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
  dotsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#1DB954',
    width: 24,
    borderRadius: 4,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  qrCard: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#222',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  qrUsername: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 6,
  },
  qrHint: {
    fontSize: 13,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 16,
    marginTop: 24,
  },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },
  scanCard: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#222',
  },
  scanIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4A90D918',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#EFEFEF',
    marginBottom: 10,
  },
  scanDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  scanBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: '#1DB954',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  recentScansSection: {
    marginTop: 28,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EFEFEF',
    marginBottom: 12,
  },
  emptyScans: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  emptyScansText: {
    fontSize: 14,
    color: '#555',
  },
});
