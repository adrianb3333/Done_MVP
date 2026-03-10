import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { RotateCcw, Home, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { DrillResult } from './ActiveDrillScreen';
import type { CustomDrill } from './CreateDrillScreen';
import type { SensorDrill } from './CreateSensorDrillScreen';

type DrillItem = CustomDrill | SensorDrill;

interface DrillSummaryScreenProps {
  drill: DrillItem;
  result: DrillResult;
  onRetry: () => void;
  onHome: () => void;
}

const SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(pct: number): string {
  if (pct >= 80) return '#2D6A4F';
  if (pct >= 50) return '#E76F51';
  return '#C0392B';
}

export default function DrillSummaryScreen({ drill, result, onRetry, onHome }: DrillSummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const strokeDashoffset = CIRCUMFERENCE * (1 - result.percentage / 100);
  const scoreColor = getScoreColor(result.percentage);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.circleContainer}>
        <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            stroke="#E8E0D4"
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            stroke={scoreColor}
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.circleInner}>
          <Award size={24} color={scoreColor} strokeWidth={1.5} />
          <Text style={[styles.percentText, { color: scoreColor }]}>{result.percentage}%</Text>
          <Text style={styles.overallLabel}>Overall Score</Text>
        </View>
      </View>

      <Text style={styles.drillName}>{drill.name}</Text>
      <Text style={styles.hitsText}>{result.totalHits} / {result.totalShots} targets hit</Text>

      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>ROUND BREAKDOWN</Text>
        {result.roundScores.map((score, idx) => {
          const roundPct = drill.targetsPerRound > 0 ? score / drill.targetsPerRound : 0;
          return (
            <View key={idx} style={styles.roundRow}>
              <Text style={styles.roundLabel}>Round {idx + 1}</Text>
              <View style={styles.roundBarBg}>
                <View style={[styles.roundBarFill, { width: `${roundPct * 100}%` }]} />
              </View>
              <Text style={styles.roundScore}>{score}/{drill.targetsPerRound}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryButton}
          activeOpacity={0.8}
        >
          <RotateCcw size={18} color="#2D6A4F" strokeWidth={2.5} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onHome}
          style={styles.homeButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.homeGradient}
          >
            <Home size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.homeText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    alignItems: 'center' as const,
  },
  circleContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  circleInner: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  percentText: {
    fontSize: 36,
    fontWeight: '900' as const,
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#999',
  },
  drillName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  hitsText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#888',
    marginBottom: 30,
  },
  breakdownCard: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 18,
    padding: 20,
    width: '90%',
    marginBottom: 30,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  roundRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 12,
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#444',
    width: 70,
  },
  roundBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0D8CC',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  roundBarFill: {
    height: 8,
    backgroundColor: '#C9A84C',
    borderRadius: 4,
  },
  roundScore: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#444',
    width: 45,
    textAlign: 'right' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#2D6A4F',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  retryText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#2D6A4F',
  },
  homeButton: {
    flex: 1.4,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  homeGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  homeText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
