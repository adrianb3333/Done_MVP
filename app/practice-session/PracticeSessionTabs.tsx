import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, User, Navigation, Plane, FileText, Dumbbell } from 'lucide-react-native';
import { useSession } from '@/contexts/SessionContext';

const BLUE_ACTIVE = '#0059B2';
const BLUE_INACTIVE = '#8BB8E0';
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
  const [positionDistance, setPositionDistance] = useState<number>(0);
  const { minimizeSession } = useSession();
  const insets = useSafeAreaInsets();

  const handlePositionDistanceChange = useCallback((dist: number) => {
    setPositionDistance(dist);
  }, []);

  const handleDrillActiveChange = useCallback((active: boolean) => {
    setIsDrillActive(active);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'my': return <MyTab />;
      case 'position': return <PositionTab onDistanceChange={handlePositionDistanceChange} />;
      case 'flight': return <FlightTab externalDistance={positionDistance} />;
      case 'notes': return <NotesTab />;
      default: return null;
    }
  };

  const isDrillFullScreen = isDrillActive && activeTab === 'drills';
  const isContentTab = activeTab !== 'drills';

  return (
    <View style={styles.root}>
      {!isDrillFullScreen && activeTab !== 'drills' && (
        <TouchableOpacity
          onPress={minimizeSession}
          style={[styles.minimizeButton, { top: insets.top + 4 }]}
        >
          <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {isContentTab && !isDrillFullScreen && (
        <View style={styles.content}>
          {renderContent()}
        </View>
      )}

      <View style={activeTab === 'drills' ? (isDrillFullScreen ? styles.fullScreenDrill : styles.drillInline) : styles.hidden}>
        <DrillsTab onDrillActiveChange={handleDrillActiveChange} onMinimize={minimizeSession} />
      </View>

      {!isDrillFullScreen && (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={isActive ? styles.tabActiveHighlight : undefined}>
                  <View style={[{ alignItems: 'center' as const }, isActive ? styles.iconActive : styles.iconInactive]}>
                    {isActive ? (
                      <LinearGradient
                        colors={['#0059B2', '#1075E3', '#1C8CFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.iconGradientWrap}
                      >
                        {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                          color: '#FFFFFF',
                        })}
                      </LinearGradient>
                    ) : (
                      React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                        color: BLUE_INACTIVE,
                      })
                    )}
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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

  tabBar: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  tabActiveHighlight: {
    backgroundColor: 'rgba(0,89,178,0.08)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.5,
  },
  iconGradientWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: BLUE_INACTIVE,
    fontWeight: '500' as const,
  },
  tabLabelActive: {
    color: BLUE_ACTIVE,
    fontWeight: '700' as const,
  },
});