import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Pressable, 
  LayoutAnimation, 
  Platform, 
  UIManager 
} from 'react-native';
import { supabase } from '@/lib/supabase';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DrillStats {
  latest: number | string;
  avg: number;
  best: number;
  subDrills: { name: string; score: number; avg: number; best: number }[];
}

const DRILL_TYPES = [
  { id: 'The Gate', label: 'Gate', subLabels: ['1 Meter', '3 Meter', '5 Meter'] },
  { id: 'The Clock', label: 'Clock', subLabels: ['1 Meter', '3 Meter', '5 Meter'] },
  { id: '27 Challenge', label: 'Challenge 27', subLabels: ['Round 1', 'Round 2', 'Round 3'] },
  { id: 'The Ladder', label: 'Ladder', subLabels: ['Round 1', 'Round 2', 'Round 3'] },
];

export default function PutData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, DrillStats>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('golf_drills')
        .select('drill_name, score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedStats: Record<string, DrillStats> = {};

      DRILL_TYPES.forEach((drill) => {
        const drillRows = data?.filter(row => row.drill_name.startsWith(drill.id)) || [];
        
        const subDrills = drill.subLabels.map(subLabel => {
          const specificRows = drillRows.filter(r => r.drill_name.includes(subLabel));
          const scores = specificRows.map(r => r.score);
          return {
            name: subLabel,
            score: specificRows[0]?.score ?? 0,
            avg: scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0,
            best: scores.length ? Math.max(...scores) : 0,
          };
        });

        if (drillRows.length > 0) {
          const allScores = drillRows.map(r => r.score);
          processedStats[drill.id] = {
            latest: drillRows[0].score,
            avg: parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)),
            best: Math.max(...allScores),
            subDrills
          };
        } else {
          processedStats[drill.id] = { latest: '-', avg: 0, best: 0, subDrills };
        }
      });

      setStats(processedStats);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ marginVertical: 30 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Performance Overview</Text>
      
      {DRILL_TYPES.map((drill) => {
        const isExpanded = expandedId === drill.id;
        const drillData = stats[drill.id];

        return (
          <Pressable 
            key={drill.id} 
            onPress={() => toggleExpand(drill.id)}
            style={[styles.drillCard, isExpanded && styles.drillCardExpanded]}
          >
            {/* Standard Row - Stays visible always */}
            <View style={styles.mainRow}>
              <Text style={styles.drillLabel}>{drill.label}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>LATEST</Text>
                  <Text style={styles.statValue}>{drillData?.latest ?? '-'}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>AVERAGE</Text>
                  <Text style={styles.statValue}>{drillData?.avg ?? 0}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: '#8ecae6' }]}>BEST</Text>
                  <Text style={[styles.statValue, { color: '#8ecae6' }]}>{drillData?.best ?? 0}</Text>
                </View>
              </View>
            </View>

            {/* Expanded Detailed View */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {drillData?.subDrills.map((sub, idx) => (
                  <View key={idx} style={styles.subDrillContainer}>
                    <View style={styles.subHeader}>
                      <Text style={styles.subLabelText}>{sub.name}</Text>
                      <View style={styles.detailedStats}>
                        <Text style={styles.detailText}>Latest: <Text style={styles.white}>{sub.score}</Text></Text>
                        <Text style={styles.detailText}>Average: <Text style={styles.white}>{sub.avg}</Text></Text>
                        <Text style={styles.detailText}>Best: <Text style={styles.blue}>{sub.best}</Text></Text>
                      </View>
                    </View>
                    {/* UI Bar Container */}
                    <View style={styles.barBackground}>
                      <View style={[styles.barFill, { width: `${(sub.score / 10) * 100}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  sectionTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  drillCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  drillCardExpanded: {
    borderColor: '#333',
    backgroundColor: '#0F0F0F',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillLabel: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-end',
    minWidth: 45,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  subDrillContainer: {
    marginBottom: 16,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  subLabelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  detailedStats: {
    flexDirection: 'row',
    gap: 10,
  },
  detailText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '700',
  },
  white: { color: '#FFF' },
  blue: { color: '#8ecae6' },
  barBackground: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    width: '100%',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#8ecae6',
    borderRadius: 2,
  },
});
