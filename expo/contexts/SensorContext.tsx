import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export const [SensorProvider, useSensor] = createContextHook(() => {
  const [isPaired, setIsPaired] = useState<boolean>(false);

  const markPaired = useCallback(() => {
    console.log('[Sensor] Marking sensors as paired for this session');
    setIsPaired(true);
  }, []);

  const resetPairing = useCallback(() => {
    console.log('[Sensor] Resetting sensor pairing');
    setIsPaired(false);
  }, []);

  return useMemo(() => ({
    isPaired,
    loaded: true,
    markPaired,
    resetPairing,
  }), [isPaired, markPaired, resetPairing]);
});
