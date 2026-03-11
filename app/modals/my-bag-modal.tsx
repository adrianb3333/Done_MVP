import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ClubCategory {
  name: string;
  clubs: string[];
}

const CATEGORY_ORDER = ['Putter', 'Woods', 'Hybrids', 'Irons', 'Wedges'];

function categorizeClubs(clubs: string[]): ClubCategory[] {
  const categories: Record<string, string[]> = {
    Putter: [],
    Woods: [],
    Hybrids: [],
    Irons: [],
    Wedges: [],
  };

  for (const club of clubs) {
    if (club === 'Pu') {
      categories['Putter'].push(club);
    } else if (club === 'Dr' || club.endsWith('w')) {
      if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club) || club.endsWith('°')) {
        categories['Wedges'].push(club);
      } else {
        categories['Woods'].push(club);
      }
    } else if (club.endsWith('h')) {
      categories['Hybrids'].push(club);
    } else if (club.endsWith('i')) {
      categories['Irons'].push(club);
    } else if (club.endsWith('°')) {
      categories['Wedges'].push(club);
    }
  }

  return CATEGORY_ORDER
    .filter((name) => categories[name].length > 0)
    .map((name) => ({ name, clubs: categories[name] }));
}

function getClubDisplayName(club: string): string {
  if (club === 'Pu') return 'Putter';
  if (club === 'Dr') return 'Driver';
  if (club.endsWith('°')) return club;
  if (['Pw', 'Sw', 'Aw', 'Gw', 'Lw', 'Uw'].includes(club)) {
    const map: Record<string, string> = {
      Pw: 'PW',
      Sw: 'SW',
      Aw: 'AW',
      Gw: 'GW',
      Lw: 'LW',
      Uw: 'UW',
    };
    return map[club] ?? club;
  }
  if (club.endsWith('w')) return `${club.replace('w', '')}W`;
  if (club.endsWith('h')) return `${club.replace('h', '')}H`;
  if (club.endsWith('i')) return `${club.replace('i', '')}i`;
  return club;
}

export default function MyBagModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clubs: string }>();
  const clubs: string[] = params.clubs ? JSON.parse(params.clubs) : [];
  const categorized = categorizeClubs(clubs);

  const handleExit = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismiss(3);
  }, [router]);

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bag</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categorized.map((category) => (
          <View key={category.name} style={styles.categoryBlock}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.clubsRow}>
              {category.clubs.map((club) => (
                <View key={club} style={styles.clubCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
                    style={styles.clubCircle}
                  >
                    <Text style={styles.clubCircleText}>{club}</Text>
                  </LinearGradient>
                  <Text style={styles.clubLabel}>{getClubDisplayName(club)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={handleExit}
            activeOpacity={0.8}
            testID="my-bag-exit-button"
          >
            <MaskedView
              maskElement={
                <Text style={styles.exitTextMask}>EXIT</Text>
              }
            >
              <LinearGradient
                colors={['#4BA35B', '#3D954D', '#2D803D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.exitTextMask, { opacity: 0 }]}>EXIT</Text>
              </LinearGradient>
            </MaskedView>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeTop: {},
  safeBottom: {},
  header: {
    alignItems: 'center' as const,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  categoryBlock: {
    marginBottom: 28,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  clubsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 14,
  },
  clubCard: {
    alignItems: 'center' as const,
    width: (SCREEN_WIDTH - 40 - 56) / 5,
    minWidth: 58,
  },
  clubCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  clubCircleText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  clubLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  exitBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  exitTextMask: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 1.5,
  },
});
