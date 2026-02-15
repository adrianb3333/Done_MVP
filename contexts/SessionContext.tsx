import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionType = 'play' | 'practice' | null;
export type SessionState = 'idle' | 'setup' | 'active' | 'minimized';

export interface LastRoundData {
  totalScore: number;
  totalPar: number;
  holesPlayed: number;
  courseName: string;
  players: string[];
  roundDate: string;
  roundName: string;
  duration: string;
}

interface SessionContextValue {
  sessionType: SessionType;
  sessionState: SessionState;
  setupStep: number;
  sessionStartTime: number | null;
  roundName: string;
  roundDate: string;
  isPrivate: boolean;
  lastRound: LastRoundData | null;
  startSetup: (type: 'play' | 'practice') => void;
  nextSetupStep: () => void;
  prevSetupStep: () => void;
  startSession: (name?: string, date?: string) => void;
  minimizeSession: () => void;
  expandSession: () => void;
  finishSession: () => void;
  finishRoundWithData: (data: LastRoundData) => void;
  quitSession: () => void;
}

const LAST_ROUND_KEY = 'last_round_data';

export const [SessionProvider, useSession] = createContextHook<SessionContextValue>(() => {
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [setupStep, setSetupStep] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [roundName, setRoundName] = useState<string>('');
  const [roundDate, setRoundDate] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [lastRound, setLastRound] = useState<LastRoundData | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_ROUND_KEY).then((stored) => {
      if (stored) {
        try {
          setLastRound(JSON.parse(stored));
        } catch (e) {
          console.log('[Session] Error parsing last round:', e);
        }
      }
    });
  }, []);

  const startSetup = useCallback((type: 'play' | 'practice') => {
    console.log('Starting setup for:', type);
    setSessionType(type);
    setSessionState('setup');
    setSetupStep(1);
    if (type === 'play') {
      router.push('/play-setup/step1' as any);
    } else {
      router.push('/practice-setup/step1' as any);
    }
  }, []);

  const nextSetupStep = useCallback(() => {
    console.log('Next setup step');
    setSetupStep(prev => Math.min(prev + 1, 3));
  }, []);

  const prevSetupStep = useCallback(() => {
    console.log('Prev setup step');
    setSetupStep(prev => Math.max(prev - 1, 1));
  }, []);

  const startSession = useCallback((name?: string, date?: string) => {
    console.log('Starting session', name, date);
    setSessionState('active');
    setSetupStep(1);
    setSessionStartTime(Date.now());
    setRoundName(name || '');
    setRoundDate(date || new Date().toISOString().split('T')[0]);
  }, []);

  const minimizeSession = useCallback(() => {
    console.log('Minimizing session');
    setSessionState('minimized');
  }, []);

  const expandSession = useCallback(() => {
    console.log('Expanding session');
    setSessionState('active');
  }, []);

  const finishSession = useCallback(() => {
    console.log('Finishing session');
    setSessionType(null);
    setSessionState('idle');
    setSetupStep(1);
    setSessionStartTime(null);
    setRoundName('');
    setRoundDate('');
    setIsPrivate(false);
    router.replace('/(tabs)/profile' as any);
  }, []);

  const finishRoundWithData = useCallback((data: LastRoundData) => {
    console.log('Finishing round with data:', data);
    setLastRound(data);
    AsyncStorage.setItem(LAST_ROUND_KEY, JSON.stringify(data)).catch((e) => {
      console.log('[Session] Error saving last round:', e);
    });
    setSessionType(null);
    setSessionState('idle');
    setSetupStep(1);
    setSessionStartTime(null);
    setRoundName('');
    setRoundDate('');
    setIsPrivate(false);
    router.replace('/(tabs)/profile' as any);
  }, []);

  const quitSession = useCallback(() => {
    console.log('Quitting session');
    setSessionType(null);
    setSessionState('idle');
    setSetupStep(1);
    setSessionStartTime(null);
    setRoundName('');
    setRoundDate('');
    setIsPrivate(false);
    router.replace('/(tabs)/profile' as any);
  }, []);

  return {
    sessionType,
    sessionState,
    setupStep,
    sessionStartTime,
    roundName,
    roundDate,
    isPrivate,
    lastRound,
    startSetup,
    nextSetupStep,
    prevSetupStep,
    startSession,
    minimizeSession,
    expandSession,
    finishSession,
    finishRoundWithData,
    quitSession,
  };
});
