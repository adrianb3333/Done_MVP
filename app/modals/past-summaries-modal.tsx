import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEK_ITEM_WIDTH = 52;

function getWeeksInYear(year: number): number {
  const dec31 = new Date(year, 11, 31);
  const dayOfWeek = dec31.getDay();
  if (dayOfWeek === 4 || (dayOfWeek === 5 && isLeapYear(year))) {
    return 53;
  }
  return 52;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getCurrentWeek(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((diff + startOfYear.getDay() * 24 * 60 * 60 * 1000) / oneWeek);
}

export default function PastSummariesModal() {
  const insets = useSafeAreaInsets();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedWeek, setSelectedWeek] = useState<number>(getCurrentWeek());
  const [yearPickerVisible, setYearPickerVisible] = useState<boolean>(false);
  const weekScrollRef = useRef<ScrollView>(null);

  const appStartYear = 2024;
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = appStartYear; y <= currentYear; y++) {
      years.push(y);
    }
    return years.reverse();
  }, [currentYear]);

  const totalWeeks = useMemo(() => getWeeksInYear(selectedYear), [selectedYear]);

  const weeks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 1; i <= totalWeeks; i++) {
      arr.push(i);
    }
    return arr;
  }, [totalWeeks]);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setYearPickerVisible(false);
    if (year === currentYear) {
      setSelectedWeek(getCurrentWeek());
    } else {
      setSelectedWeek(1);
    }
    console.log('[PastSummaries] Selected year:', year);
  };

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

  const handleWeekSelect = (week: number) => {
    setSelectedWeek(week);
    console.log('[PastSummaries] Selected week:', week);
  };

  const handleDaySelect = useCallback((day: string) => {
    setSelectedDay((prev) => (prev === day ? null : day));
    console.log('[PastSummaries] Selected day:', day);
  }, []);

  const isCurrentWeek = (week: number) => {
    return selectedYear === currentYear && week === getCurrentWeek();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Summaries</Text>
      </View>

      <TouchableOpacity
        style={styles.yearSelector}
        onPress={() => setYearPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.yearText}>{selectedYear}</Text>
        <ChevronDown size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.weeksContainer}>
        <ScrollView
          ref={weekScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeksScroll}
        >
          {weeks.map((week) => {
            const active = selectedWeek === week;
            const current = isCurrentWeek(week);
            return (
              <TouchableOpacity
                key={week}
                onPress={() => handleWeekSelect(week)}
                activeOpacity={0.7}
                style={[
                  styles.weekItem,
                  active && styles.weekItemActive,
                ]}
              >
                <Text style={[
                  styles.weekLabel,
                  active && styles.weekLabelActive,
                ]}>
                  W{week}
                </Text>
                {current && <View style={styles.currentDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day) => {
          const active = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => handleDaySelect(day)}
              activeOpacity={0.7}
              style={[styles.dayItem, active && styles.dayItemActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.emptyContent}>
        <Text style={styles.emptyText}>No summaries for this week</Text>
      </View>

      <Modal
        visible={yearPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.yearOverlay}
          activeOpacity={1}
          onPress={() => setYearPickerVisible(false)}
        >
          <View style={styles.yearPickerCard}>
            <Text style={styles.yearPickerTitle}>Select Year</Text>
            <FlatList
              data={availableYears}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.yearOption,
                    item === selectedYear && styles.yearOptionActive,
                  ]}
                  onPress={() => handleYearSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.yearOptionText,
                    item === selectedYear && styles.yearOptionTextActive,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.yearList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  yearSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    marginBottom: 12,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  weeksContainer: {
    height: 52,
    marginBottom: 20,
  },
  weeksScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center' as const,
  },
  weekItem: {
    width: WEEK_ITEM_WIDTH,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  weekItemActive: {
    backgroundColor: '#5BBF7F',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  weekLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5BBF7F',
    marginTop: 3,
  },
  daysContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 20,
  },
  dayItem: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dayItemActive: {
    backgroundColor: '#5BBF7F',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center' as const,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.35)',
  },
  yearOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  yearPickerCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH - 80,
    maxHeight: 320,
  },
  yearPickerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  yearList: {
    maxHeight: 240,
  },
  yearOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  yearOptionActive: {
    backgroundColor: '#5BBF7F',
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
  },
  yearOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
});
