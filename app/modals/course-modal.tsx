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
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, MapPin, Search, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabCourse, { CourseTab } from '@/components/PlaSta/TabCourse';

interface GolfCourse {
  id: string;
  name: string;
  clubName: string;
  holes: number;
  par: number;
  city: string;
  country: string;
  rating: number;
  distance: number;
  played: boolean;
}

const STORAGE_KEY_COURSE = 'play_setup_selected_course';
const STORAGE_KEY_FAVORITES = 'play_setup_favorite_courses';

const MOCK_COURSES: GolfCourse[] = [
  { id: 'c1', name: 'Hulta Golfklubb', clubName: 'Hulta GK', holes: 18, par: 72, city: 'Bollebygd', country: 'Sweden', rating: 4.0, distance: 2.0, played: true },
  { id: 'c2', name: 'Chalmers Golfklubb', clubName: 'Chalmers Golfklubb', holes: 18, par: 71, city: 'Landvetter', country: 'Sweden', rating: 4.0, distance: 18.7, played: true },
  { id: 'c3', name: 'Borås Golfklubb', clubName: 'Norra Banan', holes: 18, par: 72, city: 'Borås', country: 'Sweden', rating: 4.5, distance: 21.2, played: true },
  { id: 'c4', name: 'Borås Golfklubb', clubName: 'Södra Banan', holes: 18, par: 69, city: 'Borås', country: 'Sweden', rating: 3.5, distance: 21.3, played: false },
  { id: 'c5', name: 'Marks Golfklubb', clubName: 'Kinnaborg', holes: 18, par: 70, city: 'Kinna', country: 'Sweden', rating: 4.0, distance: 21.3, played: false },
  { id: 'c6', name: 'Göteborg Golfklubb', clubName: 'Hovås', holes: 18, par: 72, city: 'Göteborg', country: 'Sweden', rating: 4.5, distance: 35.1, played: true },
  { id: 'c7', name: 'Kungsbacka Golfklubb', clubName: 'Hamra', holes: 18, par: 71, city: 'Kungsbacka', country: 'Sweden', rating: 3.5, distance: 42.0, played: false },
  { id: 'c8', name: 'Varberg Golfklubb', clubName: 'Varberg GK', holes: 18, par: 72, city: 'Varberg', country: 'Sweden', rating: 4.0, distance: 55.8, played: true },
  { id: 'c9', name: 'Falsterbo Golfklubb', clubName: 'Falsterbo GK', holes: 18, par: 71, city: 'Falsterbo', country: 'Sweden', rating: 5.0, distance: 280.0, played: false },
  { id: 'c10', name: 'Barsebäck Golf & CC', clubName: 'Masters Course', holes: 18, par: 73, city: 'Barsebäck', country: 'Sweden', rating: 4.5, distance: 260.0, played: true },
  { id: 'c11', name: 'Quinta do Lago', clubName: 'South Course', holes: 18, par: 72, city: 'Almancil', country: 'Portugal', rating: 4.5, distance: 3100.0, played: false },
  { id: 'c12', name: 'Valderrama Golf Club', clubName: 'Valderrama', holes: 18, par: 71, city: 'Sotogrande', country: 'Spain', rating: 5.0, distance: 3400.0, played: false },
];

const COUNTRIES = ['Alla länder', 'Sweden', 'Portugal', 'Spain'];

export default function CourseModal() {
  const [activeTab, setActiveTab] = useState<CourseTab>('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Alla länder');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

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

  const playedCount = useMemo(
    () => MOCK_COURSES.filter((c) => c.played).length,
    []
  );

  const filteredCourses = useMemo(() => {
    let list = [...MOCK_COURSES];

    if (selectedCountry !== 'Alla länder') {
      list = list.filter((c) => c.country === selectedCountry);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.clubName.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }

    if (activeTab === 'played') {
      list = list.filter((c) => c.played);
    } else if (activeTab === 'favorite') {
      list = list.filter((c) => favorites.includes(c.id));
    } else {
      list.sort((a, b) => a.distance - b.distance);
    }

    return list;
  }, [activeTab, searchQuery, selectedCountry, favorites]);

  const handleSelectCourse = async (course: GolfCourse) => {
    try {
      const toStore = {
        id: course.id,
        name: course.name,
        clubName: course.clubName,
        holes: course.holes,
        par: course.par,
        city: course.city,
        country: course.country,
      };
      await AsyncStorage.setItem(STORAGE_KEY_COURSE, JSON.stringify(toStore));
      console.log('[CourseModal] Selected course:', course.name);
    } catch (e) {
      console.log('[CourseModal] Error saving course:', e);
    }
    router.back();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i <= Math.floor(rating) ? '#FFB74D' : '#ccc'}
          fill={i <= Math.floor(rating) ? '#FFB74D' : 'transparent'}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderCourseItem = ({ item }: { item: GolfCourse }) => {
    const isFav = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.courseRow}
        onPress={() => handleSelectCourse(item)}
        activeOpacity={0.6}
      >
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{item.name}</Text>
          <View style={styles.courseSubRow}>
            <Text style={styles.courseClub}>
              {item.clubName}, {item.holes}/{item.par}
            </Text>
            <MapPin size={12} color="#999" />
          </View>
          <Text style={styles.courseCity}>{item.city}, {item.country}</Text>
          <View style={styles.courseBottom}>
            {renderStars(item.rating)}
            <Text style={styles.courseDistance}>{item.distance.toFixed(1)} km</Text>
          </View>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BANOR</Text>
        <View style={styles.headerIcons}>
          <MapPin size={22} color="#FFFFFF" />
          <Search size={22} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Sök"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter:</Text>
          <TouchableOpacity
            style={styles.countryPicker}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={styles.countryText}>{selectedCountry}</Text>
            <Text style={styles.countryChevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {showCountryPicker && (
          <View style={styles.countryDropdown}>
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  styles.countryOption,
                  selectedCountry === country && styles.countryOptionActive,
                ]}
                onPress={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.countryOptionText,
                    selectedCountry === country && styles.countryOptionTextActive,
                  ]}
                >
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.tabRow}>
          <TabCourse
            activeTab={activeTab}
            onTabChange={setActiveTab}
            playedCount={playedCount}
          />
        </View>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'favorite'
                ? 'Inga favoritbanor ännu'
                : 'Inga banor hittades'}
            </Text>
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  searchInput: {
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
    textAlign: 'center' as const,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600' as const,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  countryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
    flex: 1,
  },
  countryChevron: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  countryDropdown: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  countryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  countryOptionActive: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  countryOptionText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  countryOptionTextActive: {
    color: '#FFFFFF',
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
  courseBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  courseDistance: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
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
  },
});
