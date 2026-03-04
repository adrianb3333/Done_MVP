import { supabase } from '@/lib/supabase';

const DRILL_TARGET_COUNTS: Record<string, number> = {
  '9 Box': 9,
  '27 Challenge': 9,
};

const DEFAULT_TARGETS = 10;

function getTargetCountForDrill(drillName: string): number {
  for (const [key, count] of Object.entries(DRILL_TARGET_COUNTS)) {
    if (drillName.toLowerCase().startsWith(key.toLowerCase())) {
      return count;
    }
  }
  return DEFAULT_TARGETS;
}

export async function fetchRoundShotCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[ShotCountService] No user');
      return 0;
    }

    const { data: rounds, error: roundError } = await supabase
      .from('rounds')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_completed', true);

    if (roundError || !rounds || rounds.length === 0) {
      console.log('[ShotCountService] No completed rounds');
      return 0;
    }

    const roundIds = rounds.map((r: { id: string }) => r.id);

    const { data: holeRows, error: holeError } = await supabase
      .from('hole_scores')
      .select('score')
      .in('round_id', roundIds);

    if (holeError || !holeRows) {
      console.log('[ShotCountService] Error fetching hole scores:', holeError?.message);
      return 0;
    }

    let totalShots = 0;
    for (const row of holeRows as { score: number }[]) {
      if (row.score > 0) totalShots += row.score;
    }

    console.log('[ShotCountService] Total round shots:', totalShots);
    return totalShots;
  } catch (e) {
    console.error('[ShotCountService] fetchRoundShotCount error:', e);
    return 0;
  }
}

export async function fetchPracticeShotCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[ShotCountService] No user');
      return 0;
    }

    const { data: records, error } = await supabase
      .from('golf_drills')
      .select('drill_name')
      .eq('user_id', user.id);

    if (error || !records) {
      console.log('[ShotCountService] Error fetching drills:', error?.message);
      return 0;
    }

    let totalShots = 0;
    for (const record of records as { drill_name: string }[]) {
      totalShots += getTargetCountForDrill(record.drill_name);
    }

    console.log('[ShotCountService] Total practice shots:', totalShots, 'from', records.length, 'drill entries');
    return totalShots;
  } catch (e) {
    console.error('[ShotCountService] fetchPracticeShotCount error:', e);
    return 0;
  }
}
