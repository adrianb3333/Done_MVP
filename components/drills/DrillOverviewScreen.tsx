import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag, Play, RotateCcw, Target } from 'lucide-react-native';
import type { CustomDrill } from './CreateDrillScreen';
import type { SensorDrill } from './CreateSensorDrillScreen';

type DrillItem = CustomDrill | SensorDrill;

interface DrillOverviewScreenProps {
  drill: DrillItem;
  onCancel: () => void;
  onStart: () => void;
  onSetPin: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Putting: '#2D6A4F',
  Wedges: '#E76F51',
  Irons: '#7B2CBF',
  Woods: '#40916C',
};

function isSensorDrill(drill: DrillItem): drill is SensorDrill {
  return 'isSensorDrill' in drill && drill.isSensorDrill === true;
}

export default function DrillOverviewScreen({ drill, onCancel, onStart, onSetPin }: DrillOverviewScreenProps) {
  const insets = useSafeAreaInsets();
  const isSensor = isSensorDrill(drill);
  const [pinSet, setPinSet] = useState(false);
  const [showPinWarning, setShowPinWarning] = useState(false);
  const shakeAnim = useState(new Animated.Value(0))[0];

  const handleSetPin = useCallback(() => {
    setPinSet(true);
    setShowPinWarning(false);
    onSetPin();
  }, [onSetPin]);

  const handleStart = useCallback(() => {
    if (isSensor && !pinSet) {
      setShowPinWarning(true);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      return;
    }
    onStart();
  }, [isSensor, pinSet, onStart, shakeAnim]);

  const catColor = CATEGORY_COLORS[drill.category] || '#2D6A4F';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TouchableOpacity
            onPress={handleSetPin}
            style={[styles.setPinBtn, pinSet && styles.setPinBtnActive]}
            activeOpacity={0.7}
          >
            <Flag size={16} color="#FFFFFF" />
            <Text style={styles.setPinText}>{pinSet ? 'Pin Set' : 'Set Pin'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {showPinWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>Set Pin before starting Drill!</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>{drill.category}</Text>
        </View>

        <Text style={styles.drillName}>{drill.name}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <RotateCcw size={22} color="#C9A84C" strokeWidth={2} />
            <Text style={styles.statValue}>{drill.rounds}</Text>
            <Text style={styles.statLabel}>Rounds</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={22} color="#C9A84C" strokeWidth={2} />
            <Text style={styles.statValue}>{drill.targetsPerRound}</Text>
            <Text style={styles.statLabel}>Targets/Round</Text>
          </View>
          <View style={styles.statCard}>
            <Play size={22} color="#C9A84C" strokeWidth={2} />
            <Text style={styles.statValue}>{drill.totalShots}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Shots</Text>
          </View>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How it works</Text>
          <Text style={styles.howText}>
            Each round shows {drill.targetsPerRound} targets. Tap each target you hit. After all rounds, you'll see your score summary.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleStart}
          style={styles.startButton}
          activeOpacity={0.8}
        >
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Drill</Text>
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
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '500' as const,
    color: '#3478F6',
  },
  setPinBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 7,
  },
  setPinBtnActive: {
    backgroundColor: '#1B5E20',
  },
  setPinText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#856404',
    textAlign: 'center' as const,
  },
  body: {
    flex: 1,
    alignItems: 'center' as const,
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  categoryBadge: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  drillName: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#1a1a1a',
    marginBottom: 28,
    textAlign: 'center' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 14,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1B3A2A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center' as const,
  },
  howItWorks: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  howTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  howText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#555',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
  },
  startButton: {
    flexDirection: 'row' as const,
    backgroundColor: '#3478F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
