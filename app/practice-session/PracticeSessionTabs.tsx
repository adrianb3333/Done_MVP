import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, User, Navigation, Plane, FileText, Dumbbell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';
import MyTab from './tabs/MyTab';
import PositionTab from './tabs/PositionTab';
import FlightTab from './tabs/FlightTab';
import NotesTab from './tabs/NotesTab';
import DrillsTab from './tabs/DrillsTab';

type PracticeTab = 'my' | 'position' | 'flight' | 'notes' | 'drills';

const tabsConfig: { key: PracticeTab; label: string; icon: React.ReactNode }[] = [
  { key: 'my', label: 'My', icon: <User size={20} /> },
  { key: 'notes', label: 'Notes', icon: <FileText size={20} /> },
  { key: 'flight', label: 'Flight', icon: <Plane size={20} /> },
  { key: 'position', label: 'Position', icon: <Navigation size={20} /> },
  { key: 'drills', label: 'Drills', icon: <Dumbbell size={20} /> },
];

export default function PracticeSessionTabs() {
  const [activeTab, setActiveTab] = useState<PracticeTab>('my');
  const [isDrillActive, setIsDrillActive] = useState(false);
  const { minimizeSession } = useSession();
  const insets = useSafeAreaInsets();

  const handleDrillActiveChange = useCallback((active: boolean) => {
    setIsDrillActive(active);
  }, []);

  const renderNonDrillContent = () => {
    switch (activeTab) {
      case 'my': return <MyTab />;
      case 'position': return <PositionTab />;
      case 'notes': return <NotesTab />;
      default: return null;
    }
  };

  const isFlightTab = activeTab === 'flight';
  const isPositionTab = activeTab === 'position';

  const isDrillFullScreen = isDrillActive && activeTab === 'drills';

  return (
    <View style={styles.root}>
      {!isDrillFullScreen && (
        <TouchableOpacity
          onPress={minimizeSession}
          style={[styles.minimizeButton, { top: insets.top + 4 }]}
        >
          <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {activeTab !== 'drills' && !isFlightTab && !isPositionTab && !isDrillFullScreen && (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={[
            styles.contentContainer, 
            { paddingTop: insets.top + 52 }
          ]}
        >
          {renderNonDrillContent()}
        </ScrollView>
      )}

      {(isFlightTab || isPositionTab) && !isDrillFullScreen && (
        <View style={styles.content}>
          {isFlightTab ? <FlightTab /> : <PositionTab />}
        </View>
      )}

      <View style={activeTab === 'drills' ? (isDrillFullScreen ? styles.fullScreenDrill : styles.drillInline) : styles.hidden}>
        <DrillsTab onDrillActiveChange={handleDrillActiveChange} />
      </View>

      {!isDrillFullScreen && (
        <View style={styles.tabBar}>
          {tabsConfig.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={activeTab === tab.key ? styles.iconActive : styles.iconInactive}>
                {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                  color: activeTab === tab.key ? Colors.accent : Colors.tabInactive,
                })}
              </View>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Set background to the specific dark color to prevent white bars
    backgroundColor: '#020d12', 
  },
  container: {
    flex: 1,
    backgroundColor: '#020d12',
  },
  fullScreenDrill: {
    flex: 1,
    backgroundColor: '#000',
  },
  drillInline: {
    flex: 1,
  },
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden' as const,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    // Removed padding: 20 to allow content to hit the edges
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
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
    color: Colors.accent,
    fontWeight: '600' as const,
  },
});