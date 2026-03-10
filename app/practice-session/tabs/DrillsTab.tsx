import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Layers, CalendarDays, CalendarCheck, Swords, Dumbbell, ChevronRight, Clock as ClockIcon } from "lucide-react-native";

import Clock from "@/components/ovningar/Clock";
import Gate from "@/components/ovningar/Gate";
import Ladder from "@/components/ovningar/Ladder";
import Challenge27 from "@/components/ovningar/Challange27";
import Bunker from "@/components/ovningar/Bunker";
import Cirkel from "@/components/ovningar/Cirkel";
import W5_30m from "@/components/ovningar/W5-30m";
import AreaTowel from "@/components/ovningar/AreaTowel";
import Box9 from "@/components/ovningar/Box9";
import MrRoutine from "@/components/ovningar/MrRoutine";
import DistanceControl from "@/components/ovningar/DistanceControl";
import Pause from "@/components/ovningar/Pause";
import PowerLine from "@/components/ovningar/PowerLine";
import Fade from "@/components/ovningar/Fade";
import Accuracy from "@/components/ovningar/Accuracy";
import Draw from "@/components/ovningar/Draw";
import CreateDrillScreen, { CustomDrill } from "@/components/drills/CreateDrillScreen";
import CreateSessionScreen, { CustomSession } from "@/components/drills/CreateSessionScreen";
import CreateScheduleScreen, { ScheduledItem } from "@/components/drills/CreateScheduleScreen";
import CalendarScreen from "@/components/drills/CalendarScreen";

interface DrillsTabProps {
  onDrillActiveChange?: (active: boolean) => void;
}

const dedicatedComponents = [
  "The Clock", "The Gate", "The Ladder", "27 Challenge",
  "Bunker", "Cirkel", "5-30m", "Area Towel",
  "9 box", "Mr Routine", "Distance control", "Pause",
  "Power Line", "Fade", "Accuracy", "Draw",
];

const CATEGORY_COLORS: Record<string, string> = {
  Putting: '#2D6A4F',
  Wedges: '#E76F51',
  Irons: '#7B2CBF',
  Woods: '#40916C',
};

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayDayName(): string {
  const now = new Date();
  const dayIndex = now.getDay();
  return DAY_NAMES_SHORT[dayIndex];
}

type ScreenState = 'main' | 'createDrill' | 'createSession' | 'createSchedule' | 'calendar';

export default function DrillsTab({ onDrillActiveChange }: DrillsTabProps) {
  const [selectedDrill, setSelectedDrill] = useState<{ category: string; card: string } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('main');
  const [savedDrills, setSavedDrills] = useState<CustomDrill[]>([]);
  const [savedSessions, setSavedSessions] = useState<CustomSession[]>([]);
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const insets = useSafeAreaInsets();

  const todayName = getTodayDayName();

  const todaysSchedule = useMemo(() => {
    return scheduledItems.filter(item => item.days.includes(todayName));
  }, [scheduledItems, todayName]);

  const handleBack = () => {
    setSelectedDrill(null);
    onDrillActiveChange?.(false);
  };

  const handleSaveDrill = (drill: CustomDrill) => {
    console.log('Saving drill:', drill);
    setSavedDrills(prev => [...prev, drill]);
    setCurrentScreen('main');
  };

  const handleSaveSession = (session: CustomSession) => {
    console.log('Saving session:', session);
    setSavedSessions(prev => [...prev, session]);
    setCurrentScreen('main');
  };

  const handleSaveSchedule = (item: ScheduledItem) => {
    console.log('Saving schedule:', item);
    setScheduledItems(prev => [...prev, item]);
    setCurrentScreen('main');
  };

  const drillsByCategory = savedDrills.reduce<Record<string, CustomDrill[]>>((acc, drill) => {
    if (!acc[drill.category]) {
      acc[drill.category] = [];
    }
    acc[drill.category].push(drill);
    return acc;
  }, {});

  const renderDrillComponent = () => {
    if (!selectedDrill) return null;
    switch (selectedDrill.card) {
      case "The Clock": return <Clock onBack={handleBack} drillName="The Clock" />;
      case "The Gate": return <Gate onBack={handleBack} drillName="The Gate" />;
      case "The Ladder": return <Ladder onBack={handleBack} drillName="The Ladder" />;
      case "27 Challenge": return <Challenge27 onBack={handleBack} />;
      case "Bunker": return <Bunker onBack={handleBack} drillName="Bunker Pro" />;
      case "Cirkel": return <Cirkel onBack={handleBack} drillName="The Cirkel" />;
      case "5-30m": return <W5_30m onBack={handleBack} drillName="Wedge 5-30m" />;
      case "Area Towel": return <AreaTowel onBack={handleBack} drillName="Area Towel Drill" />;
      case "9 box": return <Box9 onBack={handleBack} drillName="9 Box" />;
      case "Mr Routine": return <MrRoutine onBack={handleBack} drillName="My Routine" />;
      case "Distance control": return <DistanceControl onBack={handleBack} drillName="Distance Control" />;
      case "Pause": return <Pause onBack={handleBack} drillName="Pause Drill" />;
      case "Power Line": return <PowerLine onBack={handleBack} drillName="Power Line" />;
      case "Fade": return <Fade onBack={handleBack} drillName="The Fade" />;
      case "Accuracy": return <Accuracy onBack={handleBack} drillName="Accuracy" />;
      case "Draw": return <Draw onBack={handleBack} drillName="The Draw" />;
      default: return null;
    }
  };

  const hasDedicatedComponent = dedicatedComponents.includes(selectedDrill?.card || "");

  if (selectedDrill && hasDedicatedComponent) {
    return (
      <View style={styles.drillWrapper}>
        {renderDrillComponent()}
      </View>
    );
  }

  if (currentScreen === 'createDrill') {
    return (
      <CreateDrillScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveDrill}
      />
    );
  }

  if (currentScreen === 'createSession') {
    return (
      <CreateSessionScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveSession}
        drills={savedDrills}
      />
    );
  }

  if (currentScreen === 'createSchedule') {
    return (
      <CreateScheduleScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveSchedule}
        drills={savedDrills}
        sessions={savedSessions}
      />
    );
  }

  if (currentScreen === 'calendar') {
    return (
      <CalendarScreen
        onBack={() => setCurrentScreen('main')}
        scheduledItems={scheduledItems}
        completedItems={[]}
      />
    );
  }

  const categoryOrder = Object.keys(drillsByCategory);

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#0059B2', '#1075E3', '#1C8CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.headerTitle}>Drills</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('calendar')}
            >
              <CalendarDays size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
              <CalendarCheck size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {todaysSchedule.length > 0 && (
            <View style={styles.todaySection}>
              <View style={styles.todaySectionHeader}>
                <ClockIcon size={16} color="#FFFFFF" />
                <Text style={styles.todaySectionTitle}>Today's Schedule</Text>
              </View>
              {todaysSchedule.map((item) => (
                <View key={item.id} style={styles.todayCard}>
                  <LinearGradient
                    colors={['rgba(46,125,50,0.35)', 'rgba(46,125,50,0.18)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.todayCardGradient}
                  >
                    <View style={styles.todayCardInner}>
                      <View style={styles.todayCardContent}>
                        <Text style={styles.todayCardName}>{item.itemName}</Text>
                        <Text style={styles.todayCardType}>
                          {item.type === 'drill' ? 'Drill' : 'Session'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('createDrill')}
            >
              <View style={styles.topIconCircle}>
                <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.topCardLabel}>New Drill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('createSession')}
            >
              <View style={[styles.topIconCircle, { backgroundColor: 'rgba(255,140,50,0.25)' }]}>
                <Layers size={22} color="#FF8C32" />
              </View>
              <Text style={styles.topCardLabel}>New Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('createSchedule')}
            >
              <View style={[styles.topIconCircle, { backgroundColor: 'rgba(80,160,255,0.25)' }]}>
                <CalendarDays size={22} color="#50A0FF" />
              </View>
              <Text style={styles.topCardLabel}>Schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sensorRow}>
            <TouchableOpacity style={styles.sensorCard} activeOpacity={0.7}>
              <Text style={styles.sensorLabel}>SENSORS NEEDED</Text>
              <View style={styles.sensorIconCircle}>
                <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.sensorCardTitle}>New Sensor Drill</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sensorCard} activeOpacity={0.7}>
              <Text style={styles.sensorLabel}>SENSORS NEEDED</Text>
              <View style={[styles.sensorIconCircle, { backgroundColor: 'rgba(230,57,70,0.2)' }]}>
                <Swords size={20} color="#E63946" />
              </View>
              <Text style={styles.sensorCardTitle}>Battle</Text>
            </TouchableOpacity>
          </View>

          {savedSessions.length > 0 && (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <View style={[styles.categoryDot, { backgroundColor: '#FF8C32' }]} />
                <Text style={styles.categoryTitle}>Sessions</Text>
              </View>
              {savedSessions.map((session) => {
                const sessionDrills = savedDrills.filter(d => session.drillIds.includes(d.id));
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.drillCard}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.drillCardGradient}
                    >
                      <View style={styles.drillCardInner}>
                        <View style={styles.drillCardContent}>
                          <Text style={styles.drillCardName}>{session.name}</Text>
                          <Text style={styles.drillCardMeta}>
                            {sessionDrills.length} drill{sessionDrills.length !== 1 ? 's' : ''} · {sessionDrills.map(d => d.name).join(', ')}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {categoryOrder.length > 0 ? (
            categoryOrder.map((category) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] || '#2D6A4F' }]} />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                {drillsByCategory[category].map((drill) => (
                  <TouchableOpacity
                    key={drill.id}
                    style={styles.drillCard}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.drillCardGradient}
                    >
                      <View style={styles.drillCardInner}>
                        <View style={styles.drillCardContent}>
                          <Text style={styles.drillCardName}>{drill.name}</Text>
                          <Text style={styles.drillCardMeta}>
                            {drill.rounds} rounds · {drill.targetsPerRound} targets · {drill.totalShots} shots
                          </Text>
                        </View>
                        <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            savedSessions.length === 0 && (
              <View style={styles.emptyState}>
                <Dumbbell size={36} color="rgba(255,255,255,0.35)" />
                <Text style={styles.emptyTitle}>No drills yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "New Drill" to create your first practice drill
                </Text>
              </View>
            )
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  headerIcons: {
    flexDirection: "row" as const,
    gap: 10,
  },
  headerIconBtn: {
    backgroundColor: GLASS_BG,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  todaySection: {
    marginBottom: 16,
  },
  todaySectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  todaySectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  todayCard: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.3)',
    marginBottom: 6,
  },
  todayCardGradient: {
    borderRadius: 14,
  },
  todayCardInner: {
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  todayCardContent: {
    flex: 1,
    gap: 2,
  },
  todayCardName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  todayCardType: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  topRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 12,
  },
  topCard: {
    flex: 1,
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingVertical: 18,
    alignItems: "center" as const,
    gap: 10,
  },
  topIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  topCardLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  sensorRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 24,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingVertical: 16,
    alignItems: "center" as const,
    gap: 8,
  },
  sensorLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
  sensorIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sensorCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
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
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  drillCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: 8,
  },
  drillCardGradient: {
    borderRadius: 16,
  },
  drillCardInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  drillCardContent: {
    flex: 1,
    gap: 4,
  },
  drillCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  drillCardMeta: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  emptyState: {
    alignItems: "center" as const,
    paddingTop: 30,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center" as const,
    maxWidth: 240,
    lineHeight: 20,
  },
  drillWrapper: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "#000",
  },
});
