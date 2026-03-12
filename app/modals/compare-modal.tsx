import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Search } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '@/contexts/ProfileContext';
import { useScrollHeader } from '@/hooks/useScrollHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = ['Stats', 'Strokes Gained', 'Distance'] as const;
const FLOATING_HEADER_HEIGHT = 90;

export default function CompareModal() {
  const router = useRouter();
  const { profile, following } = useProfile();
  const insets = useSafeAreaInsets();
  const username = profile?.display_name || profile?.username || 'User';

  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const { headerTranslateY, onScroll: onVerticalScroll } = useScrollHeader(FLOATING_HEADER_HEIGHT + insets.top);

  const handleHorizontalScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      if (index >= 0 && index < TABS.length && index !== activeTab) {
        setActiveTab(index);
      }
      const progress = offsetX / SCREEN_WIDTH;
      indicatorAnim.setValue(progress);
    },
    [activeTab, indicatorAnim]
  );

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  }, []);

  const tabWidth = (SCREEN_WIDTH - 40) / TABS.length;
  const underlineWidth = 40;

  const translateX = indicatorAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth + (tabWidth - underlineWidth) / 2),
    extrapolate: 'clamp',
  });

  const renderVSCard = () => (
    <View style={styles.vsSection}>
      <View style={styles.vsCard}>
        <View style={styles.vsPlayer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.vsAvatar} />
          ) : (
            <View style={styles.vsAvatarPlaceholder}>
              <User size={28} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.vsName}>{username}</Text>
          <Text style={styles.vsHcp}>HCP 14.2</Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.vsPlayer}>
          <View style={styles.vsAvatarEmpty}>
            <Search size={24} color="rgba(255,255,255,0.5)" />
          </View>
          <Text style={styles.vsNameEmpty}>Select Player</Text>
          <Text style={styles.vsHcpEmpty}>—</Text>
        </View>
      </View>
    </View>
  );

  const renderFriendsList = () => (
    <View style={styles.selectSection}>
      <Text style={styles.selectTitle}>Choose opponent</Text>
      <Text style={styles.selectSubtitle}>Select a friend to compare stats</Text>

      {following.length > 0 ? (
        following.map((user) => (
          <TouchableOpacity key={user.id} style={styles.friendRow} activeOpacity={0.7}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.friendAvatar} />
            ) : (
              <View style={styles.friendAvatarPlaceholder}>
                <User size={18} color="rgba(255,255,255,0.6)" />
              </View>
            )}
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{user.display_name || user.username}</Text>
              <Text style={styles.friendUsername}>@{user.username}</Text>
            </View>
            <View style={styles.selectBtn}>
              <Text style={styles.selectBtnText}>Compare</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Follow other players to compare stats</Text>
        </View>
      )}
    </View>
  );

  const statsCategories = [
    'Avg Score',
    'Best Round',
    'Fairways Hit %',
    'GIR %',
    'Putts per Round',
    'Longest Drive',
    'Up & Downs',
    'Sand Saves',
    'Penalty Shots',
    'Handicap Trend',
  ];

  const contentPaddingTop = FLOATING_HEADER_HEIGHT + insets.top + 8;

  const renderStatsTab = () => (
    <ScrollView
      style={styles.tabPage}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tabPageContent, { paddingTop: contentPaddingTop }]}
      onScroll={onVerticalScroll}
      scrollEventThrottle={16}
    >
      {renderVSCard()}
      {renderFriendsList()}

      <View style={styles.statsPreview}>
        <Text style={styles.statsPreviewTitle}>Stats Categories</Text>
        {statsCategories.map((stat, i) => (
          <View key={i} style={styles.statRow}>
            <Text style={styles.statName}>{stat}</Text>
            <View style={styles.statBar}>
              <View style={[styles.statBarFill, { width: '50%' }]} />
            </View>
            <Text style={styles.statDash}>—</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderStrokesGainedTab = () => (
    <ScrollView
      style={styles.tabPage}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tabPageContent, { paddingTop: contentPaddingTop }]}
      onScroll={onVerticalScroll}
      scrollEventThrottle={16}
    >
      {renderVSCard()}

      <View style={styles.emptyTabSection}>
        <View style={styles.emptyTabCard}>
          <Text style={styles.emptyTabTitle}>Strokes Gained</Text>
          <Text style={styles.emptyTabSubtitle}>Coming soon — compare strokes gained metrics</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderDistanceTab = () => (
    <ScrollView
      style={styles.tabPage}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tabPageContent, { paddingTop: contentPaddingTop }]}
      onScroll={onVerticalScroll}
      scrollEventThrottle={16}
    >
      {renderVSCard()}

      <View style={styles.emptyTabSection}>
        <View style={styles.emptyTabCard}>
          <Text style={styles.emptyTabTitle}>Distance</Text>
          <Text style={styles.emptyTabSubtitle}>Coming soon — compare distance metrics</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleHorizontalScroll}
        scrollEventThrottle={16}
        style={styles.pagerScroll}
      >
        <View style={{ width: SCREEN_WIDTH }}>{renderStatsTab()}</View>
        <View style={{ width: SCREEN_WIDTH }}>{renderStrokesGainedTab()}</View>
        <View style={{ width: SCREEN_WIDTH }}>{renderDistanceTab()}</View>
      </ScrollView>

      <Animated.View
        style={[
          styles.floatingHeader,
          {
            paddingTop: insets.top,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.headerRow} pointerEvents="box-none">
          <GlassBackButton onPress={() => router.back()} />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.segmentContainer} pointerEvents="box-none">
          <View style={styles.segmentRow}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                style={styles.segmentTab}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    activeTab === index && styles.segmentLabelActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View
            style={[
              styles.segmentUnderline,
              {
                width: underlineWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSpacer: {
    flex: 1,
  },
  segmentContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  segmentRow: {
    flexDirection: 'row' as const,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.45)',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  pagerScroll: {
    flex: 1,
  },
  tabPage: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabPageContent: {
    paddingBottom: 40,
  },
  vsSection: {
    marginTop: 8,
  },
  vsCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  vsPlayer: {
    flex: 1,
    alignItems: 'center' as const,
  },
  vsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  vsAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  vsAvatarEmpty: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed' as const,
    marginBottom: 8,
  },
  vsName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  vsNameEmpty: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  vsHcp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  vsHcpEmpty: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  vsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  selectSection: {
    marginTop: 28,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  friendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  friendUsername: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  selectBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  statsPreview: {
    marginTop: 28,
  },
  statsPreviewTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  statName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    width: 110,
  },
  statBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden' as const,
  },
  statBarFill: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  statDash: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    width: 30,
    textAlign: 'right' as const,
  },
  emptyTabSection: {
    marginTop: 28,
    flex: 1,
  },
  emptyTabCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyTabSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
});
