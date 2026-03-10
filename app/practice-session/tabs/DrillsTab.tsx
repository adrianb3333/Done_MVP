import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Layers, CalendarDays, CalendarCheck, Swords, Dumbbell } from "lucide-react-native";

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



interface DrillsTabProps {
  onDrillActiveChange?: (active: boolean) => void;
}

const dedicatedComponents = [
  "The Clock", "The Gate", "The Ladder", "27 Challenge",
  "Bunker", "Cirkel", "5-30m", "Area Towel",
  "9 box", "Mr Routine", "Distance control", "Pause",
  "Power Line", "Fade", "Accuracy", "Draw",
];

export default function DrillsTab({ onDrillActiveChange }: DrillsTabProps) {
  const [selectedDrill, setSelectedDrill] = useState<{ category: string; card: string } | null>(null);
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    setSelectedDrill(null);
    onDrillActiveChange?.(false);
  };

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
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
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
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.topCard} activeOpacity={0.7}>
              <View style={styles.topIconCircle}>
                <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.topCardLabel}>New Drill</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.topCard} activeOpacity={0.7}>
              <View style={[styles.topIconCircle, { backgroundColor: 'rgba(255,140,50,0.25)' }]}>
                <Layers size={22} color="#FF8C32" />
              </View>
              <Text style={styles.topCardLabel}>New Session</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.topCard} activeOpacity={0.7}>
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

          <View style={styles.emptyState}>
            <Dumbbell size={36} color="rgba(255,255,255,0.35)" />
            <Text style={styles.emptyTitle}>No drills yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "New Drill" to create your first practice drill
            </Text>
          </View>
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
    marginBottom: 40,
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
