import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, BarChart2, TrendingUp, Crosshair, List, Video } from 'lucide-react-native';
import { useAppNavigation } from '@/contexts/AppNavigationContext';

type DataTab = 'stats' | 'sg' | 'shots' | 'details' | 'video';

interface TabConfig {
  key: DataTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { key: 'stats', label: 'Stats', icon: <BarChart2 size={18} /> },
  { key: 'sg', label: 'SG', icon: <TrendingUp size={18} /> },
  { key: 'shots', label: 'Shots', icon: <Crosshair size={18} /> },
  { key: 'details', label: 'Details', icon: <List size={18} /> },
  { key: 'video', label: 'Video', icon: <Video size={18} /> },
];

function StatsContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <BarChart2 size={32} color="#4FC3F7" />
        <Text style={styles.placeholderTitle}>Statistics Overview</Text>
        <Text style={styles.placeholderSub}>Your round and practice statistics will appear here</Text>
      </View>
      <View style={styles.statGrid}>
        {['Rounds Played', 'Avg Score', 'Best Round', 'Practice Hours'].map((label, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statCardValue}>--</Text>
            <Text style={styles.statCardLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SGContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <TrendingUp size={32} color="#00E676" />
        <Text style={styles.placeholderTitle}>Strokes Gained</Text>
        <Text style={styles.placeholderSub}>Detailed strokes gained analysis across all categories</Text>
      </View>
      {['Off-the-Tee (OTT)', 'Approach-the-Green (APP)', 'Around-the-Green (ARG)', 'Putting (P)'].map((cat, i) => (
        <View key={i} style={styles.sgRow}>
          <Text style={styles.sgLabel}>{cat}</Text>
          <View style={styles.sgBarWrap}>
            <View style={[styles.sgBar, { width: '0%' }]} />
          </View>
          <Text style={styles.sgValue}>--</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ShotsContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <Crosshair size={32} color="#FFB74D" />
        <Text style={styles.placeholderTitle}>Shot Tracking</Text>
        <Text style={styles.placeholderSub}>Shot-by-shot data and dispersion patterns</Text>
      </View>
    </ScrollView>
  );
}

function DetailsContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <List size={32} color="#E040FB" />
        <Text style={styles.placeholderTitle}>Round Details</Text>
        <Text style={styles.placeholderSub}>Detailed breakdown of each round played</Text>
      </View>
    </ScrollView>
  );
}

function VideoContent() {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeholderCard}>
        <Video size={32} color="#FF7043" />
        <Text style={styles.placeholderTitle}>Video Library</Text>
        <Text style={styles.placeholderSub}>Your swing videos and analysis will be stored here</Text>
      </View>
    </ScrollView>
  );
}

export default function DataOverviewScreen() {
  const [activeTab, setActiveTab] = useState<DataTab>('stats');
  const { openSidebar } = useAppNavigation();

  const renderContent = () => {
    switch (activeTab) {
      case 'stats': return <StatsContent />;
      case 'sg': return <SGContent />;
      case 'shots': return <ShotsContent />;
      case 'details': return <DetailsContent />;
      case 'video': return <VideoContent />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} activeOpacity={0.7}>
            <Menu size={24} color="#F5F7F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Overview</Text>
          <View style={styles.menuBtn} />
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
                    color: isActive ? '#4FC3F7' : '#5A6B60',
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
  statGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: '#141C18',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#243028',
    gap: 6,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#5A6B60',
  },
  sgRow: {
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
  sgLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8A9B90',
    width: 80,
  },
  sgBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#243028',
  },
  sgBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  sgValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    width: 36,
    textAlign: 'right' as const,
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
    color: '#4FC3F7',
  },
});
