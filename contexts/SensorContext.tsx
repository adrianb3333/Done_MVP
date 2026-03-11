import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENSOR_PAIRED_KEY = '@sensors_paired';

export const [SensorProvider, useSensor] = createContextHook(() => {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    void AsyncStorage.getItem(SENSOR_PAIRED_KEY).then((val) => {
      if (val === 'true') {
        setIsPaired(true);
        console.log('[Sensor] Sensors previously paired');
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const markPaired = useCallback(() => {
    console.log('[Sensor] Marking sensors as paired');
    setIsPaired(true);
    void AsyncStorage.setItem(SENSOR_PAIRED_KEY, 'true').catch((e) => {
      console.log('[Sensor] Error saving paired state:', e);
    });
  }, []);

  const resetPairing = useCallback(() => {
    console.log('[Sensor] Resetting sensor pairing');
    setIsPaired(false);
    void AsyncStorage.removeItem(SENSOR_PAIRED_KEY).catch((e) => {
      console.log('[Sensor] Error removing paired state:', e);
    });
  }, []);

  return useMemo(() => ({
    isPaired,
    loaded,
    markPaired,
    resetPairing,
  }), [isPaired, loaded, markPaired, resetPairing]);
});
