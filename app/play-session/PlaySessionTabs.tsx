import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Target, Navigation, Wind, Brain, Database } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';
import { ScoringProvider, useScoring } from '@/contexts/ScoringContext';
import ScoreTab from './tabs/ScoreTab';
import GPSTab from './tabs/GPSTab';
import WindTab from './tabs/WindTab';
import MindTab from './tabs/MindTab';
import DataTab from './tabs/DataTab';
import ScoreBoard from '@/components/ScoBoa/ScoreBoard';

type PlayTab = 'score' | 'gps' | 'wind' | 'mind' | 'data';

const tabConfig: { key: PlayTab; label: string; icon: React.ReactNode }[] = [
  { key: 'score', label: 'Score', icon: <Target size={20} /> },
  { key: 'gps', label: 'GPS', icon: <Navigation size={20} /> },
  { key: 'wind', label: 'Wind', icon: <Wind size={20} /> },
  { key: 'mind', label: 'Mind', icon: <Brain size={20} /> },
  { key: 'data', label: 'Data', icon: <Database size={20} /> },
];

function PlaySessionContent() {
  const [activeTab, setActiveTab] = useState<PlayTab>('score');
  const { minimizeSession } = useSession();
  const { showScoreboard, setShowScoreboard } = useScoring();
  const insets = useSafeAreaInsets();

  const isScoreTab = activeTab === 'score';
  const isFullScreenTab = activeTab === 'wind' || activeTab === 'mind' || activeTab === 'gps';

  const renderContent = () => {
    switch (activeTab) {
      case 'score': return <ScoreTab />;
      case 'gps': return <GPSTab />;
      case 'wind': return <WindTab />;
      case 'mind': return <MindTab />;
      case 'data': return <DataTab />;
    }
  };

  return (
    <View style={styles.container}>
      {isScoreTab ? (
        <View style={[styles.scoreContainer, { paddingTop: insets.top }]}>
          {renderContent()}
        </View>
      ) : isFullScreenTab ? (
        <>
          <TouchableOpacity
            onPress={minimizeSession}
            style={[styles.minimizeButton, { top: insets.top + 4 }]}
          >
            <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.fullScreenContent}>
            {renderContent()}
          </View>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={minimizeSession}
            style={[styles.minimizeButton, { top: insets.top + 4 }]}
          >
            <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={[styles.content, { paddingTop: insets.top + 52, padding: 20 }]}>
            {renderContent()}
          </View>
        </>
      )}

      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        {tabConfig.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={activeTab === tab.key ? styles.iconActive : styles.iconInactive}>
              {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                color: activeTab === tab.key ? Colors.primary : Colors.tabInactive,
              })}
            </View>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScoreBoard visible={showScoreboard} onClose={() => setShowScoreboard(false)} />
    </View>
  );
}

export default function PlaySessionTabs() {
  return (
    <ScoringProvider>
      <PlaySessionContent />
    </ScoringProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scoreContainer: {
    flex: 1,
    backgroundColor: '#1a2e1f',
  },
  minimizeButton: {
    position: 'absolute' as const,
    left: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fullScreenContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabActive: {},
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: Colors.tabInactive,
    fontWeight: '500' as const,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
