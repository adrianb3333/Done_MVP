import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { QrCode, Share2, Users, Target, BarChart3 } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { fetchDrillHistory, DrillResultRow } from '@/services/drillResultsService';
import ShareCardModal, { ShareCardType } from '@/components/ShareCardModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QR_SIZE = 220;

function getQrImageUrl(value: string, size: number = 400): string {
  const encoded = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=FFFFFF&color=1A1A1A&format=png&margin=8`;
}

export default function QrModal() {
  const router = useRouter();
  const { profile } = useProfile();
  const { lastRound } = useSession();
  const username = profile?.display_name || profile?.username || 'User';
  const userHandle = profile?.username || 'user';
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [qrLoaded, setQrLoaded] = useState<boolean>(false);
  const [shareCardVisible, setShareCardVisible] = useState<boolean>(false);
  const [shareCardType, setShareCardType] = useState<ShareCardType>('lastRound');
  const [lastPractice, setLastPractice] = useState<DrillResultRow | null>(null);

  const qrValue = `golfapp://profile/${userHandle}`;
  const qrImageUrl = getQrImageUrl(qrValue, 400);

  useEffect(() => {
    console.log('[QR] Fetching last practice drill...');
    fetchDrillHistory().then((results) => {
      if (results.length > 0) {
        setLastPractice(results[0]);
        console.log('[QR] Last practice loaded:', results[0].drill_name);
      } else {
        console.log('[QR] No practice history found');
      }
    }).catch((err) => {
      console.log('[QR] Error fetching drill history:', err);
    });
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page < 2) {
      setCurrentPage(page);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentPage]);

  const scrollToQR = useCallback(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: true });
    setCurrentPage(0);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const openShareCard = useCallback((type: ShareCardType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[QR] Opening share card:', type);
    setShareCardType(type);
    setShareCardVisible(true);
  }, []);

  const handleShareQR = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[QR] Opening QR share card');
    setShareCardType('qrCode');
    setShareCardVisible(true);
  }, []);

  const handleShotOverview = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', 'Shot Overview sharing will be available soon.');
  }, []);

  const handleAffiliate = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', 'Affiliate sharing will be available soon.');
  }, []);

  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#BFF3FF', '#3FB8E8', '#0F6FAF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <GlassBackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{username}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleShareQR}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            testID="qr-header-share"
          >
            <Share2 size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={scrollToQR}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            testID="qr-header-mini-qr"
          >
            <QrCode size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dotsRow}>
        <View style={[styles.dot, currentPage === 0 && styles.dotActive]} />
        <View style={[styles.dot, currentPage === 1 && styles.dotActive]} />
      </View>

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
            <View style={styles.qrImageWrapper}>
              {!qrLoaded && (
                <View style={styles.qrLoadingOverlay}>
                  <ActivityIndicator size="large" color="#1A1A1A" />
                </View>
              )}
              <Image
                source={{ uri: qrImageUrl }}
                style={styles.qrImage}
                onLoad={() => {
                  console.log('[QR] QR image loaded');
                  setQrLoaded(true);
                }}
                onError={() => {
                  console.log('[QR] QR image failed to load');
                  setQrLoaded(true);
                }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrUsername}>@{userHandle}</Text>
            <Text style={styles.qrHint}>Scan to add as friend</Text>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridBtn}
              activeOpacity={0.7}
              onPress={() => openShareCard('lastRound')}
              testID="qr-last-round"
            >
              <BarChart3 size={22} color="#FFFFFF" />
              <Text style={styles.gridBtnText}>Last Round</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gridBtn}
              activeOpacity={0.7}
              onPress={() => openShareCard('lastPractice')}
              testID="qr-last-practice"
            >
              <Target size={22} color="#FFFFFF" />
              <Text style={styles.gridBtnText}>Last Practice</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridBtn}
              activeOpacity={0.7}
              onPress={handleShotOverview}
              testID="qr-shot-overview"
            >
              <BarChart3 size={22} color="#FFFFFF" />
              <Text style={styles.gridBtnText}>Shot Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gridBtn}
              activeOpacity={0.7}
              onPress={handleAffiliate}
              testID="qr-affiliate"
            >
              <Share2 size={22} color="#FFFFFF" />
              <Text style={styles.gridBtnText}>Affiliate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.page}>
          <View style={styles.scanCard}>
            <View style={styles.scanIconCircle}>
              <Users size={48} color="#1A1A1A" />
            </View>
            <Text style={styles.scanTitle}>Scan a Friend</Text>
            <Text style={styles.scanDescription}>
              Point your camera at another player&apos;s QR code to instantly add them as a friend and start tracking rounds together.
            </Text>

            <TouchableOpacity style={styles.scanBtn} activeOpacity={0.8}>
              <QrCode size={20} color="#FFFFFF" />
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

      <ShareCardModal
        visible={shareCardVisible}
        onClose={() => setShareCardVisible(false)}
        type={shareCardType}
        lastRound={lastRound}
        lastPractice={lastPractice}
        qrImageUrl={qrImageUrl}
        username={username}
        userHandle={userHandle}
        displayName={profile?.display_name || username}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  qrImageWrapper: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: 20,
    overflow: 'hidden' as const,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  qrLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1,
    backgroundColor: '#FFFFFF',
  },
  qrUsername: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  qrHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  gridRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 12,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gridBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scanCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  scanIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  scanDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  scanBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  recentScansSection: {
    marginTop: 28,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyScans: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emptyScansText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});
