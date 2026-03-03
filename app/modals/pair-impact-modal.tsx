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
import { X, Bluetooth, ChevronRight, ChevronLeft, Zap, BarChart3, Target, Smartphone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGES = [
  {
    id: 1,
    icon: Bluetooth,
    iconColor: '#4A90D9',
    title: 'What is Impact Pairing?',
    description: 'Impact sensors connect to your clubs and track every shot you hit — giving you real-time data on your game.',
    detail: 'Pair your Impact products via Bluetooth to unlock advanced shot tracking, swing analytics, and more.',
  },
  {
    id: 2,
    icon: Zap,
    iconColor: '#F5A623',
    title: 'Shot Tracking',
    description: 'Every shot is automatically detected and recorded with distance, speed, and trajectory data.',
    detail: 'No more manual input — just play your game and let the sensors do the work.',
  },
  {
    id: 3,
    icon: BarChart3,
    iconColor: '#1DB954',
    title: 'Advanced Analytics',
    description: 'Get deep insights into your game with detailed statistics and performance trends.',
    detail: 'Compare rounds, identify weaknesses, and track your improvement over time.',
  },
  {
    id: 4,
    icon: Target,
    iconColor: '#FF6B6B',
    title: 'Smart Recommendations',
    description: 'Receive personalized practice drills and tips based on your real performance data.',
    detail: 'Our AI analyzes your patterns and suggests the most impactful areas to improve.',
  },
  {
    id: 5,
    icon: Smartphone,
    iconColor: '#A78BFA',
    title: 'Ready to Pair',
    description: 'Make sure your Impact sensor is turned on and Bluetooth is enabled on your device.',
    detail: 'Tap the button below to start scanning for nearby Impact products.',
  },
];

export default function PairImpactModal() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page < PAGES.length) {
      setCurrentPage(page);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
    setCurrentPage(page);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleStartPairing = useCallback(() => {
    console.log('[PairImpact] Start pairing pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  }, [router]);

  const isLastPage = currentPage === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
            testID="pair-close-button"
          >
            <X size={22} color="#999" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pair Impact Products</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.dotsRow}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentPage === i && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {PAGES.map((page) => {
          const IconComp = page.icon;
          return (
            <View key={page.id} style={styles.page}>
              <View style={styles.pageContent}>
                <View style={[styles.iconCircle, { backgroundColor: page.iconColor + '18' }]}>
                  <IconComp size={48} color={page.iconColor} />
                </View>
                <Text style={styles.pageTitle}>{page.title}</Text>
                <Text style={styles.pageDescription}>{page.description}</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.detailText}>{page.detail}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          {isLastPage ? (
            <TouchableOpacity
              style={styles.startPairingBtn}
              onPress={handleStartPairing}
              activeOpacity={0.8}
              testID="start-pairing-button"
            >
              <Bluetooth size={20} color="#fff" />
              <Text style={styles.startPairingText}>Start Pairing</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navRow}>
              {currentPage > 0 ? (
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => goToPage(currentPage - 1)}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color="#B0B0B0" />
                  <Text style={styles.navBtnText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.navBtnPlaceholder} />
              )}
              <TouchableOpacity
                style={styles.navBtnNext}
                onPress={() => goToPage(currentPage + 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.navBtnNextText}>Next</Text>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeTop: {},
  safeBottom: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeBtn: {
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
    paddingVertical: 12,
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
  pagerContent: {},
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  pageContent: {
    alignItems: 'center' as const,
    width: '100%' as const,
    marginTop: -40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#EFEFEF',
    textAlign: 'center' as const,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  pageDescription: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  detailCard: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 20,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: '#222',
  },
  detailText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
    textAlign: 'center' as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  startPairingBtn: {
    backgroundColor: '#1DB954',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  startPairingText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  navRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  navBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navBtnText: {
    fontSize: 15,
    color: '#B0B0B0',
    fontWeight: '600' as const,
  },
  navBtnPlaceholder: {
    width: 80,
  },
  navBtnNext: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  navBtnNextText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
  },
});
