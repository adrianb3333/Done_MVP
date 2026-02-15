import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from '@/constants/colors';

// Reusable components
import StatCard from "@/components/reusables/StatCard";

// Drill components from /ovningar/
import Clock from "@/components/ovningar/Clock";
import Gate from "@/components/ovningar/Gate";
import Ladder from "@/components/ovningar/Ladder";
import Challenge27 from "@/components/ovningar/Challange27";
import Bunker from "@/components/ovningar/Bunker";
import Cirkel from "@/components/ovningar/Cirkel";
import W5_30m from "@/components/ovningar/W5-30m"; 
import AreaTowel from "@/components/ovningar/AreaTowel";

// Iron Drills
import Box9 from "@/components/ovningar/Box9";
import MrRoutine from "@/components/ovningar/MrRoutine";
import DistanceControl from "@/components/ovningar/DistanceControl";
import Pause from "@/components/ovningar/Pause";

// New Wood Drills Integration
import PowerLine from "@/components/ovningar/PowerLine";
import Fade from "@/components/ovningar/Fade";
import Accuracy from "@/components/ovningar/Accuracy";
import Draw from "@/components/ovningar/Draw";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.45;
const CARD_MARGIN = 12;

const categories = [
  { 
    header: "Putting", 
    cards: ["The Gate", "The Clock", "27 Challenge", "The Ladder"] 
  },
  { 
    header: "Wedges", 
    cards: ["Bunker", "Cirkel", "5-30m", "Area Towel"] 
  },
  { 
    header: "Irons", 
    cards: ["9 box", "Mr Routine", "Distance control", "Pause"] 
  },
  { 
    header: "Woods", 
    cards: ["Power Line", "Fade", "Accuracy", "Draw"] 
  },
];

interface DrillsTabProps {
  onDrillActiveChange?: (active: boolean) => void;
}

export default function DrillsTab({ onDrillActiveChange }: DrillsTabProps) {
  const [selectedDrill, setSelectedDrill] = useState<{ category: string, card: string } | null>(null);

  const handleCardPress = (category: string, card: string) => {
    setSelectedDrill({ category, card });
    onDrillActiveChange?.(true);
  };

  const handleBack = () => {
    setSelectedDrill(null);
    onDrillActiveChange?.(false);
  };

  // List of cards that should trigger a dedicated full-screen component
  const dedicatedComponents = [
    "The Clock", 
    "The Gate", 
    "The Ladder", 
    "27 Challenge", 
    "Bunker", 
    "Cirkel", 
    "5-30m", 
    "Area Towel",
    "9 box",           
    "Mr Routine",      
    "Distance control",
    "Pause",
    "Power Line",     // Added
    "Fade",           // Added
    "Accuracy",       // Added
    "Draw"            // Added
  ];

  const renderDrillComponent = () => {
    if (!selectedDrill) return null;

    switch (selectedDrill.card) {
      // Putting
      case "The Clock":
        return <Clock onBack={handleBack} drillName="The Clock" />;
      case "The Gate":
        return <Gate onBack={handleBack} drillName="The Gate" />;
      case "The Ladder":
        return <Ladder onBack={handleBack} drillName="The Ladder" />;
      case "27 Challenge":
        return <Challenge27 onBack={handleBack} />;
      
      // Wedges
      case "Bunker":
        return <Bunker onBack={handleBack} drillName="Bunker Pro" />;
      case "Cirkel":
        return <Cirkel onBack={handleBack} drillName="The Cirkel" />;
      case "5-30m":
        return <W5_30m onBack={handleBack} drillName="Wedge 5-30m" />;
      case "Area Towel":
        return <AreaTowel onBack={handleBack} drillName="Area Towel Drill" />;
      
      // Irons
      case "9 box":
        return <Box9 onBack={handleBack} drillName="9 Box" />;
      case "Mr Routine":
        return <MrRoutine onBack={handleBack} drillName="My Routine" />;
      case "Distance control":
        return <DistanceControl onBack={handleBack} drillName="Distance Control" />;
      case "Pause":
        return <Pause onBack={handleBack} drillName="Pause Drill" />;

      // Woods (New Integration)
      case "Power Line":
        return <PowerLine onBack={handleBack} drillName="Power Line" />;
      case "Fade":
        return <Fade onBack={handleBack} drillName="The Fade" />;
      case "Accuracy":
        return <Accuracy onBack={handleBack} drillName="Accuracy" />;
      case "Draw":
        return <Draw onBack={handleBack} drillName="The Draw" />;
        
      default:
        return null;
    }
  };

  const hasDedicatedComponent = dedicatedComponents.includes(selectedDrill?.card || "");

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {!selectedDrill && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Drills 🏋️</Text>
            <Text style={styles.subtitle}>Improve Your Game</Text>
            
            {categories.map((category) => (
              <View key={category.header} style={styles.categoryContainer}>
                <Text style={styles.categoryHeader}>{category.header}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {category.cards.map((card, index) => (
                    <View key={card} style={{ width: CARD_WIDTH, marginRight: index === category.cards.length - 1 ? 0 : CARD_MARGIN }}>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleCardPress(category.header, card)}>
                        <View style={styles.glassPlaceholder}>
                          <Text style={styles.cardTitle}>{card}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}

        {selectedDrill && !hasDedicatedComponent && (
          <View style={styles.detailContainer}>
            <View style={styles.statCardWrapper}>
              <StatCard label="Drill Name" value={selectedDrill.card} />
            </View>
            <ScrollView contentContainerStyle={styles.overlayContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={handleBack} style={styles.backButtonInline}>
                <Text style={styles.backText}>← Back to drills</Text>
              </TouchableOpacity>
              <Text style={styles.detailCategory}>{selectedDrill.category}</Text>
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      {selectedDrill && hasDedicatedComponent && (
        <View style={styles.drillWrapper}>
          {renderDrillComponent()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FDFCF8" },
  container: { flex: 1 },
  scrollContent: { paddingVertical: 20 },
  title: { fontSize: 32, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8, textAlign: "center", marginBottom: 20 },
  categoryContainer: { marginBottom: 24 },
  categoryHeader: { fontSize: 22, fontWeight: "600", color: "#2d5a27", marginBottom: 12, paddingLeft: 16 },
  cardTitle: { color: "#1a1a1a", fontSize: 16, fontWeight: "600", textAlign: "center" },
  glassPlaceholder: { 
    height: 140, 
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: 'rgba(0,0,0,0.04)', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.08)',
    borderLeftWidth: 5, 
    borderLeftColor: '#E63946', 
  },
  backText: { color: "#2d5a27", fontSize: 14, fontWeight: "600" },
  drillWrapper: { 
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    backgroundColor: '#000' 
  },
  detailContainer: { flex: 1 },
  statCardWrapper: { position: "absolute", top: -height * 0.25, left: -width * 0.1, width: width * 1.2, height: height * 1.5, zIndex: 0 },
  overlayContent: { paddingHorizontal: 16, paddingTop: 20, alignItems: "center", zIndex: 1 },
  backButtonInline: { alignSelf: "flex-start", marginBottom: 20 },
  detailCategory: { color: "#666", fontSize: 18, marginTop: 60, textAlign: "center" },
});

