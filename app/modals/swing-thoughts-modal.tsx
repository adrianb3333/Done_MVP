import { StyleSheet, Text, View, ImageBackground, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import LiquidGlassCard from "@/components/reusables/LiquidGlassCard";
import { useUserData, NotesState, SwingThoughtsData } from "@/hooks/useUserData";

type SectionKey = keyof SwingThoughtsData;

export default function SwingThoughtsModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const handleClose = () => { if (onClose) { onClose(); } else { router.back(); } };
  const { userData, updateSwingThoughts } = useUserData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const swingThoughts = userData.swingThoughts;

  const handleNoteChange = useCallback((sectionKey: SectionKey, pointKey: keyof NotesState, value: string) => {
    const newThoughts = {
      ...swingThoughts,
      [sectionKey]: {
        ...swingThoughts[sectionKey],
        [pointKey]: value,
      },
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateSwingThoughts(newThoughts);
    }, 500);
  }, [swingThoughts, updateSwingThoughts]);

  const sections: { title: string; key: SectionKey }[] = [
    { title: 'Driver', key: 'driver' },
    { title: 'Woods', key: 'woods' },
    { title: 'Irons', key: 'irons' },
    { title: 'Wedges', key: 'wedges' },
    { title: 'Chipping', key: 'chipping' },
    { title: 'Bunker', key: 'bunker' },
    { title: 'Putter', key: 'putter' },
  ];

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vqjx3cv116u60ed7uf1v9' }}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden={true} />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFCC00" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View key={section.key} style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <LiquidGlassCard containerStyle={styles.cardContainer}>
                <View style={styles.noteSection}>
                  <Text style={styles.numberLabel}>1:</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={swingThoughts[section.key].point1}
                    onChangeText={(text) => handleNoteChange(section.key, 'point1', text)}
                    placeholder="Enter your thoughts..."
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.noteSection}>
                  <Text style={styles.numberLabel}>2:</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={swingThoughts[section.key].point2}
                    onChangeText={(text) => handleNoteChange(section.key, 'point2', text)}
                    placeholder="Enter your thoughts..."
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.noteSection}>
                  <Text style={styles.numberLabel}>3:</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={swingThoughts[section.key].point3}
                    onChangeText={(text) => handleNoteChange(section.key, 'point3', text)}
                    placeholder="Enter your thoughts..."
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </LiquidGlassCard>
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
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50, 
    paddingBottom: 10,
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFCC00',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardContainer: {
    marginBottom: 0,
  },
  noteSection: {
    marginBottom: 32,
  },
  numberLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    minHeight: 40,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
});
