import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Switch } from 'react-native';
import { Clock, Thermometer, Timer, Radio, Smartphone } from 'lucide-react-native';
import { fetchGolfWeather } from '@/services/weatherApi';

export default function Step3Page1() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(true);
  const [sensorsEnabled, setSensorsEnabled] = useState<boolean>(false);
  const [deviceEnabled, setDeviceEnabled] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ready to Practice</Text>
      <Text style={styles.subtitle}>Session overview</Text>

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
        <View style={styles.miniStat}>
          <Timer size={16} color="#00E676" />
          <Text style={styles.miniStatLabel}>Timer</Text>
          <Text style={styles.miniStatValue}>0:00</Text>
        </View>
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Radio size={20} color={sensorsEnabled ? '#00E676' : '#8A9B90'} strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>SENSORS</Text>
        </View>
        <Switch
          value={sensorsEnabled}
          onValueChange={setSensorsEnabled}
          trackColor={{ false: '#2A3A2E', true: '#1B5E20' }}
          thumbColor={sensorsEnabled ? '#00E676' : '#666'}
          ios_backgroundColor="#2A3A2E"
        />
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Smartphone size={20} color={deviceEnabled ? '#00E676' : '#8A9B90'} strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>DEVICE</Text>
        </View>
        <Switch
          value={deviceEnabled}
          onValueChange={setDeviceEnabled}
          trackColor={{ false: '#2A3A2E', true: '#1B5E20' }}
          thumbColor={deviceEnabled ? '#00E676' : '#666'}
          ios_backgroundColor="#2A3A2E"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#E8EDE9',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#8A9B90',
    marginBottom: 36,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    gap: 8,
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
  toggleCard: {
    backgroundColor: '#141C18',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: '#243028',
    marginTop: 12,
  },
  toggleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#243028',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    letterSpacing: 0.5,
  },
});
