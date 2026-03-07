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
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, QrCode, Share2, Users, Calendar, Target, BarChart3, Trophy } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useProfile } from '@/contexts/ProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QR_SIZE = 220;

function getQrImageUrl(value: string, size: number = 400): string {
  const encoded = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=1A1A1A&color=EFEFEF&format=png&margin=8`;
}

export default function QrModal() {
  const router = useRouter();
  const { profile } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';
  const userHandle = profile?.username || 'user';
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [qrLoaded, setQrLoaded] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const qrValue = `golfapp://profile/${userHandle}`;
  const qrImageUrl = getQrImageUrl(qrValue, 400);

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

  const handleShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[QR] Share button pressed');

    if (Platform.OS === 'web') {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `${username}'s Golf Profile`,
            text: `Check out @${userHandle} on Golf App!`,
            url: qrValue,
          });
          console.log('[QR] Web share completed');
        } else {
          await navigator.clipboard.writeText(qrValue);
          Alert.alert('Copied!', 'Profile link copied to clipboard');
          console.log('[QR] Copied to clipboard (web)');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('[QR] Web share error:', err.message);
        }
      }
      return;
    }

    setIsSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
        console.log('[QR] Sharing not available');
        setIsSharing(false);
        return;
      }

      console.log('[QR] Downloading QR image for sharing');
      const output = await File.downloadFileAsync(qrImageUrl, new File(Paths.cache, `qr_${userHandle}.png`));
      console.log('[QR] Download complete, exists:', output.exists);

      if (output.exists) {
        await Sharing.shareAsync(output.uri, {
          mimeType: 'image/png',
          dialogTitle: `Share @${userHandle}'s QR Code`,
        });
        console.log('[QR] Share dialog opened');
      } else {
        Alert.alert('Error', 'Could not download QR code for sharing.');
        console.log('[QR] Download failed');
      }
    } catch (err: any) {
      console.log('[QR] Share error:', err.message);
      Alert.alert('Error', 'Something went wrong while sharing.');
    } finally {
      setIsSharing(false);
    }
  }, [username, userHandle, qrValue, qrImageUrl]);

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
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              disabled={isSharing}
              testID="qr-header-share"
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#EFEFEF" />
              ) : (
                <Share2 size={18} color="#EFEFEF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={scrollToQR}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              testID="qr-header-mini-qr"
            >
              <QrCode size={18} color="#EFEFEF" />
            </TouchableOpacity>
          </View>
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
            <View style={styles.qrImageWrapper}>
              {!qrLoaded && (
                <View style={styles.qrLoadingOverlay}>
                  <ActivityIndicator size="large" color="#1DB954" />
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

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} testID="qr-affiliate-btn">
              <Users size={20} color="#1DB954" />
              <Text style={styles.actionText}>Affiliate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.gridBtn} activeOpacity={0.7} testID="qr-last-round">
              <BarChart3 size={22} color="#1DB954" />
              <Text style={styles.gridBtnText}>Last Round</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridBtn} activeOpacity={0.7} testID="qr-last-practice">
              <Target size={22} color="#1DB954" />
              <Text style={styles.gridBtnText}>Last Practice</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.gridBtn} activeOpacity={0.7} testID="qr-shot-overview">
              <BarChart3 size={22} color="#1DB954" />
              <Text style={styles.gridBtnText}>Shot Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridBtn} activeOpacity={0.7} testID="qr-tournament">
              <Trophy size={22} color="#1DB954" />
              <Text style={styles.gridBtnText}>Tournament</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.eventBtn} activeOpacity={0.8} testID="qr-event-btn">
            <Calendar size={20} color="#fff" />
            <Text style={styles.eventBtnText}>EVENT</Text>
          </TouchableOpacity>
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
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#222',
  },
  qrImageWrapper: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: 20,
    overflow: 'hidden' as const,
    backgroundColor: '#1A1A1A',
    marginBottom: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    backgroundColor: '#1A1A1A',
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
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#1A1A1A',
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
  gridRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 12,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  gridBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#EFEFEF',
  },
  eventBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  eventBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  scanCard: {
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
