import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Flag, Plus, X } from 'lucide-react-native';

interface BattleScreenProps {
  onBack: () => void;
}

const ROUNDS_OPTIONS = [1, 2, 3, 4, 5];
const SHOTS_OPTIONS = [5, 10, 15, 20, 25, 30];

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function BattleScreen({ onBack }: BattleScreenProps) {
  const insets = useSafeAreaInsets();
  const [battleName, setBattleName] = useState('');
  const [selectedRounds, setSelectedRounds] = useState(3);
  const [selectedShots, setSelectedShots] = useState(10);
  const [showSensorModal, setShowSensorModal] = useState(false);

  const totalShots = selectedRounds * selectedShots;

  const handleStartBattle = () => {
    setShowSensorModal(true);
  };

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backCircle}>
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Battle</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleRow}>
            <View style={styles.titleTextBlock}>
              <Text style={styles.pageTitle}>Battle Settings</Text>
              <Text style={styles.pageSubtitle}>Set up a head-to-head challenge</Text>
            </View>
            <TouchableOpacity style={styles.setPinButton} activeOpacity={0.7}>
              <Flag size={16} color="#FFFFFF" />
              <Text style={styles.setPinText}>Set Pin</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <View style={styles.nameInputBlock}>
              <Text style={styles.sectionLabel}>BATTLE NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Iron Showdown"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={battleName}
                  onChangeText={setBattleName}
                  returnKeyType="done"
                />
              </View>
            </View>
            <View style={styles.challengerBlock}>
              <Text style={styles.sectionLabel}>CHALLENGER</Text>
              <TouchableOpacity style={styles.addChallengerBtn} activeOpacity={0.7}>
                <Plus size={18} color="#C0392B" />
                <Text style={styles.addChallengerText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>ROUNDS</Text>
          <View style={styles.optionRow}>
            {ROUNDS_OPTIONS.map((val) => {
              const isSelected = selectedRounds === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionChip, isSelected && styles.optionChipSelectedRed]}
                  onPress={() => setSelectedRounds(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>TOTAL SHOTS</Text>
          <View style={styles.optionRow}>
            {SHOTS_OPTIONS.map((val) => {
              const isSelected = selectedShots === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionChip, isSelected && styles.optionChipSelectedRed]}
                  onPress={() => setSelectedShots(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryInner}>
                <Text style={styles.summaryLabel}>SUMMARY</Text>
                <Text style={styles.summaryText}>
                  {selectedRounds} rounds x {selectedShots} shots = {totalShots} total shots per player
                </Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handleStartBattle}
            activeOpacity={0.8}
          >
            <View style={styles.startButtonOuter}>
              <LinearGradient
                colors={['#C0392B', '#A93226']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Start Battle</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSensorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSensorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sensors Required</Text>
            <Text style={styles.modalMessage}>
              This feature requires sensors to be connected.{'\n'}Coming Soon!
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSensorModal(false)}
              activeOpacity={0.8}
            >
              <View style={styles.modalCloseInner}>
                <X size={18} color="#FFFFFF" />
                <Text style={styles.modalCloseText}>Close</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {},
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  titleTextBlock: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  setPinButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  setPinText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 8,
  },
  nameInputBlock: {
    flex: 1,
  },
  challengerBlock: {
    width: 120,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 24,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addChallengerBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 6,
    borderWidth: 2,
    borderColor: '#C0392B',
    borderStyle: 'dashed' as const,
  },
  addChallengerText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#C0392B',
  },
  optionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionChipSelectedRed: {
    backgroundColor: '#C0392B',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginTop: 28,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  summaryGradient: {
    borderRadius: 16,
  },
  summaryInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    padding: 18,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  startButtonOuter: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  startButton: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#555',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalCloseButton: {
    width: '100%',
    backgroundColor: '#C0392B',
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  modalCloseInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 15,
    gap: 8,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
