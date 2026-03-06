import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  Trophy,
  Share2,
  Tv,
  User,
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  Crosshair,
  Info,
  Award,
  Gift,
  ChevronRight,
  Copy,
  Target,
  ImageIcon,
  Tag,
  Handshake,
  X,
  Mic,
  MessageSquare,
  FileText,
  Film,
  ExternalLink,
} from 'lucide-react-native';
import { Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useProfile } from '@/contexts/ProfileContext';

type CommunityTab = 'tour' | 'affiliate' | 'entertainment';

interface TabConfig {
  key: CommunityTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { key: 'tour', label: 'Tour', icon: <Trophy size={18} /> },
  { key: 'affiliate', label: 'Affiliate', icon: <Share2 size={18} /> },
  { key: 'entertainment', label: 'Entertainment', icon: <Tv size={18} /> },
];

interface TourEvent {
  id: string;
  eventName: string;
  courseName: string;
  date: string;
  type: 'upcoming' | 'past';
}

const UPCOMING_EVENTS: TourEvent[] = [
  {
    id: 'ue1',
    eventName: 'Spring Championship',
    courseName: 'Bro Hof Slott GC',
    date: 'Apr 12, 2026',
    type: 'upcoming',
  },
  {
    id: 'ue2',
    eventName: 'Midsummer Classic',
    courseName: 'Halmstad GK',
    date: 'Jun 21, 2026',
    type: 'upcoming',
  },
];

const PAST_EVENTS: TourEvent[] = [
  {
    id: 'pe1',
    eventName: 'Winter Invitational',
    courseName: 'Österåker GK',
    date: 'Jan 18, 2026',
    type: 'past',
  },
  {
    id: 'pe2',
    eventName: 'Autumn Open',
    courseName: 'Ullna GK',
    date: 'Oct 5, 2025',
    type: 'past',
  },
];

type EventDetailTab = 'players' | 'impact' | 'info';

function EventDetailScreen({
  event,
  onClose,
}: {
  event: TourEvent;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<EventDetailTab>('players');

  const statusLabel = event.type === 'upcoming' ? 'Upcoming' : 'Past';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'players':
        return (
          <ScrollView style={edStyles.tabScroll} showsVerticalScrollIndicator={false}>
            <Text style={edStyles.sectionHeader}>Registered Players</Text>
            {['Erik Svensson', 'Anna Lindberg', 'Oscar Nilsson', 'Maja Johansson', 'Karl Eriksson'].map(
              (name, i) => (
                <View key={i} style={edStyles.playerRow}>
                  <View style={edStyles.playerAvatar}>
                    <User size={16} color="#5A6B60" />
                  </View>
                  <View style={edStyles.playerInfo}>
                    <Text style={edStyles.playerName}>{name}</Text>
                    <Text style={edStyles.playerHcp}>HCP {(Math.random() * 20 + 2).toFixed(1)}</Text>
                  </View>
                  <Text style={edStyles.playerRank}>#{i + 1}</Text>
                </View>
              )
            )}
          </ScrollView>
        );
      case 'impact':
        return (
          <ScrollView style={edStyles.tabScroll} showsVerticalScrollIndicator={false}>
            <Text style={edStyles.sectionHeader}>Impact Tracer</Text>
            <View style={edStyles.impactPlaceholder}>
              <Crosshair size={40} color="#243028" />
              <Text style={edStyles.impactText}>
                Impact data will be available {event.type === 'upcoming' ? 'during' : 'from'} the event
              </Text>
            </View>
          </ScrollView>
        );
      case 'info':
        return (
          <ScrollView style={edStyles.tabScroll} showsVerticalScrollIndicator={false}>
            <Text style={edStyles.sectionHeader}>Event Information</Text>
            <View style={edStyles.infoCard}>
              <View style={edStyles.infoRow}>
                <Calendar size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Date</Text>
                <Text style={edStyles.infoValue}>{event.date}</Text>
              </View>
              <View style={edStyles.infoRow}>
                <MapPin size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Course</Text>
                <Text style={edStyles.infoValue}>{event.courseName}</Text>
              </View>
              <View style={edStyles.infoRow}>
                <Users size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Format</Text>
                <Text style={edStyles.infoValue}>Strokeplay, 18 holes</Text>
              </View>
              <View style={edStyles.infoRow}>
                <Trophy size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Prize Pool</Text>
                <Text style={edStyles.infoValue}>5,000 SEK</Text>
              </View>
            </View>
            <Text style={[edStyles.sectionHeader, { marginTop: 20 }]}>Rules</Text>
            <View style={edStyles.infoCard}>
              <Text style={edStyles.rulesText}>
                Standard R&A rules apply. Local rules will be posted at registration. Pace of play: max 4h15m for 18 holes.
              </Text>
            </View>
          </ScrollView>
        );
    }
  };

  const eventTabs: { key: EventDetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'players', label: 'Players', icon: <Users size={18} /> },
    { key: 'impact', label: 'Impact Tracer', icon: <Crosshair size={18} /> },
    { key: 'info', label: 'Info', icon: <Info size={18} /> },
  ];

  return (
    <View style={edStyles.container}>
      <SafeAreaView edges={['top']} style={edStyles.safeTop}>
        <View style={edStyles.header}>
          <TouchableOpacity onPress={onClose} style={edStyles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#F5F7F6" />
          </TouchableOpacity>
          <View style={edStyles.headerCenter}>
            <Text style={edStyles.headerTitle} numberOfLines={1}>{event.eventName}</Text>
            <Text style={edStyles.headerSub} numberOfLines={1}>{event.courseName} · {event.date}</Text>
          </View>
          <Text style={edStyles.statusBadge}>{statusLabel}</Text>
        </View>
      </SafeAreaView>

      <View style={edStyles.body}>{renderTabContent()}</View>

      <SafeAreaView edges={['bottom']} style={edStyles.tabBarSafe}>
        <View style={edStyles.tabBar}>
          {eventTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={edStyles.tab}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.7}
              >
                <View style={isActive ? edStyles.iconActive : edStyles.iconInactive}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? '#FFB74D' : '#5A6B60',
                  })}
                </View>
                <Text style={[edStyles.tabLabel, isActive && edStyles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const edStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  safeTop: {
    backgroundColor: '#0D1410',
    borderBottomWidth: 1,
    borderBottomColor: '#1C2922',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  headerSub: {
    fontSize: 12,
    color: '#5A6B60',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#5A6B60',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  body: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    marginBottom: 14,
  },
  playerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 12,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C2922',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  playerHcp: {
    fontSize: 11,
    color: '#5A6B60',
    marginTop: 2,
  },
  playerRank: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFB74D',
  },
  impactPlaceholder: {
    backgroundColor: '#141C18',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 12,
  },
  impactText: {
    fontSize: 13,
    color: '#5A6B60',
    textAlign: 'center' as const,
  },
  infoCard: {
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#5A6B60',
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    flex: 1,
  },
  rulesText: {
    fontSize: 13,
    color: '#8A9B90',
    lineHeight: 20,
  },
  tabBarSafe: {
    backgroundColor: '#000000',
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 4,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#5A6B60',
    fontWeight: '600' as const,
  },
  tabLabelActive: {
    color: '#FFB74D',
  },
});

function EventCard({
  event,
  onPress,
}: {
  event: TourEvent;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={tourStyles.eventCard} onPress={onPress} activeOpacity={0.7}>
      <View style={tourStyles.eventCardLeft}>
        <Text style={tourStyles.eventName}>{event.eventName}</Text>
        <View style={tourStyles.eventMeta}>
          <MapPin size={12} color="#5A6B60" />
          <Text style={tourStyles.eventCourse}>{event.courseName}</Text>
        </View>
        <View style={tourStyles.eventMeta}>
          <Calendar size={12} color="#5A6B60" />
          <Text style={tourStyles.eventDate}>{event.date}</Text>
        </View>
      </View>
      <ChevronRight size={18} color="#5A6B60" />
    </TouchableOpacity>
  );
}

function TourContent({ onOpenEvent }: { onOpenEvent: (event: TourEvent) => void }) {
  const { profile } = useProfile();

  const handleEventPress = useCallback((event: TourEvent) => {
    console.log('[Tour] Opening event:', event.eventName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenEvent(event);
  }, [onOpenEvent]);

  const initials = (profile?.display_name || profile?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={tourStyles.pageTitle}>Tour</Text>

      <View style={tourStyles.profileSection}>
        <View style={tourStyles.profileLeft}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={tourStyles.profileAvatar} />
          ) : (
            <View style={tourStyles.profileAvatarPlaceholder}>
              <Text style={tourStyles.profileInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={tourStyles.profileRight}>
          <View style={tourStyles.profileDataRow}>
            <View style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>3</Text>
              <Text style={tourStyles.profileDataLabel}>Events Played</Text>
            </View>
            <View style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>T5</Text>
              <Text style={tourStyles.profileDataLabel}>Placements</Text>
            </View>
            <View style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>1.2k</Text>
              <Text style={tourStyles.profileDataLabel}>Earnings</Text>
            </View>
          </View>
          <View style={tourStyles.profileDataRow}>
            <View style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>#42</Text>
              <Text style={tourStyles.profileDataLabel}>Rank</Text>
            </View>
            <View style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue} numberOfLines={1}>Bro Hof</Text>
              <Text style={tourStyles.profileDataLabel}>Home Course</Text>
            </View>
            <View style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>27</Text>
              <Text style={tourStyles.profileDataLabel}>Age</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={tourStyles.joinButton}
        activeOpacity={0.8}
        onPress={() => {
          console.log('[Tour] JOIN Tour pressed');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <Text style={tourStyles.joinButtonText}>JOIN Tour</Text>
      </TouchableOpacity>

      <View style={tourStyles.divider} />

      <Text style={tourStyles.sectionTitle}>Tour Stats</Text>
      <View style={tourStyles.statsBoxRow}>
        <TouchableOpacity style={tourStyles.statsBox} activeOpacity={0.7}>
          <Award size={24} color="#FFB74D" />
          <Text style={tourStyles.statsBoxTitle}>Leaderboard</Text>
          <Text style={tourStyles.statsBoxSub}>Rankings & standings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tourStyles.statsBox} activeOpacity={0.7}>
          <Gift size={24} color="#00E676" />
          <Text style={tourStyles.statsBoxTitle}>Prizes & Benefits</Text>
          <Text style={tourStyles.statsBoxSub}>Rewards & perks</Text>
        </TouchableOpacity>
      </View>

      <Text style={[tourStyles.sectionTitle, { marginTop: 24 }]}>Upcoming Events</Text>
      {UPCOMING_EVENTS.map((event) => (
        <EventCard key={event.id} event={event} onPress={() => handleEventPress(event)} />
      ))}

      <Text style={[tourStyles.sectionTitle, { marginTop: 24 }]}>Past Events</Text>
      {PAST_EVENTS.map((event) => (
        <EventCard key={event.id} event={event} onPress={() => handleEventPress(event)} />
      ))}
    </ScrollView>
  );
}

const tourStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row' as const,
    gap: 14,
    marginBottom: 16,
  },
  profileLeft: {
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#243028',
  },
  profileAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C2922',
    borderWidth: 2,
    borderColor: '#243028',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  profileInitials: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#00E676',
  },
  profileRight: {
    flex: 1,
    gap: 8,
  },
  profileDataRow: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  profileDataItem: {
    flex: 1,
    backgroundColor: '#141C18',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
  },
  profileDataValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  profileDataLabel: {
    fontSize: 9,
    color: '#5A6B60',
    marginTop: 2,
    textAlign: 'center' as const,
  },
  joinButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#243028',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    marginBottom: 12,
  },
  statsBoxRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 8,
  },
  statsBoxTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    textAlign: 'center' as const,
  },
  statsBoxSub: {
    fontSize: 10,
    color: '#5A6B60',
    textAlign: 'center' as const,
  },
  eventCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243028',
  },
  eventCardLeft: {
    flex: 1,
    gap: 4,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  eventMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  eventCourse: {
    fontSize: 12,
    color: '#8A9B90',
  },
  eventDate: {
    fontSize: 12,
    color: '#5A6B60',
  },
});

type GoalOption = 25 | 50 | 75 | 100;

const PERKS_MAP: Record<GoalOption, string> = {
  25: '3 Free Sensors',
  50: 'Titleist Bag',
  75: 'Free Set of Clubs',
  100: '5 Rounds at Bro Hof',
};

interface AffiliateCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: { id: string; title: string }[];
}

const AFFILIATE_CATEGORIES: AffiliateCategory[] = [
  {
    key: 'giveaways',
    label: 'Giveaways',
    icon: <Gift size={18} color="#FFB74D" />,
    items: [{ id: 'g1', title: 'Monthly Giveaway Draw' }],
  },
  {
    key: 'brand_image',
    label: 'Brand Image',
    icon: <ImageIcon size={18} color="#64B5F6" />,
    items: [{ id: 'bi1', title: 'Ambassador Kit' }],
  },
  {
    key: 'challenges',
    label: 'Challenges',
    icon: <Target size={18} color="#EF5350" />,
    items: [{ id: 'c1', title: 'Referral Sprint' }],
  },
  {
    key: 'special_offers',
    label: 'Special Offers',
    icon: <Tag size={18} color="#AB47BC" />,
    items: [{ id: 'so1', title: 'Pro Membership Deal' }],
  },
  {
    key: 'partnership_deals',
    label: 'Partnership Deals',
    icon: <Handshake size={18} color="#26A69A" />,
    items: [{ id: 'pd1', title: 'TrackMan Collab' }],
  },
];

interface AffiliateItemDetail {
  itemTitle: string;
  categoryLabel: string;
}

function AffiliateItemScreen({ item, onClose }: { item: AffiliateItemDetail; onClose: () => void }) {
  return (
    <View style={affStyles.detailContainer}>
      <SafeAreaView edges={['top']} style={affStyles.detailSafeTop}>
        <View style={affStyles.detailHeader}>
          <TouchableOpacity onPress={onClose} style={affStyles.detailBack} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#F5F7F6" />
          </TouchableOpacity>
          <View style={affStyles.detailHeaderCenter}>
            <Text style={affStyles.detailHeaderTitle} numberOfLines={1}>{item.itemTitle}</Text>
            <Text style={affStyles.detailHeaderSub}>{item.categoryLabel}</Text>
          </View>
        </View>
      </SafeAreaView>
      <View style={affStyles.detailBody} />
    </View>
  );
}

function GoalPickerModal({
  visible,
  onClose,
  onSelect,
  current,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (v: GoalOption) => void;
  current: GoalOption;
}) {
  const options: GoalOption[] = [25, 50, 75, 100];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={affStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={affStyles.modalCard}>
          <View style={affStyles.modalHeader}>
            <Text style={affStyles.modalTitle}>Choose Goal</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#8A9B90" />
            </TouchableOpacity>
          </View>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                affStyles.modalOption,
                current === opt && affStyles.modalOptionActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                affStyles.modalOptionNum,
                current === opt && affStyles.modalOptionNumActive,
              ]}>{opt}</Text>
              <Text style={affStyles.modalOptionPerk}>{PERKS_MAP[opt]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function AffiliateContent() {
  const [goal, setGoal] = useState<GoalOption>(100);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<AffiliateItemDetail | null>(null);
  const currentCount = 19;
  const discountCode = 'GOLF2026PRO';

  const handleOpenPicker = useCallback((source: 'count' | 'perks') => {
    console.log('[Affiliate] Opening picker from:', source);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPickerVisible(true);
  }, []);

  const handleShare = useCallback(async () => {
    console.log('[Affiliate] Sharing discount code:', discountCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: `Use my discount code: ${discountCode}` });
    } catch (e) {
      console.log('[Affiliate] Share error:', e);
    }
  }, [discountCode]);

  const handleItemPress = useCallback((itemTitle: string, categoryLabel: string) => {
    console.log('[Affiliate] Item pressed:', itemTitle, 'category:', categoryLabel);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem({ itemTitle, categoryLabel });
  }, []);

  if (selectedItem) {
    return (
      <AffiliateItemScreen
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    );
  }

  return (
    <>
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Text style={affStyles.pageTitle}>Affiliate</Text>

        <View style={affStyles.topBoxRow}>
          <TouchableOpacity
            style={affStyles.countBox}
            activeOpacity={0.7}
            onPress={() => handleOpenPicker('count')}
          >
            <Text style={affStyles.goalLabel}>{goal}</Text>
            <View style={affStyles.countCenter}>
              <Text style={affStyles.countBig}>{currentCount}</Text>
              <Text style={affStyles.countOf}>out of {goal}</Text>
            </View>
            <View style={affStyles.progressBarBg}>
              <View
                style={[
                  affStyles.progressBarFill,
                  { width: `${Math.min((currentCount / goal) * 100, 100)}%` },
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={affStyles.perksBox}
            activeOpacity={0.7}
            onPress={() => handleOpenPicker('perks')}
          >
            <Text style={affStyles.goalLabel}>{goal}</Text>
            <Award size={28} color="#FFB74D" />
            <Text style={affStyles.perksHeader}>Perks and Prizes</Text>
            <Text style={affStyles.perksValue}>{PERKS_MAP[goal]}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={affStyles.discountButton}
          activeOpacity={0.7}
          onPress={handleShare}
        >
          <Copy size={14} color="#FFFFFF" />
          <View>
            <Text style={affStyles.discountLabel}>Discount Code</Text>
            <Text style={affStyles.discountCode}>{discountCode}</Text>
          </View>
        </TouchableOpacity>

        {AFFILIATE_CATEGORIES.map((cat) => (
          <View key={cat.key} style={affStyles.categorySection}>
            <View style={affStyles.categoryHeaderRow}>
              {cat.icon}
              <Text style={affStyles.categoryTitle}>{cat.label}</Text>
            </View>
            {cat.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={affStyles.categoryCard}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item.title, cat.label)}
              >
                <Text style={affStyles.categoryCardTitle}>{item.title}</Text>
                <ChevronRight size={16} color="#5A6B60" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <GoalPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setGoal}
        current={goal}
      />
    </>
  );
}

const affStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 16,
  },
  topBoxRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  countBox: {
    flex: 1,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243028',
    alignItems: 'center' as const,
    gap: 6,
  },
  countCenter: {
    alignItems: 'center' as const,
  },
  countBig: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#00E676',
  },
  countOf: {
    fontSize: 12,
    color: '#5A6B60',
    fontWeight: '600' as const,
  },
  progressBarBg: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1C2922',
    marginTop: 4,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  perksBox: {
    flex: 1,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243028',
    alignItems: 'center' as const,
    gap: 6,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFB74D',
    alignSelf: 'flex-end' as const,
    backgroundColor: '#1C2922',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  perksHeader: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    textAlign: 'center' as const,
  },
  perksValue: {
    fontSize: 11,
    color: '#8A9B90',
    textAlign: 'center' as const,
  },
  discountButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  discountLabel: {
    fontSize: 10,
    color: '#A5D6A7',
    fontWeight: '600' as const,
  },
  discountCode: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  categoryCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243028',
  },
  categoryCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 30,
  },
  modalCard: {
    backgroundColor: '#141C18',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#243028',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  modalOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#0D1410',
    borderWidth: 1,
    borderColor: '#1C2922',
    gap: 14,
  },
  modalOptionActive: {
    borderColor: '#00E676',
    backgroundColor: '#0F1D14',
  },
  modalOptionNum: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#5A6B60',
    width: 40,
    textAlign: 'center' as const,
  },
  modalOptionNumActive: {
    color: '#00E676',
  },
  modalOptionPerk: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    flex: 1,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  detailSafeTop: {
    backgroundColor: '#0D1410',
    borderBottomWidth: 1,
    borderBottomColor: '#1C2922',
  },
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailBack: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailHeaderCenter: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  detailHeaderSub: {
    fontSize: 11,
    color: '#5A6B60',
    marginTop: 2,
  },
  detailBody: {
    flex: 1,
  },
});

type EntertainmentSection = 'Podcasts' | 'Interviews' | 'Articles' | 'Series';

const ENTERTAINMENT_SECTIONS: { key: EntertainmentSection; icon: React.ReactNode }[] = [
  { key: 'Podcasts', icon: <Mic size={20} color="#FFB74D" /> },
  { key: 'Interviews', icon: <MessageSquare size={20} color="#64B5F6" /> },
  { key: 'Articles', icon: <FileText size={20} color="#81C784" /> },
  { key: 'Series', icon: <Film size={20} color="#E040FB" /> },
];

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    label: 'Instagram',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png',
    url: 'https://instagram.com',
    nativeUrl: 'instagram://',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/800px-TikTok_logo.svg.png',
    url: 'https://tiktok.com',
    nativeUrl: 'snssdk1233://',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    url: 'https://youtube.com',
    nativeUrl: 'youtube://',
  },
];

function EntertainmentDetailScreen({ section, onClose }: { section: EntertainmentSection; onClose: () => void }) {
  return (
    <View style={entStyles.detailContainer}>
      <SafeAreaView edges={['top']} style={entStyles.detailSafeTop}>
        <View style={entStyles.detailHeader}>
          <TouchableOpacity onPress={onClose} style={entStyles.detailBack} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#F5F7F6" />
          </TouchableOpacity>
          <Text style={entStyles.detailHeaderTitle}>{section}</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>
      <View style={entStyles.detailBody} />
    </View>
  );
}

function EntertainmentContent() {
  const [openSection, setOpenSection] = useState<EntertainmentSection | null>(null);

  const handleSocialPress = useCallback(async (nativeUrl: string, webUrl: string) => {
    console.log('[Entertainment] Opening social:', webUrl);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS !== 'web') {
        const supported = await Linking.canOpenURL(nativeUrl);
        if (supported) {
          await Linking.openURL(nativeUrl);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (e) {
      console.log('[Entertainment] Failed to open link:', e);
      await Linking.openURL(webUrl);
    }
  }, []);

  const handleSectionPress = useCallback((section: EntertainmentSection) => {
    console.log('[Entertainment] Opening section:', section);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenSection(section);
  }, []);

  if (openSection) {
    return <EntertainmentDetailScreen section={openSection} onClose={() => setOpenSection(null)} />;
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={entStyles.pageTitle}>Entertainment</Text>

      <Text style={entStyles.sectionLabel}>Social Media</Text>
      <View style={entStyles.socialRow}>
        {SOCIAL_LINKS.map((social) => (
          <TouchableOpacity
            key={social.key}
            style={entStyles.socialBox}
            activeOpacity={0.7}
            onPress={() => handleSocialPress(social.nativeUrl, social.url)}
          >
            <Image source={{ uri: social.logo }} style={entStyles.socialLogo} resizeMode="contain" />
            <Text style={entStyles.socialLabel}>{social.label}</Text>
            <ExternalLink size={12} color="#5A6B60" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={entStyles.divider} />

      <Text style={entStyles.sectionLabel}>Latest</Text>
      <View style={entStyles.latestPlaceholder}>
        <Text style={entStyles.latestPlaceholderText}>Content coming soon</Text>
      </View>

      <View style={entStyles.divider} />

      {ENTERTAINMENT_SECTIONS.map((section) => (
        <TouchableOpacity
          key={section.key}
          style={entStyles.sectionCard}
          activeOpacity={0.7}
          onPress={() => handleSectionPress(section.key)}
        >
          <View style={entStyles.sectionCardLeft}>
            {section.icon}
            <Text style={entStyles.sectionCardTitle}>{section.key}</Text>
          </View>
          <ChevronRight size={18} color="#5A6B60" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const entStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 4,
  },
  socialBox: {
    flex: 1,
    backgroundColor: '#141C18',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 8,
  },
  socialLogo: {
    width: 36,
    height: 36,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  divider: {
    height: 1,
    backgroundColor: '#243028',
    marginVertical: 20,
  },
  latestPlaceholder: {
    minHeight: 80,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  latestPlaceholderText: {
    fontSize: 13,
    color: '#3A4B40',
    fontStyle: 'italic' as const,
  },
  sectionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#243028',
  },
  sectionCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  detailSafeTop: {
    backgroundColor: '#0D1410',
    borderBottomWidth: 1,
    borderBottomColor: '#1C2922',
  },
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailBack: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    textAlign: 'center' as const,
  },
  detailBody: {
    flex: 1,
  },
});

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('tour');
  const [selectedEvent, setSelectedEvent] = useState<TourEvent | null>(null);
  const { openSidebar, navigateTo } = useAppNavigation();

  if (selectedEvent) {
    return (
      <EventDetailScreen
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'tour':
        return <TourContent onOpenEvent={setSelectedEvent} />;
      case 'affiliate':
        return <AffiliateContent />;
      case 'entertainment':
        return <EntertainmentContent />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} activeOpacity={0.7}>
            <Menu size={24} color="#F5F7F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity onPress={() => navigateTo('mygame')} style={styles.menuBtn} activeOpacity={0.7}>
            <Image source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/d92ywde7ucn1q2si6dbb7' }} style={styles.golferIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        {renderContent()}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={isActive ? styles.iconActive : styles.iconInactive}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? '#FFB74D' : '#5A6B60',
                  })}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  safeTop: {
    backgroundColor: '#0D1410',
    borderBottomWidth: 1,
    borderBottomColor: '#1C2922',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  golferIcon: {
    width: 28,
    height: 28,
    tintColor: '#F5F7F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  placeholderCard: {
    backgroundColor: '#141C18',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    marginBottom: 20,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  placeholderSub: {
    fontSize: 14,
    color: '#5A6B60',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 12,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB74D',
  },
  listLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    flex: 1,
  },
  listArrow: {
    fontSize: 20,
    color: '#5A6B60',
    fontWeight: '600' as const,
  },
  tabBarSafe: {
    backgroundColor: '#000000',
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 4,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#5A6B60',
    fontWeight: '600' as const,
  },
  tabLabelActive: {
    color: '#FFB74D',
  },
});
