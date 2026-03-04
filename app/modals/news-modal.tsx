import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Image } from 'react-native';
import { ChevronLeft, Newspaper, BookOpen, Play } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SEGMENTS = ['News', 'Onboarding', 'Tutorials'] as const;
type Segment = typeof SEGMENTS[number];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function NewsContent() {
  return (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
      <View style={styles.emptyState}>
        <Newspaper size={48} color="#333" />
        <Text style={styles.emptyTitle}>News</Text>
        <Text style={styles.emptySubtitle}>Latest updates and announcements will appear here</Text>
      </View>
    </ScrollView>
  );
}

const ONBOARDING_CARDS = [
  { header: 'Profile', number: 1, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/btkoot8ufsc99ndex0kdw' },
  { header: 'Start Round', number: 2, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xoqkqtvi1ncpx3aaftb0c' },
  { header: 'Start Practice', number: 3, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8e36cs2dl821sjnm6tscu' },
  { header: 'Drill Yourself', number: 4, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/13xpd0v8icbcvby3o6e55' },
  { header: 'See results', number: 5, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/23331tcxrx7fmhsouy8yu' },
  { header: 'Wind data', number: 6, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/trh9wg0765xkpj238r4wg' },
  { header: 'GPS Analysis', number: 7, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/tv25zeknpu4m9bo6i7o9n' },
  { header: 'Advanced Data', number: 8, image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/9w1isv9nxldjv978ip23x' },
];

function FlippableCard({ card }: { card: typeof ONBOARDING_CARDS[number] }) {
  const [flipped, setFlipped] = useState<boolean>(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = useCallback(() => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      tension: 400,
      friction: 30,
    }).start();
    setFlipped(!flipped);
  }, [flipped, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '270deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.cardWrapper}>
      <Text style={styles.cardHeader}>{card.header}</Text>
      <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.cardTouchable}>
        <Animated.View
          style={[
            styles.cardFace,
            { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
          ]}
        >
          <Image source={{ uri: card.image }} style={styles.cardImage} resizeMode="cover" />
        </Animated.View>
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
          ]}
        >
          <Text style={styles.cardNumber}>{card.number}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function OnboardingContent() {
  return (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.onboardingContainer}>
      {ONBOARDING_CARDS.map((card) => (
        <FlippableCard key={card.number} card={card} />
      ))}
    </ScrollView>
  );
}

function TutorialsContent() {
  return (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
      <View style={styles.emptyState}>
        <Play size={48} color="#333" />
        <Text style={styles.emptyTitle}>Tutorials</Text>
        <Text style={styles.emptySubtitle}>Step-by-step tutorials to improve your game</Text>
      </View>
    </ScrollView>
  );
}

export default function NewsModal() {
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleSegmentPress = useCallback((index: number) => {
    setActiveSegment(index);
    Animated.spring(slideAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [slideAnim]);

  const segmentWidth = (SCREEN_WIDTH - 48) / SEGMENTS.length;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, segmentWidth, segmentWidth * 2],
  });

  const renderContent = () => {
    switch (activeSegment) {
      case 0:
        return <NewsContent />;
      case 1:
        return <OnboardingContent />;
      case 2:
        return <TutorialsContent />;
      default:
        return <NewsContent />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>News & Announcements</Text>
      </View>

      <View style={styles.segmentContainer}>
        <View style={styles.segmentTrack}>
          <Animated.View
            style={[
              styles.segmentIndicator,
              {
                width: segmentWidth,
                transform: [{ translateX }],
              },
            ]}
          />
          {SEGMENTS.map((segment, index) => (
            <TouchableOpacity
              key={segment}
              style={[styles.segmentButton, { width: segmentWidth }]}
              onPress={() => handleSegmentPress(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeSegment === index && styles.segmentTextActive,
                ]}
              >
                {segment}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  segmentContainer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
  },
  segmentTrack: {
    flexDirection: 'row' as const,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 3,
    position: 'relative' as const,
  },
  segmentIndicator: {
    position: 'absolute' as const,
    top: 3,
    left: 3,
    bottom: 3,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  segmentButton: {
    paddingVertical: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center' as const,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  onboardingContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },
  cardWrapper: {
    marginBottom: 24,
    alignItems: 'center' as const,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  cardTouchable: {
    width: '80%' as const,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'visible' as const,
  },
  cardFace: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backfaceVisibility: 'hidden' as const,
    overflow: 'hidden' as const,
  },
  cardBack: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#2D5A27',
  },
  cardImage: {
    width: '100%' as const,
    height: '100%' as const,
    borderRadius: 16,
  },
  cardNumber: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: '#2D5A27',
  },
});
