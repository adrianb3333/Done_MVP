import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Switch } from 'react-native';
import { Clock, Thermometer, Timer, Radio, Smartphone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchGolfWeather } from '@/services/weatherApi';
import { useSession } from '@/contexts/SessionContext';

function BlueBorderWrap({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient
      colors={['#1C8CFF', '#1075E3', '#0059B2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: 13, padding: 1.5 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

export default function Step3Page1() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(true);
  const { sensorsEnabled, setSensorsEnabled } = useSession();
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
    void loadTemp();
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

      <BlueBorderWrap>
        <LinearGradient
          colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.miniStatsRow}
        >
          <View style={styles.miniStat}>
            <Clock size={16} color="#FFFFFF" />
            <Text style={styles.miniStatLabel}>Time</Text>
            <Text style={styles.miniStatValue}>{formatTime(currentTime)}</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <Thermometer size={16} color="#FFFFFF" />
            <Text style={styles.miniStatLabel}>Temp</Text>
            <Text style={styles.miniStatValue}>
              {tempLoading ? '...' : temperature !== null ? `${temperature}°C` : '--°C'}
            </Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <Timer size={16} color="#FFFFFF" />
            <Text style={styles.miniStatLabel}>Timer</Text>
            <Text style={styles.miniStatValue}>0:00</Text>
          </View>
        </LinearGradient>
      </BlueBorderWrap>

      <BlueBorderWrap style={{ marginTop: 12 }}>
        <LinearGradient
          colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.toggleCard}
        >
          <View style={styles.toggleLeft}>
            <View style={styles.toggleIcon}>
              <Radio size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.toggleText}>SENSORS</Text>
          </View>
          <Switch
            value={sensorsEnabled}
            onValueChange={setSensorsEnabled}
            trackColor={{ false: '#FFFFFF', true: '#1075E3' }}
            thumbColor={sensorsEnabled ? '#FFFFFF' : '#CCC'}
            ios_backgroundColor="#FFFFFF"
          />
        </LinearGradient>
      </BlueBorderWrap>

      <BlueBorderWrap style={{ marginTop: 12 }}>
        <LinearGradient
          colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.toggleCard}
        >
          <View style={styles.toggleLeft}>
            <View style={styles.toggleIcon}>
              <Smartphone size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.toggleText}>DEVICE</Text>
          </View>
          <Switch
            value={deviceEnabled}
            onValueChange={setDeviceEnabled}
            trackColor={{ false: '#FFFFFF', true: '#1075E3' }}
            thumbColor={deviceEnabled ? '#FFFFFF' : '#CCC'}
            ios_backgroundColor="#FFFFFF"
          />
        </LinearGradient>
      </BlueBorderWrap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#0059B2',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#1075E3',
    marginBottom: 36,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    borderRadius: 12,
    overflow: 'hidden' as const,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 4,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#D1F2DE',
    letterSpacing: 0.3,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  toggleCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
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
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
