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

export default function PlayStep1Screen() {
  const { finishSession } = useSession();
  const insets = useSafeAreaInsets();

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
    router.push('/play-setup/step2');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Round</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>1/3</Text>
        </View>
      </View>

      <View style={styles.content}>
        <HorizontalPager pages={pages} />
      </View>

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
  nextButton: {
    backgroundColor: '#1B5E20',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
