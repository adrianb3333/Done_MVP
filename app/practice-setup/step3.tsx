import React from 'react';
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

export default function PracticeStep3Screen() {
  const { startSession } = useSession();
  const insets = useSafeAreaInsets(); // Key for removing white bars

  const pages = [<Step3Page1 key="1" />];

  const handleBack = () => {
    router.back();
  };

  const handleStart = () => {
    startSession();
  };

  return (
    <View style={styles.container}>
      {/* Header: Manual padding top to clear the notch while keeping background black */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <HorizontalPager pages={pages} />
      </View>

      {/* Footer: Manual bottom padding to respect the home indicator area */}
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
    backgroundColor: '#000', // Kills the white bars at the top/bottom
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
  startButton: {
    backgroundColor: '#006735', // Your primary green
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