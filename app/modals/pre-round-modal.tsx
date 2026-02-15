import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useRef, useCallback } from "react";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";
import StatCard from "@/components/reusables/StatCard";
import { useUserData } from "@/hooks/useUserData";

export default function PreRoundModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updatePreRound } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const text = userData.preRound.routine;

  const handleChangeText = useCallback((next: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updatePreRound(next);
    }, 500);
  }, [updatePreRound]);

  const statData = [
    { header: "Mobility", text: "Loosen up your body" },
    { header: "Green Feel", text: "10-25 putts feeling the grass of the day" },
    { header: "Chipping", text: "10-35 to feel turf" },
    { header: "Wedges", text: "10-20 understand your distance" },
    { header: "Irons", text: "Vary distance and club" },
    { header: "Woods", text: "Feel your long shots" },
    { header: "Driver", text: "Get comfortable from the tee" },
    { header: "Tee- Shot", text: "Imagine the shot of First Tee" },
    { header: "Putting", text: "Go back and hits couple last puts" },
  ];

  return (
    <ImageBackground
      source={{
        uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2og1gfzbpfgrdjyzujhyg",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={28} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Pre Round</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>Create routines to perform better!</Text>

          <LiquidGlassCard>
            <TextInput
              defaultValue={text}
              onChangeText={handleChangeText}
              multiline
              textAlignVertical="top"
              placeholder="Write your pre-round routine..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
            />
          </LiquidGlassCard>

          {statData.map((item, index) => (
            <View key={index} style={styles.statSection}>
              <Text style={styles.statHeader}>
                {index + 1}: {item.header}
              </Text>
              <StatCard label="" value={item.text} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#020d12",
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
    gap: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 26,
    minHeight: 220,
    padding: 12,
  },
  statSection: {
    marginVertical: 12,
    gap: 6,
  },
  statHeader: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFD700",
    textAlign: "left",
    marginBottom: 6,
  },
});
