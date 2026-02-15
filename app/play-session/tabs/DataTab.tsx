import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Clock, Thermometer, Timer, Flag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';
import { useScoring } from '@/contexts/ScoringContext';
import { fetchGolfWeather } from '@/services/weatherApi';
import { computeRoundStats, getToParString, pctOf } from '@/services/statsHelper';

export default function DataTab() {
  const { quitSession, roundName, roundDate, sessionStartTime } = useSession();
  const { allScores, holes } = useScoring();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionStartTime) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStartTime]);

  useEffect(() => {
    const loadTemp = async () => {
      try {
        if (Platform.OS !== 'web' || navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          const result = await fetchGolfWeather(position.coords.latitude, position.coords.longitude);
          if (result) setTemperature(result.temp);
        }
      } catch {
        const result = await fetchGolfWeather(59.33, 18.07);
        if (result) setTemperature(result.temp);
      }
    };
    loadTemp();
  }, []);

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => computeRoundStats(allScores, holes), [allScores, holes]);
  const toParStr = getToParString(stats.scoreToPar);

  return (
    <View style={styles.container}>
      <View style={styles.miniStatsRow}>
        <View style={styles.miniStat}>
          <Clock size={13} color="#00E676" />
          <Text style={styles.miniStatValue}>{formatTime(currentTime)}</Text>
        </View>
        <View style={styles.miniStat}>
          <Thermometer size={13} color="#00E676" />
          <Text style={styles.miniStatValue}>
            {temperature !== null ? `${temperature}°C` : '--°C'}
          </Text>
        </View>
        <View style={styles.miniStat}>
          <Timer size={13} color="#00E676" />
          <Text style={styles.miniStatValue}>{formatElapsed(elapsed)}</Text>
        </View>
      </View>

      {stats.holesPlayed === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Ingen data ännu</Text>
          <Text style={styles.emptySubtext}>Börja spela för att se din statistik här</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <Text style={styles.heroLabel}>Shots</Text>
              <Text style={styles.heroValue}>{stats.totalShots}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroItem}>
              <Text style={styles.heroLabel}>Score</Text>
              <Text style={[styles.heroValue, stats.scoreToPar < 0 && styles.heroUnder, stats.scoreToPar > 0 && styles.heroOver]}>{toParStr}</Text>
            </View>
          </View>

          <ScoreSection categories={stats.scoreCategories} />
          <FairwaySection hit={stats.fairwayHit} missLeft={stats.fairwayMissLeft} missRight={stats.fairwayMissRight} total={stats.fairwayTotal} />
          <GIRSection made={stats.girMade} missShort={stats.girMissShort} missLong={stats.girMissLong} missLeft={stats.girMissLeft} missRight={stats.girMissRight} total={stats.girTotal} />
          <PuttingSection p1={stats.putts1} p2={stats.putts2} p3={stats.putts3} p4={stats.putts4Plus} totalPutts={stats.totalPutts} avgPutts={stats.avgPutts} holesPlayed={stats.holesPlayed} />
          <ExtraSection bunker={stats.totalBunker} penalty={stats.totalPenalty} chips={stats.totalChips} totalShots={stats.totalShots} />
          <SavesSection sandSaves={stats.totalSandSaves} sandAttempts={stats.totalSandSaveAttempts} upDowns={stats.totalUpAndDowns} upDownAttempts={stats.totalUpAndDownAttempts} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.quitButton} onPress={quitSession}>
        <Text style={styles.quitText}>Quit Round</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ScoreSectionProps {
  categories: { label: string; count: number; percentage: number; color: string }[];
}

function ScoreSection({ categories }: ScoreSectionProps) {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);
  const MAX_BAR = 100;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Score</Text>
      <View style={styles.barChart}>
        {categories.map((cat) => {
          const barH = Math.max((cat.count / maxCount) * MAX_BAR, 6);
          const isWhite = cat.color === '#FFFFFF';
          return (
            <View key={cat.label} style={styles.barColumn}>
              <Text style={styles.barPct}>{cat.percentage}%</Text>
              <View style={[styles.bar, { height: barH, backgroundColor: cat.color, borderWidth: isWhite ? 1 : 0, borderColor: isWhite ? '#ccc' : 'transparent' }]} />
              <Text style={styles.barLabel}>{cat.label}</Text>
              <Text style={styles.barCount}>{cat.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface FairwaySectionProps {
  hit: number;
  missLeft: number;
  missRight: number;
  total: number;
}

function FairwaySection({ hit, missLeft, missRight, total }: FairwaySectionProps) {
  const hitPct = pctOf(hit, total);
  const leftPct = pctOf(missLeft, total);
  const rightPct = pctOf(missRight, total);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Fairway</Text>
      <View style={styles.fairwayVisual}>
        <View style={styles.fairwayArc}>
          <View style={[styles.fairwaySegLeft, { opacity: leftPct > 0 ? 1 : 0.3 }]} />
          <View style={[styles.fairwaySegCenter, { opacity: hitPct > 0 ? 1 : 0.3 }]} />
          <View style={[styles.fairwaySegRight, { opacity: rightPct > 0 ? 1 : 0.3 }]} />
        </View>
        <View style={styles.fairwayStats}>
          <View style={styles.fairwayStat}>
            <Text style={styles.fairwayStatPct}>{leftPct}%</Text>
            <Text style={styles.fairwayStatLabel}>Miss Left</Text>
            <Text style={styles.fairwayStatCount}>{missLeft}</Text>
          </View>
          <View style={styles.fairwayStat}>
            <Text style={[styles.fairwayStatPct, styles.fairwayHitPct]}>{hitPct}%</Text>
            <Text style={[styles.fairwayStatLabel, styles.fairwayHitLabel]}>Fairway</Text>
            <Text style={styles.fairwayStatCount}>{hit}</Text>
          </View>
          <View style={styles.fairwayStat}>
            <Text style={styles.fairwayStatPct}>{rightPct}%</Text>
            <Text style={styles.fairwayStatLabel}>Miss Right</Text>
            <Text style={styles.fairwayStatCount}>{missRight}</Text>
          </View>
        </View>
      </View>
      <View style={styles.fairwaySummaryRow}>
        <Text style={styles.fairwaySummaryText}>Hit: {hit}/{total}</Text>
        <Text style={styles.fairwaySummaryText}>{hitPct}% accuracy</Text>
      </View>
    </View>
  );
}

interface GIRSectionProps {
  made: number;
  missShort: number;
  missLong: number;
  missLeft: number;
  missRight: number;
  total: number;
}

function GIRSection({ made, missShort, missLong, missLeft, missRight, total }: GIRSectionProps) {
  const madePct = pctOf(made, total);
  const shortPct = pctOf(missShort, total);
  const longPct = pctOf(missLong, total);
  const leftPct = pctOf(missLeft, total);
  const rightPct = pctOf(missRight, total);
  const missed = total - made;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>GIR</Text>
      <View style={styles.girVisual}>
        <View style={styles.girTop}>
          <Text style={styles.girDirectionLabel}>Long</Text>
          <Text style={styles.girDirectionPct}>{longPct}%</Text>
        </View>
        <View style={styles.girMiddle}>
          <View style={styles.girSide}>
            <Text style={styles.girDirectionLabel}>Left</Text>
            <Text style={styles.girDirectionPct}>{leftPct}%</Text>
          </View>
          <View style={styles.girGreen}>
            <Flag size={20} color="#e53935" />
            <View style={styles.girGreenOval} />
          </View>
          <View style={styles.girSide}>
            <Text style={styles.girDirectionLabel}>Right</Text>
            <Text style={styles.girDirectionPct}>{rightPct}%</Text>
          </View>
        </View>
        <View style={styles.girBottom}>
          <Text style={styles.girDirectionLabel}>Short</Text>
          <Text style={styles.girDirectionPct}>{shortPct}%</Text>
        </View>
      </View>
      <View style={styles.girSummaryRow}>
        <View style={styles.girSummaryItem}>
          <Text style={styles.girSummaryValue}>{made}/{total}</Text>
          <Text style={styles.girSummaryLabel}>Made ({madePct}%)</Text>
        </View>
        <View style={styles.girSummaryItem}>
          <Text style={styles.girSummaryValue}>{missed}/{total}</Text>
          <Text style={styles.girSummaryLabel}>Missed ({pctOf(missed, total)}%)</Text>
        </View>
      </View>
    </View>
  );
}

interface PuttingSectionProps {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  totalPutts: number;
  avgPutts: number;
  holesPlayed: number;
}

function PuttingSection({ p1, p2, p3, p4, totalPutts, avgPutts, holesPlayed }: PuttingSectionProps) {
  const puttData: { label: string; count: number; color: string }[] = [];
  if (p1 > 0) puttData.push({ label: '1-Putt', count: p1, color: '#4CAF50' });
  if (p2 > 0) puttData.push({ label: '2-Putt', count: p2, color: '#81C784' });
  if (p3 > 0) puttData.push({ label: '3-Putt', count: p3, color: '#e53935' });
  if (p4 > 0) puttData.push({ label: '4+ Putt', count: p4, color: '#B71C1C' });

  const maxCount = Math.max(...puttData.map((d) => d.count), 1);
  const MAX_BAR = 80;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Putting</Text>
      <View style={styles.puttSummaryRow}>
        <View style={styles.puttSummaryItem}>
          <Text style={styles.puttSummaryValue}>{totalPutts}</Text>
          <Text style={styles.puttSummaryLabel}>Total Putts</Text>
        </View>
        <View style={styles.puttSummaryItem}>
          <Text style={styles.puttSummaryValue}>{avgPutts}</Text>
          <Text style={styles.puttSummaryLabel}>Avg / Hole</Text>
        </View>
      </View>
      {puttData.length > 0 && (
        <View style={styles.barChart}>
          {puttData.map((item) => {
            const barH = Math.max((item.count / maxCount) * MAX_BAR, 6);
            return (
              <View key={item.label} style={styles.barColumn}>
                <Text style={styles.barPct}>{pctOf(item.count, holesPlayed)}%</Text>
                <View style={[styles.bar, { height: barH, backgroundColor: item.color }]} />
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

interface ExtraSectionProps {
  bunker: number;
  penalty: number;
  chips: number;
  totalShots: number;
}

function ExtraSection({ bunker, penalty, chips, totalShots }: ExtraSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Bunker, Penalty, Chips</Text>
      <View style={styles.boxRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{bunker}</Text>
          <Text style={styles.statBoxLabel}>Bunker</Text>
          <Text style={styles.statBoxPct}>{pctOf(bunker, totalShots)}% of shots</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{penalty}</Text>
          <Text style={styles.statBoxLabel}>Penalty</Text>
          <Text style={styles.statBoxPct}>{pctOf(penalty, totalShots)}% of shots</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{chips}</Text>
          <Text style={styles.statBoxLabel}>Chips</Text>
          <Text style={styles.statBoxPct}>{pctOf(chips, totalShots)}% of shots</Text>
        </View>
      </View>
    </View>
  );
}

interface SavesSectionProps {
  sandSaves: number;
  sandAttempts: number;
  upDowns: number;
  upDownAttempts: number;
}

function SavesSection({ sandSaves, sandAttempts, upDowns, upDownAttempts }: SavesSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Sand Saves, Up & Downs</Text>
      <View style={styles.boxRow}>
        <View style={[styles.statBox, styles.statBoxWide]}>
          <Text style={styles.statBoxValue}>{sandSaves}/{sandAttempts}</Text>
          <Text style={styles.statBoxLabel}>Sand Saves</Text>
          <Text style={styles.statBoxPct}>{pctOf(sandSaves, sandAttempts)}%</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxWide]}>
          <Text style={styles.statBoxValue}>{upDowns}/{upDownAttempts}</Text>
          <Text style={styles.statBoxLabel}>Up & Downs</Text>
          <Text style={styles.statBoxPct}>{pctOf(upDowns, upDownAttempts)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 6,
    marginBottom: 12,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 5,
    backgroundColor: '#141C18',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#243028',
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#555',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 20,
  },
  heroRow: {
    flexDirection: 'row' as const,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
  },
  heroItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8A9B90',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  heroUnder: {
    color: '#4CAF50',
  },
  heroOver: {
    color: '#FF5252',
  },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#2E4038',
  },
  sectionCard: {
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#243028',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 14,
    textAlign: 'center' as const,
  },
  barChart: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center' as const,
    minWidth: 36,
    flex: 1,
  },
  barPct: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    marginBottom: 4,
  },
  bar: {
    width: '70%' as unknown as number,
    borderRadius: 6,
    minWidth: 16,
  },
  barLabel: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: '#8A9B90',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  fairwayVisual: {
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  fairwayArc: {
    flexDirection: 'row' as const,
    height: 40,
    width: 200,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    overflow: 'hidden' as const,
    marginBottom: 12,
  },
  fairwaySegLeft: {
    flex: 1,
    backgroundColor: '#e53935',
    borderTopLeftRadius: 100,
  },
  fairwaySegCenter: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  fairwaySegRight: {
    flex: 1,
    backgroundColor: '#e53935',
    borderTopRightRadius: 100,
  },
  fairwayStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    width: '100%' as unknown as number,
  },
  fairwayStat: {
    alignItems: 'center' as const,
    flex: 1,
  },
  fairwayStatPct: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#e53935',
  },
  fairwayHitPct: {
    color: '#4CAF50',
  },
  fairwayStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 2,
  },
  fairwayHitLabel: {
    color: '#4CAF50',
  },
  fairwayStatCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  fairwaySummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#243028',
  },
  fairwaySummaryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
  },
  girVisual: {
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  girTop: {
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  girMiddle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as unknown as number,
    marginBottom: 8,
  },
  girSide: {
    flex: 1,
    alignItems: 'center' as const,
  },
  girGreen: {
    width: 80,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  girGreenOval: {
    position: 'absolute' as const,
    bottom: 0,
    width: 80,
    height: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#1B5E20',
  },
  girBottom: {
    alignItems: 'center' as const,
    marginTop: 8,
  },
  girDirectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#8A9B90',
  },
  girDirectionPct: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  girSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#243028',
    marginTop: 8,
  },
  girSummaryItem: {
    alignItems: 'center' as const,
  },
  girSummaryValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  girSummaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 2,
  },
  puttSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 14,
  },
  puttSummaryItem: {
    alignItems: 'center' as const,
  },
  puttSummaryValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  puttSummaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 2,
  },
  boxRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F1714',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#1C2922',
  },
  statBoxWide: {
    flex: 1,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 4,
  },
  statBoxPct: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#5A6B60',
    marginTop: 2,
  },
  quitButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  quitText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
