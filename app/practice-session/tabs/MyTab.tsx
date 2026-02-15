import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Clock, Thermometer, Timer } from 'lucide-react-native';
import { useSession } from '@/contexts/SessionContext';
import { fetchGolfWeather } from '@/services/weatherApi';

export default function MyTab() {
  const { quitSession, sessionStartTime } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(true);
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
      setTempLoading(true);
      try {
        if (Platform.OS !== 'web' || navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          const result = await fetchGolfWeather(position.coords.latitude, position.coords.longitude);
          if (result) {
            setTemperature(result.temp);
          }
        }
      } catch (e) {
        console.log('Could not get location/weather:', e);
        const result = await fetchGolfWeather(59.33, 18.07);
        if (result) {
          setTemperature(result.temp);
        }
      } finally {
        setTempLoading(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.miniStatsRow}>
        <View style={styles.miniStat}>
          <Clock size={16} color="#00E676" />
          <Text style={styles.miniStatLabel}>Time</Text>
          <Text style={styles.miniStatValue}>{formatTime(currentTime)}</Text>
        </View>
        <View style={styles.miniStat}>
          <Thermometer size={16} color="#00E676" />
          <Text style={styles.miniStatLabel}>Temp</Text>
          <Text style={styles.miniStatValue}>
            {tempLoading ? '...' : temperature !== null ? `${temperature}°C` : '--°C'}
          </Text>
        </View>
        <View style={[styles.miniStat, styles.timerStat]}>
          <Timer size={16} color="#00E676" />
          <Text style={styles.miniStatLabel}>Duration</Text>
          <Text style={[styles.miniStatValue, styles.timerValue]}>{formatElapsed(elapsed)}</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.quitButton} onPress={quitSession} activeOpacity={0.8}>
          <Text style={styles.quitText}>Quit Practice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between' as const,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 4,
  },
  timerStat: {
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#8A9B90',
    letterSpacing: 0.3,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  timerValue: {
    color: '#00E676',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  quitButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  quitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
