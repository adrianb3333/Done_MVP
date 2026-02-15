import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import HorizontalPager from '@/components/HorizontalPager';
import Step1Page1 from './screens/Step1Page1';
import Step1Page2 from './screens/Step1Page2';
import Step1Page3 from './screens/Step1Page3';
import Step1Page4 from './screens/Step1Page4';
import { useSession } from '@/contexts/SessionContext';

export default function PlayStep1Screen() {
  const { finishSession } = useSession();

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
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
    color: Colors.text,
  },
  stepIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
