import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Switch, Modal } from 'react-native';
import { Clock, Thermometer, Timer, Wifi, Smartphone } from 'lucide-react-native';
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

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [deviceEnabled, setDeviceEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
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

        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Wifi size={18} color="#8A9B90" />
              <Text style={styles.toggleLabel}>Sensors</Text>
            </View>
            <Switch
              value={sensorsEnabled}
              onValueChange={setSensorsEnabled}
              trackColor={{ false: '#2A3530', true: 'rgba(0, 230, 118, 0.35)' }}
              thumbColor={sensorsEnabled ? '#00E676' : '#6B7B70'}
            />
          </View>
          <View style={styles.toggleDivider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Smartphone size={18} color="#8A9B90" />
              <Text style={styles.toggleLabel}>Device</Text>
            </View>
            <Switch
              value={deviceEnabled}
              onValueChange={setDeviceEnabled}
              trackColor={{ false: '#2A3530', true: 'rgba(0, 230, 118, 0.35)' }}
              thumbColor={deviceEnabled ? '#00E676' : '#6B7B70'}
            />
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.quitButton} onPress={() => setShowQuitConfirm(true)} activeOpacity={0.8}>
          <Text style={styles.quitText}>Quit Practice</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showQuitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuitConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>End Practice?</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to quit this practice session?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => setShowQuitConfirm(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={() => {
                  setShowQuitConfirm(false);
                  quitSession();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topContent: {
    flex: 1,
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
  toggleSection: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#141C18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#243028',
    overflow: 'hidden' as const,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#F5F7F6',
  },
  toggleDivider: {
    height: 1,
    backgroundColor: '#243028',
    marginHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  confirmBox: {
    backgroundColor: '#1A2520',
    borderRadius: 20,
    padding: 28,
    width: '80%' as unknown as number,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#2E4038',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#8A9B90',
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 21,
  },
  confirmButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as unknown as number,
  },
  confirmNo: {
    flex: 1,
    backgroundColor: '#243028',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  confirmNoText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  confirmYes: {
    flex: 1,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  confirmYesText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
