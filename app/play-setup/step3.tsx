import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import HorizontalPager from '@/components/HorizontalPager';
import Step3Page1 from './screens/Step3Page1';
import { useSession } from '@/contexts/SessionContext';

export default function PlayStep3Screen() {
  const { startSession } = useSession();
  const insets = useSafeAreaInsets();
  const [roundName, setRoundName] = useState<string>('');  
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const today = new Date().toISOString().split('T')[0];

  const handleNameChange = useCallback((name: string) => {
    setRoundName(name);
  }, []);

  const handlePrivateChange = useCallback((val: boolean) => {
    setIsPrivate(val);
  }, []);

  const pages = [<Step3Page1 key="1" onRoundNameChange={handleNameChange} roundDate={today} onPrivateChange={handlePrivateChange} />];

  const handleBack = () => {
    router.back();
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('play_round_private', JSON.stringify(isPrivate));
    startSession(roundName, today);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Round</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>3/3</Text>
        </View>
      </View>

      <View style={styles.content}>
        <HorizontalPager pages={pages} />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  stepIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    backgroundColor: '#0A0F0D',
  },
  startButton: {
    backgroundColor: '#1B5E20',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
