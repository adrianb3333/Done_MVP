import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, BarChart2, TrendingUp, Crosshair, List, Video, Plus, Columns2, Trash2, Flag, Target, Dumbbell, ChevronDown, HelpCircle, Filter, ChevronRight, MapPin, Search, Star } from 'lucide-react-native';
import { useScrollHeader, ScrollHeaderProvider, useScrollHeaderContext } from '@/hooks/useScrollHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabCourse, { CourseTab } from '@/components/PlaSta/TabCourse';
import LiquidGlassCard from '@/components/reusables/LiquidGlassCard';
import SwingThoughtsModal from '@/app/modals/swing-thoughts-modal';
import ClubModal from '@/app/modals/club-modal';
import MentalGameModal from '@/app/modals/mental-game-modal';
import GolfIQModal from '@/app/modals/golf-iq-modal';
import GeneralModal from '@/app/modals/general-modal';
import PreRoundModal from '@/app/modals/pre-round-modal';
import DistancesModal from '@/app/modals/distances-modal';
import StrokesGainedModal from '@/app/modals/strokesgained-modal';
import ShortGameModal from '@/app/modals/shortgame-modal';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useSessions } from '@/store/sessionStore';
import { useSwingStore } from '@/store/swingStore';
import { AnalysisSession } from '@/Types';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTimeStats } from '@/services/roundStatsService';
import { fetchPracticeStats, DrillCategoryStats } from '@/services/practiceStatsService';
import { fetchRoundShotCount, fetchPracticeShotCount } from '@/services/shotCountService';
import RoundStatsDisplay from '@/components/PlaSta/RoundStatsDisplay';

type DataTab = 'stats' | 'sg' | 'shots' | 'details' | 'video';

interface TabConfig {
  key: DataTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { key: 'stats', label: 'Stats', icon: <BarChart2 size={18} /> },
  { key: 'sg', label: 'SG', icon: <TrendingUp size={18} /> },
  { key: 'shots', label: 'Shots', icon: <Crosshair size={18} /> },
  { key: 'details', label: 'Details', icon: <List size={18} /> },
  { key: 'video', label: 'Video', icon: <Video size={18} /> },
];

type StatsSegment = 'round' | 'practice';

const CATEGORY_COLORS: Record<string, string> = {
  Putting: '#4CAF50',
  Wedges: '#FF9800',
  Irons: '#42A5F5',
  Woods: '#AB47BC',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Putting: <Target size={18} color="#4CAF50" />,
  Wedges: <Flag size={18} color="#FF9800" />,
  Irons: <Crosshair size={18} color="#42A5F5" />,
  Woods: <Dumbbell size={18} color="#AB47BC" />,
};

function PracticeCategoryCard({ category }: { category: DrillCategoryStats }) {
  const color = CATEGORY_COLORS[category.category] || '#4FC3F7';
  const icon = CATEGORY_ICONS[category.category];

  return (
    <View style={statsStyles.categoryCard}>
      <View style={statsStyles.categoryHeader}>
        <View style={statsStyles.categoryHeaderLeft}>
          <View style={[statsStyles.categoryIconWrap, { backgroundColor: `${color}15` }]}>
            {icon}
          </View>
          <Text style={statsStyles.categoryName}>{category.category}</Text>
        </View>
        <View style={statsStyles.categoryBadge}>
          <Text style={[statsStyles.categoryBadgeText, { color }]}>
            {category.totalAttempts} sessions
          </Text>
        </View>
      </View>

      {category.overallAvg > 0 && (
        <View style={statsStyles.categoryAvgRow}>
          <Text style={statsStyles.categoryAvgLabel}>Category Avg</Text>
          <View style={statsStyles.categoryAvgBarWrap}>
            <View style={[statsStyles.categoryAvgBar, { width: `${Math.min(category.overallAvg, 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={[statsStyles.categoryAvgValue, { color }]}>{category.overallAvg}%</Text>
        </View>
      )}

      {category.drills.map((drill) => (
        <View key={drill.name} style={statsStyles.drillRow}>
          <View style={statsStyles.drillNameWrap}>
            <Text style={statsStyles.drillName}>{drill.name}</Text>
            <Text style={statsStyles.drillAttempts}>
              {drill.totalAttempts > 0 ? `${drill.totalAttempts} attempts` : 'No data'}
            </Text>
          </View>
          {drill.totalAttempts > 0 ? (
            <View style={statsStyles.drillScores}>
              <View style={statsStyles.drillScoreItem}>
                <Text style={statsStyles.drillScoreLabel}>Avg</Text>
                <Text style={statsStyles.drillScoreValue}>{drill.avgScore}%</Text>
              </View>
              <View style={statsStyles.drillScoreDivider} />
              <View style={statsStyles.drillScoreItem}>
                <Text style={statsStyles.drillScoreLabel}>Best</Text>
                <Text style={[statsStyles.drillScoreValue, { color }]}>{drill.bestScore}%</Text>
              </View>
            </View>
          ) : (
            <Text style={statsStyles.drillNoData}>--</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function StatsContent() {
  const scrollHandler = useScrollHeaderContext();
  const { dataOverviewInitialStatsSegment, clearDataOverviewInitialStatsSegment } = useAppNavigation();
  const [segment, setSegment] = useState<StatsSegment>(dataOverviewInitialStatsSegment || 'round');

  useEffect(() => {
    if (dataOverviewInitialStatsSegment) {
      setSegment(dataOverviewInitialStatsSegment);
      clearDataOverviewInitialStatsSegment();
    }
  }, [dataOverviewInitialStatsSegment, clearDataOverviewInitialStatsSegment]);

  const roundQuery = useQuery({
    queryKey: ['allTimeRoundStats'],
    queryFn: fetchAllTimeStats,
  });

  const practiceQuery = useQuery({
    queryKey: ['practiceStats'],
    queryFn: fetchPracticeStats,
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={statsStyles.segmentWrap}>
        <View style={statsStyles.segmentControl}>
          <TouchableOpacity
            style={[statsStyles.segmentButton, segment === 'round' && statsStyles.segmentButtonActive]}
            onPress={() => setSegment('round')}
            activeOpacity={0.7}
          >
            <Text style={[statsStyles.segmentText, segment === 'round' && statsStyles.segmentTextActive]}>Round</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[statsStyles.segmentButton, segment === 'practice' && statsStyles.segmentButtonActive]}
            onPress={() => setSegment('practice')}
            activeOpacity={0.7}
          >
            <Text style={[statsStyles.segmentText, segment === 'practice' && statsStyles.segmentTextActive]}>Practice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {segment === 'round' ? (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} onScroll={scrollHandler} scrollEventThrottle={16}>
          {roundQuery.isLoading ? (
            <View style={statsStyles.loadingWrap}>
              <ActivityIndicator size="large" color="#4FC3F7" />
              <Text style={statsStyles.loadingText}>Loading round stats...</Text>
            </View>
          ) : roundQuery.data ? (
            <RoundStatsDisplay stats={roundQuery.data} headerLabel="All-Time Round Stats" />
          ) : (
            <View style={styles.placeholderCard}>
              <BarChart2 size={32} color="#4FC3F7" />
              <Text style={styles.placeholderTitle}>No Round Data</Text>
              <Text style={styles.placeholderSub}>Complete a round to see your statistics here</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} onScroll={scrollHandler} scrollEventThrottle={16}>
          {practiceQuery.isLoading ? (
            <View style={statsStyles.loadingWrap}>
              <ActivityIndicator size="large" color="#4FC3F7" />
              <Text style={statsStyles.loadingText}>Loading practice stats...</Text>
            </View>
          ) : practiceQuery.data && practiceQuery.data.length > 0 ? (
            practiceQuery.data.map((cat) => (
              <PracticeCategoryCard key={cat.category} category={cat} />
            ))
          ) : (
            <View style={styles.placeholderCard}>
              <Dumbbell size={32} color="#4FC3F7" />
              <Text style={styles.placeholderTitle}>No Practice Data</Text>
              <Text style={styles.placeholderSub}>Complete drills during practice to see your statistics here</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const statsStyles = StyleSheet.create({
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: '#141C18',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#243028',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#4FC3F7',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#5A6B60',
  },
  segmentTextActive: {
    color: '#000',
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#5A6B60',
    fontWeight: '500' as const,
  },
  categoryCard: {
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#243028',
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  categoryHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  categoryBadge: {
    backgroundColor: '#0F1714',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1C2922',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  categoryAvgRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 10,
  },
  categoryAvgLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    width: 80,
  },
  categoryAvgBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F1714',
  },
  categoryAvgBar: {
    height: 8,
    borderRadius: 4,
  },
  categoryAvgValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    width: 42,
    textAlign: 'right' as const,
  },
  drillRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C2922',
  },
  drillNameWrap: {
    flex: 1,
  },
  drillName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  drillAttempts: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#5A6B60',
    marginTop: 2,
  },
  drillScores: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  drillScoreItem: {
    alignItems: 'center' as const,
  },
  drillScoreLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#5A6B60',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  drillScoreValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  drillScoreDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#243028',
  },
  drillNoData: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2E4038',
  },
});

type SGSegment = 'ovve' | 'ott' | 'app' | 'arg' | 'p';

const SG_SEGMENTS: { key: SGSegment; label: string }[] = [
  { key: 'ovve', label: 'Ovve' },
  { key: 'ott', label: 'OTT' },
  { key: 'app', label: 'APP' },
  { key: 'arg', label: 'ARG' },
  { key: 'p', label: 'P' },
];

const SG_CONFIG: Record<SGSegment, {
  title: string;
  subtitle: string;
  value: number;
  trend: number;
  color: string;
  description: string;
  trendDescription: string;
  trendDirection: 'up' | 'down';
  chartData: number[];
}> = {
  ovve: {
    title: 'Overall Game',
    subtitle: 'SG / Round',
    value: -1.3,
    trend: 1.1,
    color: '#5A6B60',
    description: '',
    trendDescription: '',
    trendDirection: 'up',
    chartData: [],
  },
  ott: {
    title: 'Driving Game',
    subtitle: 'SG Driving / Round',
    value: -2.6,
    trend: -1.2,
    color: '#64B5F6',
    description: "You're losing 2.6 strokes on your drives compared to your overall -1.3 strokes gained.",
    trendDescription: 'Okay, time to reset. Your driving game is trending down by -1.2 SG compared to your last 10 round average.',
    trendDirection: 'down',
    chartData: [-1.0, -0.5, -0.8, 0.5, -0.2, 0.3, -0.5, -1.5, -2.0, -2.6],
  },
  app: {
    title: 'Approach Game',
    subtitle: 'SG Approach / Round',
    value: 1.2,
    trend: 1.0,
    color: '#7E57C2',
    description: "You're gaining 1.2 strokes on your approach shots compared to your overall -1.3 strokes gained.",
    trendDescription: 'Way to go! Your approach game is trending up by +1.0 SG compared to your last 10 round average.',
    trendDirection: 'up',
    chartData: [-1.5, -1.0, -0.5, 0.0, -0.8, -1.2, 0.2, 0.5, 1.0, 1.2],
  },
  arg: {
    title: 'Short Game',
    subtitle: 'SG Short / Round',
    value: 1.0,
    trend: 2.3,
    color: '#E91E8C',
    description: "You're gaining 1.0 strokes on your short shots compared to your overall -1.3 strokes gained.",
    trendDescription: 'Way to go! Your short game is trending up by +2.3 SG compared to your last 10 round average.',
    trendDirection: 'up',
    chartData: [-2.0, -1.5, -0.5, -0.8, 0.0, -0.3, 0.2, 0.5, 0.8, 1.0],
  },
  p: {
    title: 'Putting Game',
    subtitle: 'SG Putting / Round',
    value: -0.9,
    trend: 1.6,
    color: '#F4A261',
    description: "You're losing 0.9 strokes on your putts compared to your overall -1.3 strokes gained.",
    trendDescription: 'Way to go! Your putting game is trending up by +1.6 SG compared to your last 10 round average.',
    trendDirection: 'up',
    chartData: [-1.5, -1.0, 1.0, 0.5, -0.2, 0.0, -0.5, 0.2, 0.5, -0.9],
  },
};

const OVERALL_CATEGORIES = [
  { label: 'Driving', value: -2.6, color: '#E57373', barWidth: 45 },
  { label: 'Approach', value: 1.2, color: '#4CAF50', barWidth: 60 },
  { label: 'Short', value: 1.0, color: '#90A4AE', barWidth: 50 },
  { label: 'Putting', value: -0.9, color: '#B0BEC5', barWidth: 35 },
];

function MiniChart({ data, color, height = 120 }: { data: number[]; color: string; height?: number }) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(Math.abs), 3);
  const chartWidth = 280;
  const barAreaHeight = height;
  const midY = barAreaHeight / 2;
  const stepX = chartWidth / (data.length - 1 || 1);

  return (
    <View style={sgStyles.chartContainer}>
      <View style={sgStyles.chartYAxis}>
        <Text style={sgStyles.chartYLabel}>3</Text>
        <Text style={sgStyles.chartYLabel}>1.5</Text>
        <Text style={sgStyles.chartYLabel}>0</Text>
        <Text style={sgStyles.chartYLabel}>-1.5</Text>
        <Text style={sgStyles.chartYLabel}>3</Text>
      </View>
      <View style={[sgStyles.chartArea, { height: barAreaHeight }]}>
        {data.map((val, i) => {
          const barH = (Math.abs(val) / maxVal) * (barAreaHeight / 2 - 4);
          const isNeg = val < 0;
          return (
            <View
              key={i}
              style={[
                sgStyles.chartBar,
                {
                  left: i * stepX - 8,
                  height: barH,
                  top: isNeg ? midY : midY - barH,
                  backgroundColor: '#243028',
                  width: 16,
                },
              ]}
            />
          );
        })}
        <View style={[sgStyles.chartMidLine, { top: midY }]} />
        {data.map((val, i) => {
          const y = midY - (val / maxVal) * (barAreaHeight / 2 - 4);
          return (
            <View
              key={`dot-${i}`}
              style={[
                sgStyles.chartDot,
                {
                  left: i * stepX - 4,
                  top: y - 4,
                  backgroundColor: i === data.length - 1 ? color : 'transparent',
                  borderColor: color,
                  borderWidth: 2,
                },
              ]}
            />
          );
        })}
        {data.length > 1 && (
          <View style={sgStyles.chartLineContainer}>
            {data.slice(0, -1).map((val, i) => {
              const y1 = midY - (val / maxVal) * (barAreaHeight / 2 - 4);
              const nextVal = data[i + 1];
              const y2 = midY - (nextVal / maxVal) * (barAreaHeight / 2 - 4);
              const x1 = i * stepX;
              const x2 = (i + 1) * stepX;
              const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
              const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
              return (
                <View
                  key={`line-${i}`}
                  style={[
                    sgStyles.chartLine,
                    {
                      left: x1,
                      top: y1,
                      width: length,
                      backgroundColor: color,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: 'left center',
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
        <View style={sgStyles.chartRightLabel}>
          <Text style={sgStyles.chartLatestText}>Latest</Text>
          <Text style={sgStyles.chartLatestText}>Round</Text>
        </View>
      </View>
    </View>
  );
}

function SGOverallView() {
  const scrollHandler = useScrollHeaderContext();
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} onScroll={scrollHandler} scrollEventThrottle={16}>
      <View style={sgStyles.compareBar}>
        <Text style={sgStyles.compareText}>
          Compared to a <Text style={sgStyles.compareBold}>0 HCP</Text> using <Text style={sgStyles.compareBold}>10 Round Avg</Text>
          <Text style={sgStyles.compareChevron}> ▾</Text>
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Filter size={18} color="#8A9B90" />
        </TouchableOpacity>
      </View>

      <View style={sgStyles.titleRow}>
        <View style={sgStyles.titleLeft}>
          <Text style={sgStyles.gameTitle}>Overall Game</Text>
          <ChevronDown size={16} color="#F5F7F6" />
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <HelpCircle size={20} color="#8A9B90" />
        </TouchableOpacity>
      </View>

      <View style={sgStyles.mainCard}>
        <Text style={sgStyles.cardHeader}>Your Strokes Gained (SG) Breakdown</Text>
        <View style={sgStyles.bigValueRow}>
          <Text style={sgStyles.bigValue}>-1.3</Text>
          <View style={sgStyles.trendBadge}>
            <Text style={sgStyles.trendArrow}>▲</Text>
            <Text style={sgStyles.trendValue}>1.1</Text>
          </View>
        </View>
        <Text style={sgStyles.bigSubtitle}>SG / Round</Text>

        <Text style={sgStyles.cardDescription}>
          You lose 1.3 strokes per round compared to a 0 HCP. Your{' '}
          <Text style={sgStyles.descHighlightGreen}>overall game has improved by 1.1 strokes</Text>{' '}
          over your last 10 rounds.
        </Text>

        <View style={sgStyles.categoryGrid}>
          {OVERALL_CATEGORIES.map((cat) => (
            <View key={cat.label} style={sgStyles.categoryItem}>
              <View style={sgStyles.categoryBarContainer}>
                <View style={[sgStyles.categoryBar, { width: cat.barWidth, backgroundColor: cat.color }]} />
              </View>
              <Text style={sgStyles.categoryLabel}>{cat.label}</Text>
              <Text style={[sgStyles.categoryValue, { color: cat.value >= 0 ? '#4CAF50' : '#E57373' }]}>
                {cat.value >= 0 ? '+' : ''}{cat.value.toFixed(1)}
              </Text>
              <TouchableOpacity style={sgStyles.categorySgLink} activeOpacity={0.7}>
                <Text style={sgStyles.categorySgText}>SG</Text>
                <ChevronRight size={12} color="#8A9B90" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={sgStyles.handicapLink} activeOpacity={0.7}>
          <Text style={sgStyles.handicapLinkText}>Show Handicap Breakdown</Text>
          <ChevronRight size={14} color="#8A9B90" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SGCategoryView({ segment }: { segment: SGSegment }) {
  const scrollHandler = useScrollHeaderContext();
  const config = SG_CONFIG[segment];
  const isPositive = config.value >= 0;
  const valueStr = (isPositive ? '+' : '') + config.value.toFixed(1);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} onScroll={scrollHandler} scrollEventThrottle={16}>
      <View style={sgStyles.compareBar}>
        <Text style={sgStyles.compareText}>
          Compared to a <Text style={sgStyles.compareBold}>0 HCP</Text> using <Text style={sgStyles.compareBold}>10 Round Avg</Text>
          <Text style={sgStyles.compareChevron}> ▾</Text>
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Filter size={18} color="#8A9B90" />
        </TouchableOpacity>
      </View>

      <View style={sgStyles.titleRow}>
        <View style={sgStyles.titleLeft}>
          <Text style={sgStyles.gameTitle}>{config.title}</Text>
          <ChevronDown size={16} color="#F5F7F6" />
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <HelpCircle size={20} color="#8A9B90" />
        </TouchableOpacity>
      </View>

      <View style={sgStyles.circleWrap}>
        <View style={[sgStyles.circleOuter, { borderColor: config.color }]}>
          <Text style={[sgStyles.circleValue, { color: config.color }]}>{valueStr}</Text>
        </View>
        <Text style={sgStyles.circleSubtitle}>{config.subtitle}</Text>
      </View>

      <Text style={sgStyles.catDescription}>
        {config.description.split(isPositive ? 'gaining' : 'losing').map((part, i) => {
          if (i === 0) return <Text key={i}>{part}</Text>;
          return (
            <Text key={i}>
              <Text style={{ color: config.color, fontWeight: '700' as const }}>
                {isPositive ? 'gaining' : 'losing'}
              </Text>
              {part}
            </Text>
          );
        })}
      </Text>

      <MiniChart data={config.chartData} color={config.color} />

      <View style={sgStyles.trendCard}>
        <Text style={sgStyles.trendDescription}>
          {config.trendDirection === 'up' ? 'Way to go! ' : 'Okay, time to reset. '}
          Your {config.title.toLowerCase().replace(' game', '')} game is{' '}
          <Text style={{ color: config.trendDirection === 'up' ? '#4CAF50' : '#E57373', fontWeight: '700' as const }}>
            trending {config.trendDirection} by {config.trend >= 0 ? '+' : ''}{config.trend.toFixed(1)} SG
          </Text>{' '}
          compared to your last 10 round average.
        </Text>
      </View>
    </ScrollView>
  );
}

function SGContent() {
  const [sgSegment, setSgSegment] = useState<SGSegment>('ovve');

  return (
    <View style={{ flex: 1 }}>
      <Text style={sgStyles.sectionHeader}>Strokes Gained</Text>
      <View style={sgStyles.segmentWrap}>
        <View style={sgStyles.segmentControl}>
          {SG_SEGMENTS.map((seg) => (
            <TouchableOpacity
              key={seg.key}
              style={[sgStyles.segmentButton, sgSegment === seg.key && sgStyles.segmentButtonActive]}
              onPress={() => setSgSegment(seg.key)}
              activeOpacity={0.7}
            >
              <Text style={[sgStyles.segmentText, sgSegment === seg.key && sgStyles.segmentTextActive]}>
                {seg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {sgSegment === 'ovve' ? (
        <SGOverallView />
      ) : (
        <SGCategoryView segment={sgSegment} />
      )}
    </View>
  );
}

const sgStyles = StyleSheet.create({
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    textAlign: 'center' as const,
    paddingTop: 14,
    paddingBottom: 6,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: '#141C18',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#243028',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#4FC3F7',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#5A6B60',
  },
  segmentTextActive: {
    color: '#000',
  },
  compareBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#141C18',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#243028',
  },
  compareText: {
    fontSize: 12,
    color: '#8A9B90',
    fontWeight: '500' as const,
  },
  compareBold: {
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  compareChevron: {
    color: '#5A6B60',
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    gap: 6,
  },
  titleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    flex: 1,
    justifyContent: 'center' as const,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  mainCard: {
    backgroundColor: '#141C18',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#243028',
    alignItems: 'center' as const,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#4CAF50',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  bigValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
  },
  bigValue: {
    fontSize: 52,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    letterSpacing: -2,
  },
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 2,
  },
  trendArrow: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700' as const,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#4CAF50',
  },
  bigSubtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 4,
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8A9B90',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  descHighlightGreen: {
    color: '#4CAF50',
    fontWeight: '700' as const,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%' as const,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  categoryItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  categoryBarContainer: {
    height: 32,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  categoryBar: {
    height: 24,
    borderRadius: 3,
    minWidth: 20,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  categorySgLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  categorySgText: {
    fontSize: 11,
    color: '#8A9B90',
    fontWeight: '600' as const,
  },
  handicapLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#243028',
    width: '100%' as const,
    justifyContent: 'center' as const,
  },
  handicapLinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8A9B90',
  },
  circleWrap: {
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  circleOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  circleValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  circleSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
  },
  catDescription: {
    fontSize: 14,
    color: '#8A9B90',
    textAlign: 'center' as const,
    lineHeight: 21,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: 'row' as const,
    marginBottom: 20,
    paddingRight: 16,
  },
  chartYAxis: {
    width: 28,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    paddingRight: 6,
  },
  chartYLabel: {
    fontSize: 10,
    color: '#5A6B60',
    fontWeight: '500' as const,
  },
  chartArea: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  chartBar: {
    position: 'absolute' as const,
    borderRadius: 3,
  },
  chartMidLine: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2E4038',
  },
  chartDot: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLineContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartLine: {
    position: 'absolute' as const,
    height: 2,
    transformOrigin: 'left center',
  },
  chartRightLabel: {
    position: 'absolute' as const,
    right: -8,
    top: 4,
    alignItems: 'flex-end' as const,
  },
  chartLatestText: {
    fontSize: 9,
    color: '#5A6B60',
    fontWeight: '500' as const,
  },
  trendCard: {
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#243028',
  },
  trendDescription: {
    fontSize: 14,
    color: '#8A9B90',
    textAlign: 'center' as const,
    lineHeight: 21,
  },
});

type ShotsSegment = 'round' | 'practice';

function ShotsContent() {
  const [segment, setSegment] = useState<ShotsSegment>('round');

  const roundShotsQuery = useQuery({
    queryKey: ['totalRoundShots'],
    queryFn: fetchRoundShotCount,
  });

  const practiceShotsQuery = useQuery({
    queryKey: ['totalPracticeShots'],
    queryFn: fetchPracticeShotCount,
  });

  const isLoading = segment === 'round' ? roundShotsQuery.isLoading : practiceShotsQuery.isLoading;
  const totalShots = segment === 'round' ? (roundShotsQuery.data ?? 0) : (practiceShotsQuery.data ?? 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={shotsStyles.segmentWrap}>
        <View style={shotsStyles.segmentControl}>
          <TouchableOpacity
            style={[shotsStyles.segmentButton, segment === 'round' && shotsStyles.segmentButtonActive]}
            onPress={() => setSegment('round')}
            activeOpacity={0.7}
          >
            <Text style={[shotsStyles.segmentText, segment === 'round' && shotsStyles.segmentTextActive]}>Round</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[shotsStyles.segmentButton, segment === 'practice' && shotsStyles.segmentButtonActive]}
            onPress={() => setSegment('practice')}
            activeOpacity={0.7}
          >
            <Text style={[shotsStyles.segmentText, segment === 'practice' && shotsStyles.segmentTextActive]}>Practice</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={shotsStyles.totalContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#4FC3F7" />
        ) : (
          <View style={shotsStyles.totalValueWrap}>
            <Text style={shotsStyles.totalValue}>{totalShots}</Text>
            <Text style={shotsStyles.totalLabel}>Total Shots</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const shotsStyles = StyleSheet.create({
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: '#141C18',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#243028',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#4FC3F7',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#5A6B60',
  },
  segmentTextActive: {
    color: '#000',
  },
  totalContainer: {
    alignItems: 'flex-end' as const,
    paddingRight: 24,
    paddingTop: 20,
  },
  totalValueWrap: {
    alignItems: 'flex-end' as const,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#F5F7F6',
    letterSpacing: -1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5A6B60',
    marginTop: 2,
  },
});

type DetailsSegment = 'courses' | 'notes' | 'thegame';

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

const DETAILS_STORAGE_KEY_FAVORITES = 'play_setup_favorite_courses';

const DETAILS_MOCK_COURSES: GolfCourse[] = [
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

const DETAILS_COUNTRIES = ['Alla länder', 'Sweden', 'Portugal', 'Spain'];

type NotesModalKey = 'swing-thoughts' | 'club' | 'mental-game' | 'golf-iq' | 'general' | 'pre-round' | 'distances' | 'strokesgained' | 'shortgame' | null;

const NOTES_DATA: { title: string; description: string; modalKey: NotesModalKey }[] = [
  { title: 'Swing Thoughts', description: 'Describe Every Detail Of Your Swing', modalKey: 'swing-thoughts' },
  { title: 'Club', description: 'Learn your Club Difference', modalKey: 'club' },
  { title: 'Mental Game', description: '"Golf is 90% mental and 10% physical."', modalKey: 'mental-game' },
  { title: 'Golf IQ', description: 'Manage Yourself On The Course', modalKey: 'golf-iq' },
  { title: 'General', description: 'Your Own Focus', modalKey: 'general' },
];

const PREPARATION_DATA = {
  title: 'Pre Round',
  description: 'Create routines to perform better!',
  modalKey: 'pre-round' as NotesModalKey,
};

const CLUB_DATA_BUTTONS: { title: string; modalKey: NotesModalKey }[] = [
  { title: 'Distances', modalKey: 'distances' },
  { title: 'Strokes Gained', modalKey: 'strokesgained' },
  { title: 'Short Game', modalKey: 'shortgame' },
];

const THE_GAME_SECTIONS = [
  'The Fundamentals (The "Setup")',
  'The Full Swing',
  'The Short Game (Scoring)',
  'Course Management & Mental Game',
  'Rules and Etiquette',
  'Equipment & Fit',
  'Environmental & Weather Factors',
  'Turf & Terrain Variables',
  'Green Anatomy & Physics',
  'The Psychology of "Rub of the Green"',
];

function DetailsCoursesList() {
  const scrollHandler = useScrollHeaderContext();
  const [activeTab, setActiveTab] = useState<CourseTab>('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Alla länder');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(DETAILS_STORAGE_KEY_FAVORITES);
        if (stored) setFavorites(JSON.parse(stored));
      } catch (e) {
        console.log('[DetailsCourses] Error loading favorites:', e);
      }
    };
    load();
  }, []);

  const toggleFavorite = useCallback(async (courseId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      AsyncStorage.setItem(DETAILS_STORAGE_KEY_FAVORITES, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const playedCount = useMemo(
    () => DETAILS_MOCK_COURSES.filter((c) => c.played).length,
    []
  );

  const filteredCourses = useMemo(() => {
    let list = [...DETAILS_MOCK_COURSES];
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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i <= Math.floor(rating) ? '#1B5E20' : '#5A6B60'}
          fill={i <= Math.floor(rating) ? '#1B5E20' : 'transparent'}
        />
      );
    }
    return <View style={detailsStyles.starsRow}>{stars}</View>;
  };

  const renderCourseItem = ({ item }: { item: GolfCourse }) => {
    const isFav = favorites.includes(item.id);
    return (
      <View style={detailsStyles.courseRow}>
        <View style={detailsStyles.courseInfo}>
          <Text style={detailsStyles.courseName}>{item.name}</Text>
          <View style={detailsStyles.courseSubRow}>
            <Text style={detailsStyles.courseClub}>
              {item.clubName}, {item.holes}/{item.par}
            </Text>
            <MapPin size={12} color="#5A6B60" />
          </View>
          <Text style={detailsStyles.courseCity}>{item.city}, {item.country}</Text>
          <View style={detailsStyles.courseBottom}>
            {renderStars(item.rating)}
            <Text style={detailsStyles.courseDistance}>{item.distance.toFixed(1)} km</Text>
          </View>
        </View>
        <TouchableOpacity
          style={detailsStyles.favBtn}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star
            size={20}
            color={isFav ? '#FFB74D' : '#5A6B60'}
            fill={isFav ? '#FFB74D' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={detailsStyles.searchSection}>
        <View style={detailsStyles.searchBar}>
          <Search size={16} color="#5A6B60" />
          <TextInput
            style={detailsStyles.searchInput}
            placeholder="Sök"
            placeholderTextColor="#5A6B60"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={detailsStyles.filterRow}>
          <Text style={detailsStyles.filterLabel}>Filter:</Text>
          <TouchableOpacity
            style={detailsStyles.countryPicker}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={detailsStyles.countryText}>{selectedCountry}</Text>
            <Text style={detailsStyles.countryChevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {showCountryPicker && (
          <View style={detailsStyles.countryDropdown}>
            {DETAILS_COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  detailsStyles.countryOption,
                  selectedCountry === country && detailsStyles.countryOptionActive,
                ]}
                onPress={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
              >
                <Text
                  style={[
                    detailsStyles.countryOptionText,
                    selectedCountry === country && detailsStyles.countryOptionTextActive,
                  ]}
                >
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={detailsStyles.tabRow}>
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
        contentContainerStyle={detailsStyles.listContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={detailsStyles.emptyState}>
            <Text style={detailsStyles.emptyText}>
              {activeTab === 'favorite'
                ? 'Inga favoritbanor ännu'
                : 'Inga banor hittades'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function DetailsNotesContent() {
  const scrollHandler = useScrollHeaderContext();
  const [activeModal, setActiveModal] = useState<NotesModalKey>(null);

  const closeModal = () => setActiveModal(null);

  const renderModal = () => {
    switch (activeModal) {
      case 'swing-thoughts': return <SwingThoughtsModal onClose={closeModal} />;
      case 'club': return <ClubModal onClose={closeModal} />;
      case 'mental-game': return <MentalGameModal onClose={closeModal} />;
      case 'golf-iq': return <GolfIQModal onClose={closeModal} />;
      case 'general': return <GeneralModal onClose={closeModal} />;
      case 'pre-round': return <PreRoundModal onClose={closeModal} />;
      case 'distances': return <DistancesModal onClose={closeModal} />;
      case 'strokesgained': return <StrokesGainedModal onClose={closeModal} />;
      case 'shortgame': return <ShortGameModal onClose={closeModal} />;
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={detailsStyles.notesScrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={detailsStyles.clubDataSection}>
          <View style={detailsStyles.clubDataHeaderRow}>
            <Text style={detailsStyles.clubDataHeader}>Club DATA</Text>
            <Text style={detailsStyles.clubDataSubtext}>(Sensors Needed)</Text>
          </View>
          <View style={detailsStyles.clubDataButtons}>
            {CLUB_DATA_BUTTONS.map((btn, index) => (
              <Pressable
                key={index}
                style={detailsStyles.clubDataButton}
                onPress={() => setActiveModal(btn.modalKey)}
              >
                <Text style={detailsStyles.clubDataButtonTitle}>{btn.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {NOTES_DATA.map((note, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveModal(note.modalKey)}
            style={detailsStyles.noteCardContainer}
          >
            <LiquidGlassCard containerStyle={detailsStyles.noteCard}>
              <View style={detailsStyles.noteCardContent}>
                <View style={detailsStyles.noteTextContainer}>
                  <Text style={detailsStyles.noteCardTitle}>{note.title}</Text>
                  <Text style={detailsStyles.noteCardDescription}>{note.description}</Text>
                </View>
              </View>
            </LiquidGlassCard>
          </Pressable>
        ))}

        <Text style={detailsStyles.notesSectionTitle}>Preparation!</Text>

        <Pressable
          onPress={() => setActiveModal(PREPARATION_DATA.modalKey)}
          style={detailsStyles.noteCardContainer}
        >
          <LiquidGlassCard containerStyle={detailsStyles.noteCard}>
            <View style={detailsStyles.noteCardContent}>
              <View style={detailsStyles.noteTextContainer}>
                <Text style={detailsStyles.noteCardTitle}>{PREPARATION_DATA.title}</Text>
                <Text style={detailsStyles.noteCardDescription}>{PREPARATION_DATA.description}</Text>
              </View>
            </View>
          </LiquidGlassCard>
        </Pressable>
      </ScrollView>

      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        {renderModal()}
      </Modal>
    </View>
  );
}

function TheGameContent() {
  const scrollHandler = useScrollHeaderContext();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={detailsStyles.gameScrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {THE_GAME_SECTIONS.map((section, index) => (
        <View key={index} style={detailsStyles.gameSectionCard}>
          <View style={detailsStyles.gameSectionNumberWrap}>
            <Text style={detailsStyles.gameSectionNumber}>{index + 1}</Text>
          </View>
          <Text style={detailsStyles.gameSectionTitle}>{section}</Text>
          <ChevronRight size={18} color="#5A6B60" />
        </View>
      ))}
    </ScrollView>
  );
}

function DetailsContent() {
  const [detailsSegment, setDetailsSegment] = useState<DetailsSegment>('courses');

  const DETAIL_SEGMENTS: { key: DetailsSegment; label: string }[] = [
    { key: 'courses', label: 'Courses' },
    { key: 'notes', label: 'Notes' },
    { key: 'thegame', label: 'The Game' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={detailsStyles.segmentWrap}>
        <View style={detailsStyles.segmentControl}>
          {DETAIL_SEGMENTS.map((seg) => (
            <TouchableOpacity
              key={seg.key}
              style={[detailsStyles.segmentButton, detailsSegment === seg.key && detailsStyles.segmentButtonActive]}
              onPress={() => setDetailsSegment(seg.key)}
              activeOpacity={0.7}
            >
              <Text style={[detailsStyles.segmentText, detailsSegment === seg.key && detailsStyles.segmentTextActive]}>
                {seg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {detailsSegment === 'courses' && <DetailsCoursesList />}
      {detailsSegment === 'notes' && <DetailsNotesContent />}
      {detailsSegment === 'thegame' && <TheGameContent />}
    </View>
  );
}

const detailsStyles = StyleSheet.create({
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    backgroundColor: '#141C18',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#243028',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#4FC3F7',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#5A6B60',
  },
  segmentTextActive: {
    color: '#000',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: '#1B5E20',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    backgroundColor: '#141C18',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#8A9B90',
    fontWeight: '600' as const,
  },
  countryPicker: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#1B5E20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    flex: 1,
    backgroundColor: '#141C18',
  },
  countryText: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '500' as const,
    flex: 1,
  },
  countryChevron: {
    fontSize: 10,
    color: '#1B5E20',
  },
  countryDropdown: {
    backgroundColor: '#141C18',
    borderWidth: 1,
    borderColor: '#243028',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden' as const,
  },
  countryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#243028',
  },
  countryOptionActive: {
    backgroundColor: '#1B5E20',
  },
  countryOptionText: {
    fontSize: 15,
    color: '#8A9B90',
  },
  countryOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  tabRow: {
    marginBottom: 8,
  },
  courseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#243028',
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 2,
  },
  courseClub: {
    fontSize: 13,
    color: '#8A9B90',
  },
  courseCity: {
    fontSize: 12,
    color: '#5A6B60',
    marginTop: 1,
  },
  courseBottom: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  courseDistance: {
    fontSize: 13,
    color: '#8A9B90',
    fontWeight: '500' as const,
  },
  favBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#5A6B60',
  },
  notesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  clubDataSection: {
    marginBottom: 20,
  },
  clubDataHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginBottom: 10,
    gap: 6,
  },
  clubDataHeader: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  clubDataSubtext: {
    fontSize: 11,
    color: '#8A9B90',
    fontWeight: '500' as const,
  },
  clubDataButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  clubDataButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  clubDataButtonTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#8B1A1A',
  },
  noteCardContainer: {
    marginBottom: 12,
  },
  noteCard: {
    width: '100%' as const,
  },
  noteCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  noteTextContainer: {
    flex: 1,
    gap: 4,
  },
  noteCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFCC00',
  },
  noteCardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  notesSectionTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#006735',
    marginBottom: 16,
    marginTop: 32,
    textAlign: 'center' as const,
  },
  gameScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  gameSectionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 14,
  },
  gameSectionNumberWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1B5E20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  gameSectionNumber: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  gameSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    lineHeight: 20,
  },
});

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  } catch {
    return 'Recently';
  }
}

function VideoContent() {
  const scrollHandler = useScrollHeaderContext();
  const router = useRouter();
  const { sessions = [], addSession, removeSession } = useSessions();
  const { setVideoUri, setComparisonMode, clearAll } = useSwingStore();

  const pickAndAnalyze = useCallback(async (comparison: boolean) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;
      
      clearAll();
      const uri1 = result.assets[0].uri;
      setVideoUri(uri1, 0);

      let finalUris = [uri1];
      let finalComparisonMode = false;

      if (comparison) {
        const result2 = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: true,
          quality: 1,
        });

        if (!result2.canceled && result2.assets?.[0]) {
          const uri2 = result2.assets[0].uri;
          setVideoUri(uri2, 1);
          finalUris.push(uri2);
          finalComparisonMode = true;
        }
      }

      setComparisonMode(finalComparisonMode);
      addSession(finalUris);

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/modals/vid-modal');
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video.');
    }
  }, [clearAll, setVideoUri, setComparisonMode, addSession, router]);

  const handleOpenSession = useCallback((session: AnalysisSession) => {
    clearAll();
    if (!session?.videoUris?.[0]) {
      Alert.alert('Missing video', 'This session does not have a valid video.');
      return;
    }
    
    setVideoUri(session.videoUris[0], 0);
    if (session.isComparison && session.videoUris[1]) {
      setVideoUri(session.videoUris[1], 1);
      setComparisonMode(true);
    } else {
      setComparisonMode(false);
    }
    router.push('/modals/vid-modal');
  }, [clearAll, setVideoUri, setComparisonMode, router]);

  const renderSession = useCallback(({ item }: { item: AnalysisSession }) => (
    <Pressable
      style={({ pressed }) => [styles.videoSessionCard, pressed && styles.videoSessionCardPressed]}
      onPress={() => handleOpenSession(item)}
    >
      <View style={styles.videoSessionIcon}>
        {item.isComparison ? <Columns2 size={18} color="#4FC3F7" /> : <Video size={18} color="#4FC3F7" />}
      </View>
      <View style={styles.videoSessionInfo}>
        <Text style={styles.videoSessionTitle}>{item.isComparison ? 'Comparison' : 'Swing Analysis'}</Text>
        <Text style={styles.videoSessionDate}>{formatSessionDate(item.createdAt)}</Text>
      </View>
      <Pressable onPress={() => removeSession(item.id)} style={styles.videoDeleteBtn}>
        <Trash2 size={14} color="#5A6B60" />
      </Pressable>
    </Pressable>
  ), [handleOpenSession, removeSession]);

  return (
    <FlatList
      data={Array.isArray(sessions) ? sessions : []}
      keyExtractor={(item) => item.id}
      renderItem={renderSession}
      style={styles.tabContent}
      contentContainerStyle={styles.videoListContent}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      ListHeaderComponent={
        <View style={styles.videoActionsSection}>
          <Text style={styles.videoHeaderTitle}>Swing Analyzer</Text>
          <Pressable style={styles.videoUploadButton} onPress={() => pickAndAnalyze(false)}>
            <Plus size={24} color="#000" />
            <Text style={styles.videoUploadTitle}>New Analysis</Text>
          </Pressable>
          <Pressable style={styles.videoCompareButton} onPress={() => pickAndAnalyze(true)}>
            <Columns2 size={22} color="#4FC3F7" />
            <Text style={styles.videoCompareTitle}>Compare Swings</Text>
          </Pressable>
          {sessions.length > 0 && <Text style={styles.videoSectionTitle}>History</Text>}
        </View>
      }
    />
  );
}

export default function DataOverviewScreen() {
  const [activeTab, setActiveTab] = useState<DataTab>('stats');
  const { openSidebar, navigateTo, dataOverviewInitialTab, clearDataOverviewInitialTab } = useAppNavigation();

  useEffect(() => {
    if (dataOverviewInitialTab && ['stats', 'sg', 'shots', 'details', 'video'].includes(dataOverviewInitialTab)) {
      setActiveTab(dataOverviewInitialTab as DataTab);
      clearDataOverviewInitialTab();
    }
  }, [dataOverviewInitialTab, clearDataOverviewInitialTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'stats': return <StatsContent />;
      case 'sg': return <SGContent />;
      case 'shots': return <ShotsContent />;
      case 'details': return <DetailsContent />;
      case 'video': return <VideoContent />;
    }
  };

  const { headerTranslateY, onScroll: onHeaderScroll } = useScrollHeader(52);
  const scrollHeaderValue = useMemo(() => ({ onScroll: onHeaderScroll }), [onHeaderScroll]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerAbsolute, { transform: [{ translateY: headerTranslateY }] }]}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.header}>
            <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} activeOpacity={0.7}>
              <Menu size={24} color="#F5F7F6" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{tabs.find(t => t.key === activeTab)?.label ?? 'Stats'}</Text>
            <TouchableOpacity onPress={() => navigateTo('mygame')} style={styles.menuBtn} activeOpacity={0.7}>
              <Image source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/d92ywde7ucn1q2si6dbb7' }} style={styles.golferIcon} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <View style={styles.body}>
        <ScrollHeaderProvider value={scrollHeaderValue}>
          {renderContent()}
        </ScrollHeaderProvider>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={isActive ? styles.iconActive : styles.iconInactive}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? '#4FC3F7' : '#5A6B60',
                  })}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  headerAbsolute: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#000000',
  },
  safeTop: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  golferIcon: {
    width: 28,
    height: 28,
    tintColor: '#F5F7F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  placeholderCard: {
    backgroundColor: '#141C18',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    marginBottom: 20,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  placeholderSub: {
    fontSize: 14,
    color: '#5A6B60',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  statGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 6,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#5A6B60',
  },
  sgRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 12,
  },
  sgLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8A9B90',
    width: 80,
  },
  sgBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#243028',
  },
  sgBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  sgValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    width: 36,
    textAlign: 'right' as const,
  },
  videoHeaderTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 16,
  },
  videoListContent: {
    paddingBottom: 40,
  },
  videoActionsSection: {
    paddingTop: 4,
    gap: 12,
  },
  videoUploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  videoUploadTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  videoCompareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#243028',
  },
  videoCompareTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  videoSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5A6B60',
    marginTop: 20,
    textTransform: 'uppercase' as const,
  },
  videoSessionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#243028',
  },
  videoSessionCardPressed: {
    opacity: 0.7,
  },
  videoSessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(79,195,247,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  videoSessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoSessionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  videoSessionDate: {
    fontSize: 12,
    color: '#5A6B60',
  },
  videoDeleteBtn: {
    padding: 8,
  },
  tabBarSafe: {
    backgroundColor: '#000000',
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 4,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#5A6B60',
    fontWeight: '600' as const,
  },
  tabLabelActive: {
    color: '#4FC3F7',
  },
});
