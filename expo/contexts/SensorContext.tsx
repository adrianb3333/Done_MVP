import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENSOR_PAIRED_KEY = 'sensor_is_paired';
const SENSOR_CLUBS_KEY = 'sensor_paired_clubs';

export const [SensorProvider, useSensor] = createContextHook(() => {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairedClubs, setPairedClubs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const [pairedRaw, clubsRaw] = await Promise.all([
          AsyncStorage.getItem(SENSOR_PAIRED_KEY),
          AsyncStorage.getItem(SENSOR_CLUBS_KEY),
        ]);
        if (pairedRaw === 'true') {
          setIsPaired(true);
          console.log('[Sensor] Restored paired state from storage');
        }
        if (clubsRaw) {
          const clubs: string[] = JSON.parse(clubsRaw);
          setPairedClubs(clubs);
          console.log('[Sensor] Restored paired clubs from storage:', clubs.length);
        }
      } catch (e) {
        console.log('[Sensor] Error loading persisted state:', e);
      } finally {
        setLoaded(true);
      }
    };
    void loadState();
  }, []);

  const markPaired = useCallback((clubs?: string[]) => {
    console.log('[Sensor] Marking sensors as paired (persisted)');
    setIsPaired(true);
    AsyncStorage.setItem(SENSOR_PAIRED_KEY, 'true').catch(() => {});
    if (clubs && clubs.length > 0) {
      setPairedClubs(clubs);
      AsyncStorage.setItem(SENSOR_CLUBS_KEY, JSON.stringify(clubs)).catch(() => {});
      console.log('[Sensor] Saved paired clubs:', clubs.length);
    }
  }, []);

  const resetPairing = useCallback(() => {
    console.log('[Sensor] Resetting sensor pairing (clearing storage)');
    setIsPaired(false);
    setPairedClubs([]);
    AsyncStorage.multiRemove([SENSOR_PAIRED_KEY, SENSOR_CLUBS_KEY]).catch(() => {});
  }, []);

  return useMemo(() => ({
    isPaired,
    pairedClubs,
    loaded,
    markPaired,
    resetPairing,
  }), [isPaired, pairedClubs, loaded, markPaired, resetPairing]);
});
