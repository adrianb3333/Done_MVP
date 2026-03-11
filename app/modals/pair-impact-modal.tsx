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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Bluetooth, ChevronRight, ChevronLeft, Zap, BarChart3, Target } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INFO_PAGES = [
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
];

interface ClubCategory {
  name: string;
  clubs: string[];
  defaultVisible: boolean;
}

const CLUB_CATEGORIES: ClubCategory[] = [
  {
    name: 'Woods',
    clubs: ['Dr', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w', '10w', '11w', '12w', '13w', '14w', '15w'],
    defaultVisible: true,
  },
  {
    name: 'Hybrids',
    clubs: ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h'],
    defaultVisible: true,
  },
  {
    name: 'Irons',
    clubs: ['1i', '2i', '3i', '4i', '5i', '6i', '7i', '8i', '9i', '10i', '11i', '12i', '13i', '14i', '15i'],
    defaultVisible: true,
  },
  {
    name: 'Wedges',
    clubs: ['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw', '50°', '51°', '52°', '53°', '54°', '55°', '56°', '57°', '58°', '60°', '62°', '64°'],
    defaultVisible: true,
  },
  {
    name: 'Others',
    clubs: [],
    defaultVisible: false,
  },
];

const TOTAL_PAGES = INFO_PAGES.length + 1;
const REQUIRED_CLUBS = 13;

export default function PairImpactModal() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [visibleCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CLUB_CATEGORIES.forEach((cat) => {
      initial[cat.name] = cat.defaultVisible;
    });
    initial['Putter'] = true;
    return initial;
  });

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page < TOTAL_PAGES) {
      setCurrentPage(page);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
    setCurrentPage(page);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleClub = useCallback((club: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(club)) {
        next.delete(club);
      } else {
        if (next.size >= REQUIRED_CLUBS) {
          Alert.alert('Maximum Reached', `You can only select ${REQUIRED_CLUBS} clubs.`);
          return prev;
        }
        next.add(club);
      }
      return next;
    });
  }, []);


  const handleStartPairing = useCallback(() => {
    if (selectedClubs.size < REQUIRED_CLUBS) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Select All Clubs', `Please select all ${REQUIRED_CLUBS} clubs before pairing.`);
      return;
    }
    console.log('[PairImpact] Start pairing with clubs:', Array.from(selectedClubs));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const orderedClubs = getOrderedClubs(selectedClubs);
    router.push({
      pathname: '/modals/pairing-process-modal',
      params: { clubs: JSON.stringify(orderedClubs) },
    });
  }, [selectedClubs, router]);

  const isLastPage = currentPage === TOTAL_PAGES - 1;

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
            testID="pair-close-button"
          >
            <ChevronDown size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pair Sensors</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
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
        {INFO_PAGES.map((page) => {
          const IconComp = page.icon;
          return (
            <View key={page.id} style={styles.page}>
              <View style={styles.pageContent}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <IconComp size={48} color="#fff" />
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

        <View style={[styles.page, { paddingHorizontal: 0 }]}>
          <ClubSelectionPage
            selectedClubs={selectedClubs}
            visibleCategories={visibleCategories}
            onToggleClub={toggleClub}
          />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          {isLastPage ? (
            <TouchableOpacity
              style={[
                styles.startPairingBtn,
                selectedClubs.size < REQUIRED_CLUBS && styles.startPairingBtnDisabled,
              ]}
              onPress={handleStartPairing}
              activeOpacity={0.8}
              testID="start-pairing-button"
            >
              <Bluetooth size={20} color={selectedClubs.size >= REQUIRED_CLUBS ? '#2D803D' : '#999'} />
              <MaskedView
                maskElement={
                  <Text style={styles.startPairingTextMask}>Start Pairing</Text>
                }
              >
                {selectedClubs.size >= REQUIRED_CLUBS ? (
                  <LinearGradient
                    colors={['#4BA35B', '#3D954D', '#2D803D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.startPairingTextMask, { opacity: 0 }]}>Start Pairing</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.startPairingTextMask, { color: '#999' }]}>Start Pairing</Text>
                )}
              </MaskedView>
            </TouchableOpacity>
          ) : (
            <View style={styles.navRow}>
              {currentPage > 0 ? (
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => goToPage(currentPage - 1)}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
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
    </LinearGradient>
  );
}

function getOrderedClubs(selectedClubs: Set<string>): string[] {
  const ordered: string[] = ['Pu'];
  const categoryOrder = ['Woods', 'Hybrids', 'Irons', 'Wedges'];
  for (const catName of categoryOrder) {
    const cat = CLUB_CATEGORIES.find((c) => c.name === catName);
    if (cat) {
      for (const club of cat.clubs) {
        if (selectedClubs.has(club)) {
          ordered.push(club);
        }
      }
    }
  }
  return ordered;
}

interface ClubSelectionPageProps {
  selectedClubs: Set<string>;
  visibleCategories: Record<string, boolean>;
  onToggleClub: (club: string) => void;
}

function ClubSelectionPage({ selectedClubs, visibleCategories, onToggleClub }: ClubSelectionPageProps) {
  return (
    <View style={clubStyles.container}>
      <View style={clubStyles.topRow}>
        <Text style={clubStyles.selectHeader}>Select {REQUIRED_CLUBS} clubs you Play!</Text>
        <View style={clubStyles.putterArea}>
          <LinearGradient
            colors={['#4BA35B', '#3D954D', '#2D803D']}
            style={clubStyles.putterCircle}
          >
            <Text style={clubStyles.putterText}>Pu</Text>
          </LinearGradient>
          <Text style={clubStyles.putterLabel}>Putter</Text>
        </View>
      </View>

      <View style={clubStyles.counterRow}>
        <Text style={clubStyles.counterText}>{selectedClubs.size}/{REQUIRED_CLUBS} selected</Text>
      </View>

      <ScrollView
        style={clubStyles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={clubStyles.scrollContent}
      >
        {CLUB_CATEGORIES.map((category) => (
          <View key={category.name} style={clubStyles.categoryBlock}>
            <View style={clubStyles.categoryHeader}>
              <Text style={clubStyles.categoryName}>{category.name}</Text>
            </View>
            {visibleCategories[category.name] && category.clubs.length > 0 && (
              <View style={clubStyles.clubGrid}>
                {category.clubs.map((club) => {
                  const isSelected = selectedClubs.has(club);
                  return (
                    <TouchableOpacity
                      key={club}
                      onPress={() => onToggleClub(club)}
                      activeOpacity={0.7}
                      style={clubStyles.clubTouchArea}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#4BA35B', '#3D954D', '#2D803D'] : ['#4BA35B', '#3D954D', '#2D803D']}
                        style={[
                          clubStyles.clubCircle,
                          isSelected && clubStyles.clubCircleSelected,
                        ]}
                      >
                        <Text style={clubStyles.clubText}>{club}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const clubStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 4,
  },
  selectHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
    paddingTop: 8,
  },
  putterArea: {
    alignItems: 'center' as const,
  },
  putterCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  putterText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  putterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  counterRow: {
    marginBottom: 12,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  clubGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  clubTouchArea: {},
  clubCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clubCircleSelected: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  clubText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: '#fff',
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
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  pageDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  detailCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 20,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
    textAlign: 'center' as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  startPairingBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  startPairingBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  startPairingTextMask: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#000',
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
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600' as const,
  },
  navBtnPlaceholder: {
    width: 80,
  },
  navBtnNext: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navBtnNextText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
  },
});
