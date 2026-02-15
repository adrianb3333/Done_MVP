import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Pressable, 
  LayoutAnimation, 
  Platform, 
  UIManager,
} from 'react-native';
import { supabase } from '@/lib/supabase';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SubDrillStats {
  name: string;
  score: number;
  avg: number;
  best: number;
}

interface DrillStats {
  latest: number | string;
  avg: number;
  best: number;
  subDrills: SubDrillStats[];
}

const IRON_DRILL_TYPES = [
  { 
    id: '9 Box', 
    label: '9 Box Shape', 
    subLabels: ['Low', 'Mid', 'High'] 
  },
  { 
    id: 'Distance Control', 
    label: 'Distance Control', 
    subLabels: ['135m', '165m', '185m'] 
  },
  { 
    id: 'My Routine', 
    label: 'Shot Routine', 
    subLabels: ['9 iron', '7 iron', '5 iron'] 
  },
  { 
    id: 'Pause Drill', // Matches "Pause Drill" from your DrillsTab logic
    label: 'Swing Pause', 
    subLabels: ['9 Iron', '7 Iron', '5 Iron'] 
  },
];

const COLORS = {
  accent: '#8ecae6', 
  border: '#1A1A1A',
  cardBg: '#0A0A0A',
  cardExpanded: '#0F0F0F',
  textDim: 'rgba(255,255,255,0.25)',
  textSub: 'rgba(255,255,255,0.5)',
};

export default function IroData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, DrillStats>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();

    // REALTIME LISTENER: Immediately refreshes UI when a new drill is saved to Supabase
    const subscription = supabase
      .channel('iron_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'golf_drills' 
      }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

      IRON_DRILL_TYPES.forEach((drill) => {
        // Find all rows that contain the drill name (case-insensitive)
        const drillRows = data?.filter(row => 
          row.drill_name.toLowerCase().includes(drill.id.toLowerCase())
        ) || [];
        
        const subDrills = drill.subLabels.map(subLabel => {
          // Find specific sub-type rows (e.g., "Low") within this drill category
          const specificRows = drillRows.filter(r => 
            r.drill_name.toLowerCase().includes(subLabel.toLowerCase())
          );
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
      console.error('Error fetching iron history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 30 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Iron & Ball Striking</Text>
      
      {IRON_DRILL_TYPES.map((drill) => {
        const isExpanded = expandedId === drill.id;
        const drillData = stats[drill.id];

        return (
          <Pressable 
            key={drill.id} 
            onPress={() => toggleExpand(drill.id)}
            style={[styles.drillCard, isExpanded && styles.drillCardExpanded]}
          >
            <View style={styles.mainRow}>
              <Text style={styles.drillLabel}>{drill.label}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>AVG</Text>
                  <Text style={styles.statValue}>{drillData?.avg ?? 0}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: COLORS.accent }]}>BEST</Text>
                  <Text style={[styles.statValue, { color: COLORS.accent }]}>{drillData?.best ?? 0}</Text>
                </View>
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedContent}>
                {drillData?.subDrills.map((sub, idx) => (
                  <View key={idx} style={styles.subDrillItem}>
                    <View style={styles.subHeader}>
                      <Text style={styles.subLabelText}>{sub.name}</Text>
                      <View style={styles.detailedStats}>
                        <Text style={styles.detailText}>Avg: <Text style={styles.white}>{sub.avg}</Text></Text>
                        <Text style={styles.detailText}>Best: <Text style={styles.accentText}>{sub.best}</Text></Text>
                      </View>
                    </View>
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
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  drillCardExpanded: {
    borderColor: '#333',
    backgroundColor: COLORS.cardExpanded,
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
    color: COLORS.textDim,
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
    borderTopColor: COLORS.border,
  },
  subDrillItem: {
    marginBottom: 18,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  subLabelText: {
    color: COLORS.textSub,
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
  accentText: { color: COLORS.accent },
  barBackground: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    width: '100%',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
});
