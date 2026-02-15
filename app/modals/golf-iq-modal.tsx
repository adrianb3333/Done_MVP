import React, { useCallback, useRef } from "react";
import { StyleSheet, Text, View, ImageBackground, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";
import StatCard from "@/components/reusables/StatCard";
import { useUserData } from "@/hooks/useUserData";

const INFO_CATEGORIES = [
  { id: 'club', label: 'Club', count: 11 },
  { id: 'ball', label: 'Ball & Launch', count: 6 },
  { id: 'flight', label: 'Flight & Landing', count: 8 },
  { id: 'impact', label: 'Impact', count: 4 },
  { id: 'body', label: 'Body Mechanism', count: 4 },
  { id: 'turf', label: 'Turf Interaction', count: 3 },
  { id: 'wedge', label: 'Wedge', count: 3 },
  { id: 'putter', label: 'Putter', count: 3 },
  { id: 'green', label: 'Green Reading', count: 4 },
];

export default function TrainingDashboard({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { userData, updateGolfIQ } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [activeInfoCard, setActiveInfoCard] = React.useState<string | null>(null);
  const [activeDataCard, setActiveDataCard] = React.useState<number | null>(null);

  const golfIQNotes = userData.golfIQ;

  const handleBack = () => {
    if (activeDataCard !== null) {
      setActiveDataCard(null);
    } else if (activeInfoCard !== null) {
      setActiveInfoCard(null);
    } else {
      if (onClose) { onClose(); } else { router.back(); }
    }
  };

  const handleNoteChange = useCallback((key: string, value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateGolfIQ(key, value);
    }, 500);
  }, [updateGolfIQ]);

  const currentCategory = INFO_CATEGORIES.find(c => c.id === activeInfoCard);
  const noteKey = `${activeInfoCard}-${activeDataCard}`;

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2og1gfzbpfgrdjyzujhyg' }}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.closeButton}>
            {activeInfoCard ? <ChevronLeft size={28} color="#FFFFFF" /> : <X size={28} color="#FFFFFF" />}
          </Pressable>
          <Text style={styles.headerTitle}>
            {activeDataCard !== null ? "Data Entry" : activeInfoCard ? "Select Data" : "Performance"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {!activeInfoCard && (
            <View style={styles.grid}>
              <Text style={styles.sectionTitle}>InfoCard</Text>
              <View style={styles.rowWrap}>
                {INFO_CATEGORIES.map((item) => (
                  <Pressable 
                    key={item.id} 
                    style={styles.infoCardWrapper}
                    onPress={() => setActiveInfoCard(item.id)}
                  >
                    <StatCard label={item.label} value={`${item.count}`} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeInfoCard && activeDataCard === null && (
            <View style={styles.grid}>
              <Text style={styles.sectionTitle}>DataCard: {currentCategory?.label}</Text>
              <View style={styles.rowWrap}>
                {Array.from({ length: currentCategory?.count || 0 }).map((_, index) => (
                  <Pressable 
                    key={index} 
                    style={styles.infoCardWrapper}
                    onPress={() => setActiveDataCard(index + 1)}
                  >
                    <StatCard label={`Metric ${index + 1}`} value="" />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeDataCard !== null && (
            <LiquidGlassCard containerStyle={styles.inputCard}>
              <Text style={styles.inputHeader}>{currentCategory?.label} - Point {activeDataCard}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Enter technical notes..."
                placeholderTextColor="#999"
                multiline
                defaultValue={golfIQNotes[noteKey] || ''}
                onChangeText={(text) => handleNoteChange(noteKey, text)}
              />
            </LiquidGlassCard>
          )}

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#020d12' },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#FFD700",
    textAlign: "center",
    marginRight: 44,
  },
  closeButton: { padding: 8 },
  scrollContent: { padding: 12 },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800' as const,
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  grid: { width: '100%' },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: 'flex-start',
  },
  infoCardWrapper: {
    width: "33.33%",
    padding: 5,
  },
  inputCard: { padding: 20, marginTop: 20 },
  inputHeader: { color: '#FFCC00', fontSize: 20, fontWeight: '700' as const, marginBottom: 15 },
  inputBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top'
  }
});
