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
import HorizontalPager from '@/components/HorizontalPager';
import Step2Page1 from './screens/Step2Page1';
import Step2Page2 from './screens/Step2Page2';

export default function PracticeStep2Screen() {
  const insets = useSafeAreaInsets();

  const pages = [
    <Step2Page1 key="1" />,
    <Step2Page2 key="2" />,
  ];

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    router.push('/practice-setup/step3');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Round Data</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>2/3</Text>
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
    backgroundColor: '#000',
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
    backgroundColor: '#333333',
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
    backgroundColor: '#000',
  },
  nextButton: {
    backgroundColor: '#333333',
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
