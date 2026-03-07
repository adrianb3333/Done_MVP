import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Switch, Platform } from 'react-native';
import { Lock, Clock, Thermometer, Timer, Radio, Smartphone } from 'lucide-react-native';
import { fetchGolfWeather } from '@/services/weatherApi';

interface Step3Page1Props {
  onRoundNameChange?: (name: string) => void;
  roundDate: string;
  onPrivateChange?: (isPrivate: boolean) => void;
}

export default function Step3Page1({ onRoundNameChange, roundDate, onPrivateChange }: Step3Page1Props) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sensorsEnabled, setSensorsEnabled] = useState<boolean>(false);
  const [deviceEnabled, setDeviceEnabled] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(true);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
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

  const handleNameChange = (text: string) => {
    setRoundName(text);
    onRoundNameChange?.(text);
  };

  const handlePrivateToggle = (val: boolean) => {
    setIsPrivate(val);
    onPrivateChange?.(val);
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.miniStatsRow}>
        <View style={styles.miniStat}>
          <Clock size={14} color="#FFFFFF" />
          <Text style={styles.miniStatValue}>{formatTime(currentTime)}</Text>
        </View>
        <View style={styles.miniStat}>
          <Thermometer size={14} color="#FFFFFF" />
          <Text style={styles.miniStatValue}>
            {tempLoading ? '...' : temperature !== null ? `${temperature}°C` : '--°C'}
          </Text>
        </View>
        <View style={styles.miniStat}>
          <Timer size={14} color="#FFFFFF" />
          <Text style={styles.miniStatValue}>0:00</Text>
        </View>
      </View>

      <View style={styles.nameDateCard}>
        <View style={styles.nameDateRow}>
          <View style={styles.nameColumn}>
            <Text style={styles.columnLabel}>NAMN</Text>
            {isEditingName ? (
              <TextInput
                style={styles.nameInput}
                value={roundName}
                onChangeText={handleNameChange}
                onBlur={() => setIsEditingName(false)}
                autoFocus
                placeholder=""
                placeholderTextColor="#8A9B90"
              />
            ) : (
              <Pressable onPress={() => setIsEditingName(true)}>
                <Text style={styles.nameValue}>
                  {roundName || ' '}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.columnLabel}>DATUM</Text>
            <Text style={styles.dateValue}>{roundDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.privateCard}>
        <View style={styles.privateLeft}>
          <View style={styles.lockIcon}>
            <Lock size={20} color={isPrivate ? '#FFFFFF' : '#8A9B90'} strokeWidth={2} />
          </View>
          <Text style={styles.privateText}>PRIVATE</Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={handlePrivateToggle}
          trackColor={{ false: '#2A2A2A', true: '#444444' }}
          thumbColor={isPrivate ? '#FFFFFF' : '#666'}
          ios_backgroundColor="#2A3A2E"
        />
      </View>

      <View style={styles.privateCard}>
        <View style={styles.privateLeft}>
          <View style={styles.lockIcon}>
            <Radio size={20} color={sensorsEnabled ? '#FFFFFF' : '#8A9B90'} strokeWidth={2} />
          </View>
          <Text style={styles.privateText}>SENSORS</Text>
        </View>
        <Switch
          value={sensorsEnabled}
          onValueChange={setSensorsEnabled}
          trackColor={{ false: '#2A2A2A', true: '#444444' }}
          thumbColor={sensorsEnabled ? '#FFFFFF' : '#666'}
          ios_backgroundColor="#2A3A2E"
        />
      </View>

      <View style={styles.privateCard}>
        <View style={styles.privateLeft}>
          <View style={styles.lockIcon}>
            <Smartphone size={20} color={deviceEnabled ? '#FFFFFF' : '#8A9B90'} strokeWidth={2} />
          </View>
          <Text style={styles.privateText}>DEVICE</Text>
        </View>
        <Switch
          value={deviceEnabled}
          onValueChange={setDeviceEnabled}
          trackColor={{ false: '#2A2A2A', true: '#444444' }}
          thumbColor={deviceEnabled ? '#FFFFFF' : '#666'}
          ios_backgroundColor="#2A3A2E"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
    gap: 8,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: '#141C18',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#243028',
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  nameDateCard: {
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#243028',
  },
  nameDateRow: {
    flexDirection: 'row' as const,
  },
  nameColumn: {
    flex: 1,
  },
  dateColumn: {
    flex: 1,
    alignItems: 'flex-end' as const,
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#8A9B90',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  nameValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    minHeight: 22,
  },
  nameInput: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    padding: 0,
    margin: 0,
    minHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#F5F7F6',
  },
  privateCard: {
    backgroundColor: '#141C18',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: '#243028',
    marginBottom: 12,
  },
  privateLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  lockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#243028',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  privateText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    letterSpacing: 0.5,
  },
});
