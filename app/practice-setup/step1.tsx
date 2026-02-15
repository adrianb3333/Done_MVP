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
import Step1Page1 from './screens/Step1Page1';
import Step1Page2 from './screens/Step1Page2';
import Step1Page3 from './screens/Step1Page3';
import Step1Page4 from './screens/Step1Page4';
import { useSession } from '@/contexts/SessionContext';

export default function PracticeStep1Screen() {
  const { finishSession } = useSession();
  const insets = useSafeAreaInsets(); // Get phone notch/bottom spacing

  const pages = [
    <Step1Page1 key="1" />,
    <Step1Page2 key="2" />,
    <Step1Page3 key="3" />,
    <Step1Page4 key="4" />,
  ];

  const handleBack = () => {
    finishSession();
  };

  const handleNext = () => {
    router.push('/practice-setup/step3');
  };

  return (
    <View style={styles.container}>
      {/* Header with manual top inset to avoid white bar */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <HorizontalPager pages={pages} />
      </View>

      {/* Footer with manual bottom inset so the button stays safe but the background is black */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Forces the "bars" to be black
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
    backgroundColor: '#000', // Matches the rest of the screen
  },
  nextButton: {
    backgroundColor: '#006735', // Your green color
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});