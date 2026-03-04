import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Trophy, Share2, Tv } from 'lucide-react-native';
import { useAppNavigation } from '@/contexts/AppNavigationContext';

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

function TourContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <Trophy size={32} color="#FFB74D" />
        <Text style={styles.placeholderTitle}>Tour</Text>
        <Text style={styles.placeholderSub}>Tournaments, leaderboards and competitive events</Text>
      </View>
      {['Upcoming Tournaments', 'Leaderboard', 'My Results'].map((label, i) => (
        <View key={i} style={styles.listItem}>
          <View style={styles.listDot} />
          <Text style={styles.listLabel}>{label}</Text>
          <Text style={styles.listArrow}>›</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function AffiliateContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <Share2 size={32} color="#00E676" />
        <Text style={styles.placeholderTitle}>Affiliate</Text>
        <Text style={styles.placeholderSub}>Partner deals, referrals and affiliate programs</Text>
      </View>
      {['My Referrals', 'Partner Brands', 'Earnings'].map((label, i) => (
        <View key={i} style={styles.listItem}>
          <View style={[styles.listDot, { backgroundColor: '#00E676' }]} />
          <Text style={styles.listLabel}>{label}</Text>
          <Text style={styles.listArrow}>›</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EntertainmentContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <Tv size={32} color="#E040FB" />
        <Text style={styles.placeholderTitle}>Entertainment</Text>
        <Text style={styles.placeholderSub}>Golf content, challenges and social features</Text>
      </View>
      {['Challenges', 'Golf Feed', 'Mini Games'].map((label, i) => (
        <View key={i} style={styles.listItem}>
          <View style={[styles.listDot, { backgroundColor: '#E040FB' }]} />
          <Text style={styles.listLabel}>{label}</Text>
          <Text style={styles.listArrow}>›</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('tour');
  const { openSidebar, navigateTo } = useAppNavigation();

  const renderContent = () => {
    switch (activeTab) {
      case 'tour': return <TourContent />;
      case 'affiliate': return <AffiliateContent />;
      case 'entertainment': return <EntertainmentContent />;
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
    backgroundColor: '#0D1410',
    borderTopWidth: 1,
    borderTopColor: '#1C2922',
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 6,
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
