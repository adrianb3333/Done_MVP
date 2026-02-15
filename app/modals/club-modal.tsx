import React, { useCallback, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ImageBackground, 
  ScrollView, 
  Pressable,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import { useRouter } from "expo-router";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";
import StatCard from "@/components/reusables/StatCard";
import { useUserData, NotesState } from "@/hooks/useUserData";

export default function ClubModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateClubNotes } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const WOODS = ["Driver", "2W", "3W", "4W", "5W", "7W", "9W"];
  const HYBRIDS = ["2H", "3H", "4H", "5H", "6H"];
  const IRONS = ["1", "2", "3", "4", "5", "6", "7-", "8", "9", "Pitch"];
  const WEDGES = ["AW", "SW", "LW"];

  const [selectedClub, setSelectedClub] = React.useState<string | null>(null);
  const clubNotes = userData.clubNotes;

  const isWedge = (club: string) => WEDGES.includes(club);

  const handleNoteChange = useCallback((club: string, pointKey: keyof NotesState, value: string) => {
    const currentNotes = clubNotes[club] || { point1: '', point2: '', point3: '' };
    const newNotes = { ...currentNotes, [pointKey]: value };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateClubNotes(club, newNotes);
    }, 500);
  }, [clubNotes, updateClubNotes]);

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2og1gfzbpfgrdjyzujhyg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />
      <SafeAreaView style={styles.container} edges={['top']}>

        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Club</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LiquidGlassCard containerStyle={{ padding: 10 }}>
            <Text style={styles.sectionHeader}>Learn your Club Difference</Text>

            {!selectedClub ? (
              <>
                {renderCategory("Woods", WOODS, setSelectedClub, selectedClub, "#00FF00")}
                {renderCategory("Hybrids", HYBRIDS, setSelectedClub, selectedClub, "#FFFFFF")}
                {renderCategory("Irons", IRONS, setSelectedClub, selectedClub, "#FFFFFF")}
                {renderCategory("Wedges", WEDGES, setSelectedClub, selectedClub, "#FFFFFF")}
              </>
            ) : (
              <Pressable 
                onPress={() => setSelectedClub(null)} 
                style={({ pressed }) => [
                  styles.selectedPreview,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
              >
                <View style={styles.highlightedClubBox}>
                   <Text style={styles.highlightedClubText}>{selectedClub}</Text>
                   <Text style={styles.tapToChange}>Tap to change club</Text>
                </View>
              </Pressable>
            )}
          </LiquidGlassCard>

          {selectedClub && (
            <View style={{ marginTop: 25 }}>
              <LiquidGlassCard containerStyle={{ marginBottom: 20, padding: 15 }}>
                <Text style={styles.greenHeader}>{selectedClub} – Distance</Text>
                
                {['Soft (80%)', 'Normal (90%)', 'Hard (105%)'].map((label, index) => {
                  const key = `point${index + 1}` as keyof NotesState;
                  return (
                    <View key={key} style={styles.noteSection}>
                      <Text style={styles.inputLabel}>{label}</Text>
                      <TextInput
                        style={styles.inputBox}
                        placeholder="Enter yardage or notes..."
                        placeholderTextColor="#999"
                        multiline
                        defaultValue={clubNotes[selectedClub]?.[key] || ''}
                        onChangeText={text => handleNoteChange(selectedClub, key, text)}
                      />
                    </View>
                  );
                })}
              </LiquidGlassCard>

              {isWedge(selectedClub) && (
                <>
                  <Text style={styles.clockHeader}>Clock System</Text>
                  {renderClockCard(selectedClub, "Right", ["7:30", "9:00", "10:30"], clubNotes, handleNoteChange)}
                  {renderClockCard(selectedClub, "Left", ["4:30", "3:00", "1:30"], clubNotes, handleNoteChange)}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function renderCategory(
  title: string, 
  items: string[], 
  setSelected: (v: string | null) => void, 
  selectedClub: string | null,
  _categoryColor: string
) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.categoryHeader}>{title}</Text>
      <View style={styles.rowWrap}>
        {items.map(club => {
          const isSelected = selectedClub === club;
          return (
            <View key={club} style={styles.cardWrapper}>
              <Pressable
                onPress={() => setSelected(isSelected ? null : club)}
                style={({ pressed }) => [
                  styles.pressableBase,
                  isSelected && styles.pressableSelected,
                  pressed && styles.pressablePressed
                ]}
              >
                <StatCard 
                  label={club} 
                  value="" 
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function renderClockCard(
  club: string,
  title: string,
  labels: string[],
  clubNotes: Record<string, NotesState>,
  handleNoteChange: (club: string, pointKey: keyof NotesState, value: string) => void
) {
  const clockKey = `${club}_clock_${title.toLowerCase()}`;
  return (
    <LiquidGlassCard containerStyle={{ marginBottom: 20, padding: 15 }}>
      <Text style={styles.greenHeader}>{title}</Text>
      {labels.map((label, index) => {
        const key = `point${index + 1}` as keyof NotesState;
        return (
          <View key={key} style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{label} Swing</Text>
            <TextInput
              placeholder="Notes..."
              placeholderTextColor="#999"
              multiline
              style={styles.inputBox}
              defaultValue={clubNotes[clockKey]?.[key] || ''}
              onChangeText={text => handleNoteChange(clockKey, key, text)}
            />
          </View>
        );
      })}
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#020d12',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFD700",
    textAlign: "center",
    marginRight: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 10,
    fontWeight: "700" as const,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardWrapper: {
    width: "25%",
    padding: 4,
  },
  pressableBase: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  pressableSelected: {
    borderColor: '#FFCC00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  pressablePressed: {
    transform: [{ scale: 0.92 }],
  },
  selectedPreview: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#FFCC00',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  highlightedClubBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightedClubText: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#FFCC00',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  tapToChange: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  greenHeader: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFCC00",
    marginBottom: 12,
    textAlign: "center",
  },
  inputLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#fff",
    color: "black",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
  },
  noteSection: {
    marginBottom: 20,
  },
  clockHeader: {
    fontSize: 24,
    color: "#00FF00",
    fontWeight: "800" as const,
    marginBottom: 12,
    textAlign: "center",
  },
});
