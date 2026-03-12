import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Search, Star } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabCourse, { CourseTab } from '@/components/PlaSta/TabCourse';
import { searchGolfCourses, getGolfCourseDetail, getDefaultMaleTee } from '@/services/golfCourseApi';

const STORAGE_KEY_COURSE = 'play_setup_selected_course';
const STORAGE_KEY_COURSE_HOLES = 'play_setup_course_holes';
const STORAGE_KEY_COURSE_LOCATION = 'play_setup_course_location';
const STORAGE_KEY_FAVORITES = 'play_setup_favorite_courses';

interface DisplayCourse {
  id: string;
  apiId: number;
  name: string;
  clubName: string;
  city: string;
  country: string;
  holes: number;
  par: number;
}

export default function CourseModal() {
  const [activeTab, setActiveTab] = useState<CourseTab>('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<DisplayCourse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  React.useEffect(() => {
    void loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      console.log('[CourseModal] Error loading favorites:', e);
    }
  };

  const toggleFavorite = useCallback(async (courseId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchGolfCourses(searchQuery.trim());
      const mapped: DisplayCourse[] = results.map((r) => ({
        id: `api-${r.id}`,
        apiId: r.id,
        name: r.course_name,
        clubName: r.club_name,
        city: r.location?.city ?? '',
        country: r.location?.country ?? '',
        holes: 18,
        par: 72,
      }));
      setSearchResults(mapped);
      console.log('[CourseModal] Search found:', mapped.length, 'courses');
    } catch (e) {
      console.log('[CourseModal] Search error:', e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectCourse = async (course: DisplayCourse) => {
    setIsSelecting(true);
    try {
      const detail = await getGolfCourseDetail(course.apiId);
      if (detail) {
        const tee = getDefaultMaleTee(detail);
        const holeData = tee?.holes ?? [];
        const parTotal = tee?.par_total ?? 72;
        const numHoles = tee?.number_of_holes ?? 18;

        const toStore = {
          id: course.id,
          apiId: course.apiId,
          name: detail.course_name,
          clubName: detail.club_name,
          holes: numHoles,
          par: parTotal,
          city: detail.location?.city ?? '',
          country: detail.location?.country ?? '',
        };
        await AsyncStorage.setItem(STORAGE_KEY_COURSE, JSON.stringify(toStore));

        const holesArray = holeData.map((h, idx) => ({
          number: idx + 1,
          par: h.par,
          yardage: h.yardage,
          handicap: h.handicap,
        }));
        await AsyncStorage.setItem(STORAGE_KEY_COURSE_HOLES, JSON.stringify(holesArray));

        const locationData = {
          latitude: detail.location?.latitude ?? null,
          longitude: detail.location?.longitude ?? null,
          address: detail.location?.address ?? '',
        };
        await AsyncStorage.setItem(STORAGE_KEY_COURSE_LOCATION, JSON.stringify(locationData));

        console.log('[CourseModal] Selected course:', detail.course_name, 'with', holesArray.length, 'holes');
      } else {
        const toStore = {
          id: course.id,
          apiId: course.apiId,
          name: course.name,
          clubName: course.clubName,
          holes: course.holes,
          par: course.par,
          city: course.city,
          country: course.country,
        };
        await AsyncStorage.setItem(STORAGE_KEY_COURSE, JSON.stringify(toStore));
      }
    } catch (e) {
      console.log('[CourseModal] Error saving course:', e);
    } finally {
      setIsSelecting(false);
    }
    router.back();
  };

  const filteredCourses = useMemo(() => {
    if (activeTab === 'favorite') {
      return searchResults.filter((c) => favorites.includes(c.id));
    }
    return searchResults;
  }, [activeTab, searchResults, favorites]);

  const renderCourseItem = ({ item }: { item: DisplayCourse }) => {
    const isFav = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.courseRow}
        onPress={() => handleSelectCourse(item)}
        activeOpacity={0.6}
        disabled={isSelecting}
      >
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{item.name}</Text>
          <View style={styles.courseSubRow}>
            <Text style={styles.courseClub}>{item.clubName}</Text>
            <MapPin size={12} color="#999" />
          </View>
          {(item.city || item.country) ? (
            <Text style={styles.courseCity}>
              {[item.city, item.country].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star
            size={20}
            color={isFav ? '#FFB74D' : '#ccc'}
            fill={isFav ? '#FFB74D' : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>BANOR</Text>
        <View style={styles.headerIcons}>
          <MapPin size={22} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search golf courses..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            activeOpacity={0.7}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.searchBtnText}>Sök</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          <TabCourse
            activeTab={activeTab}
            onTabChange={setActiveTab}
            playedCount={0}
          />
        </View>
      </View>

      {isSelecting && (
        <View style={styles.selectingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.selectingText}>Loading course data...</Text>
        </View>
      )}

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isSearching ? (
              <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
            ) : (
              <Text style={styles.emptyText}>
                {hasSearched
                  ? 'No courses found. Try a different search.'
                  : 'Search for a golf course by name'}
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  searchBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  tabRow: {
    marginBottom: 8,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  courseSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  courseClub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  courseCity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  favBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  selectingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  selectingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
