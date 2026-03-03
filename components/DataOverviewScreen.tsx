import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, BarChart2, TrendingUp, Crosshair, List, Video, Plus, Columns2, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useSessions } from '@/store/sessionStore';
import { useSwingStore } from '@/store/swingStore';
import { AnalysisSession } from '@/Types';

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

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  } catch {
    return 'Recently';
  }
}

function VideoContent() {
  const router = useRouter();
  const { sessions = [], addSession, removeSession } = useSessions();
  const { setVideoUri, setComparisonMode, clearAll } = useSwingStore();

  const pickAndAnalyze = useCallback(async (comparison: boolean) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;
      
      clearAll();
      const uri1 = result.assets[0].uri;
      setVideoUri(uri1, 0);

      let finalUris = [uri1];
      let finalComparisonMode = false;

      if (comparison) {
        const result2 = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: true,
          quality: 1,
        });

        if (!result2.canceled && result2.assets?.[0]) {
          const uri2 = result2.assets[0].uri;
          setVideoUri(uri2, 1);
          finalUris.push(uri2);
          finalComparisonMode = true;
        }
      }

      setComparisonMode(finalComparisonMode);
      addSession(finalUris);

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/modals/vid-modal');
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video.');
    }
  }, [clearAll, setVideoUri, setComparisonMode, addSession, router]);

  const handleOpenSession = useCallback((session: AnalysisSession) => {
    clearAll();
    if (!session?.videoUris?.[0]) {
      Alert.alert('Missing video', 'This session does not have a valid video.');
      return;
    }
    
    setVideoUri(session.videoUris[0], 0);
    if (session.isComparison && session.videoUris[1]) {
      setVideoUri(session.videoUris[1], 1);
      setComparisonMode(true);
    } else {
      setComparisonMode(false);
    }
    router.push('/modals/vid-modal');
  }, [clearAll, setVideoUri, setComparisonMode, router]);

  const renderSession = useCallback(({ item }: { item: AnalysisSession }) => (
    <Pressable
      style={({ pressed }) => [styles.videoSessionCard, pressed && styles.videoSessionCardPressed]}
      onPress={() => handleOpenSession(item)}
    >
      <View style={styles.videoSessionIcon}>
        {item.isComparison ? <Columns2 size={18} color="#4FC3F7" /> : <Video size={18} color="#4FC3F7" />}
      </View>
      <View style={styles.videoSessionInfo}>
        <Text style={styles.videoSessionTitle}>{item.isComparison ? 'Comparison' : 'Swing Analysis'}</Text>
        <Text style={styles.videoSessionDate}>{formatSessionDate(item.createdAt)}</Text>
      </View>
      <Pressable onPress={() => removeSession(item.id)} style={styles.videoDeleteBtn}>
        <Trash2 size={14} color="#5A6B60" />
      </Pressable>
    </Pressable>
  ), [handleOpenSession, removeSession]);

  return (
    <FlatList
      data={Array.isArray(sessions) ? sessions : []}
      keyExtractor={(item) => item.id}
      renderItem={renderSession}
      style={styles.tabContent}
      contentContainerStyle={styles.videoListContent}
      ListHeaderComponent={
        <View style={styles.videoActionsSection}>
          <Text style={styles.videoHeaderTitle}>Swing Analyzer</Text>
          <Pressable style={styles.videoUploadButton} onPress={() => pickAndAnalyze(false)}>
            <Plus size={24} color="#000" />
            <Text style={styles.videoUploadTitle}>New Analysis</Text>
          </Pressable>
          <Pressable style={styles.videoCompareButton} onPress={() => pickAndAnalyze(true)}>
            <Columns2 size={22} color="#4FC3F7" />
            <Text style={styles.videoCompareTitle}>Compare Swings</Text>
          </Pressable>
          {sessions.length > 0 && <Text style={styles.videoSectionTitle}>History</Text>}
        </View>
      }
    />
  );
}

export default function DataOverviewScreen() {
  const [activeTab, setActiveTab] = useState<DataTab>('stats');
  const { openSidebar, dataOverviewInitialTab, clearDataOverviewInitialTab } = useAppNavigation();

  useEffect(() => {
    if (dataOverviewInitialTab && ['stats', 'sg', 'shots', 'details', 'video'].includes(dataOverviewInitialTab)) {
      setActiveTab(dataOverviewInitialTab as DataTab);
      clearDataOverviewInitialTab();
    }
  }, [dataOverviewInitialTab, clearDataOverviewInitialTab]);

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
  videoHeaderTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 16,
  },
  videoListContent: {
    paddingBottom: 40,
  },
  videoActionsSection: {
    paddingTop: 4,
    gap: 12,
  },
  videoUploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  videoUploadTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  videoCompareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#243028',
  },
  videoCompareTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F5F7F6',
  },
  videoSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5A6B60',
    marginTop: 20,
    textTransform: 'uppercase' as const,
  },
  videoSessionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#141C18',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#243028',
  },
  videoSessionCardPressed: {
    opacity: 0.7,
  },
  videoSessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(79,195,247,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  videoSessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoSessionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#F5F7F6',
  },
  videoSessionDate: {
    fontSize: 12,
    color: '#5A6B60',
  },
  videoDeleteBtn: {
    padding: 8,
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
