import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import type { CustomDrill } from './CreateDrillScreen';
import type { SensorDrill } from './CreateSensorDrillScreen';

type DrillItem = CustomDrill | SensorDrill;

export interface DrillResult {
  roundScores: number[];
  totalHits: number;
  totalShots: number;
  percentage: number;
}

interface ActiveDrillScreenProps {
  drill: DrillItem;
  onBack: () => void;
  onFinish: (result: DrillResult) => void;
}

export default function ActiveDrillScreen({ drill, onBack, onFinish }: ActiveDrillScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentRound, setCurrentRound] = useState(0);
  const [roundScores, setRoundScores] = useState<number[][]>(
    Array.from({ length: drill.rounds }, () => Array.from({ length: drill.targetsPerRound }, () => 0))
  );

  const currentHits = useMemo(() => {
    return roundScores[currentRound]?.reduce((sum, v) => sum + v, 0) ?? 0;
  }, [roundScores, currentRound]);

  const totalHitsAllRounds = useMemo(() => {
    return roundScores.reduce((sum, round) => sum + round.reduce((s, v) => s + v, 0), 0);
  }, [roundScores]);

  const totalShotsSoFar = useMemo(() => {
    return (currentRound * drill.targetsPerRound) + drill.targetsPerRound;
  }, [currentRound, drill.targetsPerRound]);

  const liveAvg = useMemo(() => {
    if (totalShotsSoFar === 0) return 0;
    return Math.round((totalHitsAllRounds / totalShotsSoFar) * 100);
  }, [totalHitsAllRounds, totalShotsSoFar]);

  const isLastRound = currentRound === drill.rounds - 1;

  const toggleTarget = useCallback((targetIndex: number) => {
    setRoundScores(prev => {
      const updated = prev.map(r => [...r]);
      updated[currentRound][targetIndex] = updated[currentRound][targetIndex] === 1 ? 0 : 1;
      return updated;
    });
  }, [currentRound]);

  const handleNextRound = useCallback(() => {
    if (isLastRound) {
      const allHits = roundScores.reduce((sum, round) => sum + round.reduce((s, v) => s + v, 0), 0);
      const total = drill.rounds * drill.targetsPerRound;
      const pct = total > 0 ? Math.round((allHits / total) * 100) : 0;
      const perRound = roundScores.map(r => r.reduce((s, v) => s + v, 0));
      onFinish({
        roundScores: perRound,
        totalHits: allHits,
        totalShots: total,
        percentage: pct,
      });
    } else {
      setCurrentRound(prev => prev + 1);
    }
  }, [isLastRound, roundScores, drill, onFinish]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{drill.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBarContainer}>
        {Array.from({ length: drill.rounds }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= currentRound ? styles.progressSegmentActive : styles.progressSegmentInactive,
              i < drill.rounds - 1 && { marginRight: 4 },
            ]}
          />
        ))}
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statItemLabel}>Round</Text>
          <Text style={styles.statItemValue}>{currentRound + 1}/{drill.rounds}</Text>
        </View>
        <View style={[styles.statItem, styles.statItemBorder]}>
          <Text style={styles.statItemLabel}>Hits</Text>
          <Text style={[styles.statItemValue, styles.statItemHits]}>{currentHits}/{drill.targetsPerRound}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statItemLabel}>Live Avg</Text>
          <Text style={[styles.statItemValue, styles.statItemAvg]}>{liveAvg}%</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tapInstruction}>Tap targets you hit</Text>

        <View style={styles.targetsGrid}>
          {Array.from({ length: drill.targetsPerRound }).map((_, idx) => {
            const isHit = roundScores[currentRound][idx] === 1;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.targetCircle, isHit && styles.targetCircleHit]}
                onPress={() => toggleTarget(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.targetText, isHit && styles.targetTextHit]}>
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleNextRound}
          style={styles.nextButton}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastRound ? 'Finish Drill' : 'Next Round'}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 17,
    fontWeight: '500' as const,
    color: '#3478F6',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },
  progressBarContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#3478F6',
  },
  progressSegmentInactive: {
    backgroundColor: '#D1D1D6',
  },
  statsBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 14,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EAEAEA',
  },
  statItemLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#888',
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  statItemHits: {
    color: '#1B5E20',
  },
  statItemAvg: {
    color: '#C0392B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tapInstruction: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#888',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  targetsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  targetCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  targetCircleHit: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  targetText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#555',
  },
  targetTextHit: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
  },
  nextButton: {
    flexDirection: 'row' as const,
    backgroundColor: '#3478F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
