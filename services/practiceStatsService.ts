import { supabase } from '@/lib/supabase';

export interface DrillRecord {
  id: string;
  drill_name: string;
  score: number;
  created_at: string;
}

export interface DrillCategoryStats {
  category: string;
  drills: {
    name: string;
    avgScore: number;
    bestScore: number;
    totalAttempts: number;
    recentScores: number[];
  }[];
  overallAvg: number;
  totalAttempts: number;
}

const DRILL_CATEGORIES: Record<string, string[]> = {
  Putting: ['The Gate', 'The Clock', '27 Challenge', 'The Ladder'],
  Wedges: ['Bunker', 'Cirkel', '5-30m', 'Area Towel'],
  Irons: ['9 Box', 'Mr Routine', 'Distance Control', 'Pause'],
  Woods: ['Power Line', 'Fade', 'Accuracy', 'Draw'],
};

function matchDrillToCategory(drillName: string): { category: string; baseName: string } | null {
  const lower = drillName.toLowerCase();
  for (const [category, drills] of Object.entries(DRILL_CATEGORIES)) {
    for (const drill of drills) {
      if (lower.startsWith(drill.toLowerCase())) {
        return { category, baseName: drill };
      }
    }
  }
  return null;
}

export async function fetchPracticeStats(): Promise<DrillCategoryStats[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[PracticeStats] No user');
      return [];
    }

    const { data: records, error } = await supabase
      .from('golf_drills')
      .select('id, drill_name, score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !records) {
      console.log('[PracticeStats] Error fetching drills:', error?.message);
      return [];
    }

    console.log('[PracticeStats] Fetched', records.length, 'drill records');

    const grouped: Record<string, Record<string, number[]>> = {};

    for (const record of records as DrillRecord[]) {
      const match = matchDrillToCategory(record.drill_name);
      if (!match) continue;

      if (!grouped[match.category]) grouped[match.category] = {};
      if (!grouped[match.category][match.baseName]) grouped[match.category][match.baseName] = [];
      grouped[match.category][match.baseName].push(record.score);
    }

    const categoryOrder = ['Putting', 'Wedges', 'Irons', 'Woods'];
    const result: DrillCategoryStats[] = [];

    for (const category of categoryOrder) {
      const drillsInCategory = DRILL_CATEGORIES[category];
      const categoryData = grouped[category] || {};
      const drills = drillsInCategory.map((drillName) => {
        const scores = categoryData[drillName] || [];
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        return {
          name: drillName,
          avgScore,
          bestScore,
          totalAttempts: scores.length,
          recentScores: scores.slice(0, 5),
        };
      });

      const allScores = Object.values(categoryData).flat();
      const overallAvg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

      result.push({
        category,
        drills,
        overallAvg,
        totalAttempts: allScores.length,
      });
    }

    return result;
  } catch (e) {
    console.error('[PracticeStats] fetchPracticeStats error:', e);
    return [];
  }
}
