import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProfile } from '@/contexts/ProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SEGMENT_KEYS = ['Drill', 'Round', 'Tournament'] as const;
type CreateSegment = typeof SEGMENT_KEYS[number];

interface CrewCreateScreenProps {
  onClose: () => void;
}

export default function CrewCreateScreen({ onClose }: CrewCreateScreenProps) {
  const { crewColor } = useProfile();
  const bgColor = crewColor || '#FFFFFF';
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const segmentWidth = (SCREEN_WIDTH - 40 - 48) / SEGMENT_KEYS.length;
  const underlineWidth = 40;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      48 + (segmentWidth - underlineWidth) / 2,
      48 + segmentWidth + (segmentWidth - underlineWidth) / 2,
      48 + segmentWidth * 2 + (segmentWidth - underlineWidth) / 2,
    ],
  });

  const handleSegmentChange = useCallback((index: number) => {
    setActiveSegment(index);
    Animated.spring(underlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [underlineAnim]);

  const renderContent = useCallback(() => {
    const segment = SEGMENT_KEYS[activeSegment];
    const emojiMap: Record<CreateSegment, string> = {
      Drill: '🎯',
      Round: '⛳',
      Tournament: '🏆',
    };
    const descMap: Record<CreateSegment, string> = {
      Drill: 'Create practice drills and training exercises for your crew.',
      Round: 'Set up a round for your crew members to play together.',
      Tournament: 'Organize tournaments and competitions for your crew.',
    };

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyEmoji}>{emojiMap[segment]}</Text>
        </View>
        <Text style={styles.emptyTitle}>{segment}</Text>
        <Text style={styles.emptyText}>{descMap[segment]}</Text>
      </View>
    );
  }, [activeSegment]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView edges={['top']} style={[styles.safeTop, { backgroundColor: bgColor }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.glassBackBtn}
            activeOpacity={0.7}
            testID="crew-create-back"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.segmentRow}>
            {SEGMENT_KEYS.map((seg, idx) => (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentBtn, { width: segmentWidth }]}
                onPress={() => handleSegmentChange(idx)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.segmentText,
                  bgColor !== '#FFFFFF' && { color: 'rgba(255,255,255,0.5)' },
                  activeSegment === idx && styles.segmentTextActive,
                  activeSegment === idx && bgColor !== '#FFFFFF' && { color: '#FFFFFF' },
                ]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.underlineContainer}>
          <Animated.View
            style={[
              styles.segmentUnderline,
              {
                width: underlineWidth,
                transform: [{ translateX: underlineTranslateX }],
              },
            ]}
          />
        </View>
        <View style={styles.segmentDivider} />
      </SafeAreaView>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  glassBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  segmentBtn: {
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  segmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  underlineContainer: {
    paddingHorizontal: 0,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
