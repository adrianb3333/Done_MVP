import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HoleInfo, getHolesForOption, MOCK_COURSE } from '@/mocks/courseData';
import { createRound, saveHoleScore, completeRound } from '@/services/roundService';

export type FairwayHit = 'left' | 'hit' | 'right';
export type GreenMiss = 'short' | 'long' | 'left' | 'right' | 'hit';
export type PuttDistance = '<1' | '1-2' | '2-4' | '4-8' | '8+';
export type InputStep = 'digit' | 'fairway' | 'green' | 'extrashot';

export interface HoleScore {
  holeNumber: number;
  score: number;
  fairway: FairwayHit | null;
  putts: number;
  puttDistance: PuttDistance | null;
  greenMiss: GreenMiss | null;
  bunkerShots: number;
  penaltyShots: number;
  chips: number;
  sandSave: boolean;
  upAndDown: boolean;
}

export interface PlayerRoundInfo {
  id: string;
  name: string;
  hcp: number;
}

const STORAGE_KEY_HOLE_OPTION = 'play_setup_hole_option';
const STORAGE_KEY_PLAYERS = 'play_setup_selected_players';

function createEmptyHoleScore(holeNumber: number): HoleScore {
  return {
    holeNumber,
    score: 0,
    fairway: null,
    putts: 2,
    puttDistance: null,
    greenMiss: null,
    bunkerShots: 0,
    penaltyShots: 0,
    chips: 0,
    sandSave: false,
    upAndDown: false,
  };
}

export const [ScoringProvider, useScoring] = createContextHook(() => {
  const [holeOption, setHoleOption] = useState<string>('18');
  const [holes, setHoles] = useState<HoleInfo[]>(MOCK_COURSE.holes);
  const [currentHoleIndex, setCurrentHoleIndex] = useState<number>(0);
  const [inputStep, setInputStep] = useState<InputStep>('digit');
  const [scores, setScores] = useState<Map<number, HoleScore>>(new Map());
  const [players, setPlayers] = useState<PlayerRoundInfo[]>([]);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [supabaseRoundId, setSupabaseRoundId] = useState<string | null>(null);

  useEffect(() => {
    loadSetupData();
  }, []);

  useEffect(() => {
    if (!supabaseRoundId) {
      initSupabaseRound();
    }
  }, []);

  const initSupabaseRound = async () => {
    try {
      const roundId = await createRound(MOCK_COURSE.name);
      if (roundId) {
        setSupabaseRoundId(roundId);
        console.log('[ScoringContext] Supabase round initialized:', roundId);
      }
    } catch (e) {
      console.log('[ScoringContext] Could not create supabase round:', e);
    }
  };

  const loadSetupData = async () => {
    try {
      const storedOption = await AsyncStorage.getItem(STORAGE_KEY_HOLE_OPTION);
      const option = storedOption || '18';
      setHoleOption(option);
      const activeHoles = getHolesForOption(option);
      setHoles(activeHoles);
      console.log('[ScoringContext] Loaded hole option:', option, 'holes:', activeHoles.length);

      const storedPlayers = await AsyncStorage.getItem(STORAGE_KEY_PLAYERS);
      if (storedPlayers) {
        const parsed = JSON.parse(storedPlayers) as { id: string; name: string; hcp?: number }[];
        setPlayers(parsed.map((p) => ({ id: p.id, name: p.name, hcp: p.hcp ?? 0 })));
      }
    } catch (e) {
      console.log('[ScoringContext] Error loading setup data:', e);
    }
  };

  const persistHoleToSupabase = useCallback(async (holeScore: HoleScore, par: number) => {
    if (!supabaseRoundId) {
      console.log('[ScoringContext] No supabase round id, skipping save');
      return;
    }
    try {
      await saveHoleScore(supabaseRoundId, holeScore, par);
    } catch (e) {
      console.log('[ScoringContext] Error persisting hole to supabase:', e);
    }
  }, [supabaseRoundId]);

  const completeSupabaseRound = useCallback(async () => {
    if (!supabaseRoundId) return;
    try {
      await completeRound(supabaseRoundId);
      console.log('[ScoringContext] Supabase round completed');
    } catch (e) {
      console.log('[ScoringContext] Error completing supabase round:', e);
    }
  }, [supabaseRoundId]);

  const currentHole = useMemo(() => {
    return holes[currentHoleIndex] ?? holes[0];
  }, [holes, currentHoleIndex]);

  const currentHoleScore = useMemo(() => {
    if (!currentHole) return createEmptyHoleScore(1);
    return scores.get(currentHole.number) ?? createEmptyHoleScore(currentHole.number);
  }, [scores, currentHole]);

  const totalScore = useMemo(() => {
    let total = 0;
    scores.forEach((s) => {
      if (s.score > 0) total += s.score;
    });
    return total;
  }, [scores]);

  const totalPar = useMemo(() => {
    let par = 0;
    scores.forEach((s, holeNum) => {
      if (s.score > 0) {
        const hole = holes.find((h) => h.number === holeNum);
        if (hole) par += hole.par;
      }
    });
    return par;
  }, [scores, holes]);

  const holesPlayed = useMemo(() => {
    let count = 0;
    scores.forEach((s) => {
      if (s.score > 0) count++;
    });
    return count;
  }, [scores]);

  const setScore = useCallback((holeNumber: number, score: number) => {
    setScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
      next.set(holeNumber, { ...existing, score });
      return next;
    });
    setInputStep('fairway');
  }, []);

  const setFairwayData = useCallback((holeNumber: number, fairway: FairwayHit, putts: number, puttDistance: PuttDistance | null) => {
    setScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
      next.set(holeNumber, { ...existing, fairway, putts, puttDistance });
      return next;
    });
    setInputStep('green');
  }, []);

  const setGreenData = useCallback((holeNumber: number, greenMiss: GreenMiss) => {
    setScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
      next.set(holeNumber, { ...existing, greenMiss });
      return next;
    });
    setInputStep('extrashot');
  }, []);

  const setExtraShotData = useCallback((
    holeNumber: number,
    bunkerShots: number,
    penaltyShots: number,
    chips: number,
    sandSave: boolean,
    upAndDown: boolean
  ) => {
    setScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
      const updated = { ...existing, bunkerShots, penaltyShots, chips, sandSave, upAndDown };
      next.set(holeNumber, updated);

      const holeInfo = holes.find((h) => h.number === holeNumber);
      if (holeInfo) {
        persistHoleToSupabase(updated, holeInfo.par);
      }

      return next;
    });
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex((prev) => prev + 1);
    }
    setInputStep('digit');
  }, [currentHoleIndex, holes, persistHoleToSupabase]);

  const goToNextHole = useCallback(() => {
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex((prev) => prev + 1);
      setInputStep('digit');
    }
  }, [currentHoleIndex, holes.length]);

  const goToPrevHole = useCallback(() => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex((prev) => prev - 1);
      setInputStep('digit');
    }
  }, [currentHoleIndex]);

  const goToHole = useCallback((index: number) => {
    if (index >= 0 && index < holes.length) {
      setCurrentHoleIndex(index);
      setInputStep('digit');
    }
  }, [holes.length]);

  const goBackStep = useCallback(() => {
    const stepOrder: InputStep[] = ['digit', 'fairway', 'green', 'extrashot'];
    const currentIndex = stepOrder.indexOf(inputStep);
    if (currentIndex > 0) {
      setInputStep(stepOrder[currentIndex - 1]);
    }
  }, [inputStep]);

  const clearHoleScore = useCallback((holeNumber: number) => {
    setScores((prev) => {
      const next = new Map(prev);
      next.delete(holeNumber);
      return next;
    });
    setInputStep('digit');
  }, []);

  const getScoreForHole = useCallback((holeNumber: number): HoleScore | undefined => {
    return scores.get(holeNumber);
  }, [scores]);

  const allScores = useMemo(() => {
    return Array.from(scores.entries()).sort((a, b) => a[0] - b[0]);
  }, [scores]);

  return {
    holeOption,
    holes,
    currentHole,
    currentHoleIndex,
    currentHoleScore,
    inputStep,
    scores,
    players,
    totalScore,
    totalPar,
    holesPlayed,
    showScoreboard,
    setShowScoreboard,
    setScore,
    setFairwayData,
    setGreenData,
    setExtraShotData,
    goToNextHole,
    goToPrevHole,
    goToHole,
    goBackStep,
    clearHoleScore,
    getScoreForHole,
    allScores,
    setInputStep,
    courseName: MOCK_COURSE.name,
    supabaseRoundId,
    completeSupabaseRound,
  };
});
