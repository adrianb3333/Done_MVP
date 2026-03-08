import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { ChevronLeft, X, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOAL_STORAGE_KEY = 'coach_handicap_goal';

export default function RecapModal() {
  const insets = useSafeAreaInsets();
  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);
  const [handicapGoal, setHandicapGoal] = useState<string>('');
  const [savedGoal, setSavedGoal] = useState<string>('');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const goalInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentHandicap = 14.2;
  const yearStartHandicap = 16.8;
  const yearProgress = currentHandicap - yearStartHandicap;

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const stored = await AsyncStorage.getItem(GOAL_STORAGE_KEY);
        if (stored) {
          setSavedGoal(stored);
          setHandicapGoal(stored);
          console.log('[Coach] Loaded saved goal:', stored);
        }
      } catch (e: any) {
        console.log('[Coach] Error loading goal:', e.message);
      }
    };
    void loadGoal();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSaveGoal = async () => {
    if (handicapGoal.trim() === '') return;
    try {
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, handicapGoal);
      setSavedGoal(handicapGoal);
      setIsEditingGoal(false);
      console.log('[Coach] Saved goal:', handicapGoal);
    } catch (e: any) {
      console.log('[Coach] Error saving goal:', e.message);
    }
  };

  const openGoalModal = () => {
    console.log('[Coach] Opening goal modal');
    setGoalModalVisible(true);
  };

  const closeGoalModal = () => {
    setGoalModalVisible(false);
    setIsEditingGoal(false);
  };

  const canEditGoal = () => {
    if (!savedGoal) return true;
    const goalNum = parseFloat(savedGoal);
    return currentHandicap <= goalNum;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Coach</Text>
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <View style={styles.topRow}>
          <LinearGradient
            colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.handicapBox}
          >
            <Image
              source={require('@/assets/images/sgf-icon.png')}
              style={styles.sgfIcon}
              resizeMode="contain"
            />
            <View style={styles.handicapContent}>
              <View style={styles.handicapLeft}>
                <Text style={styles.handicapNumber}>{currentHandicap.toFixed(1)}</Text>
                <Text style={styles.handicapLabel}>Current Handicap</Text>
              </View>
              <View style={styles.handicapDivider} />
              <View style={styles.handicapRight}>
                <Text style={styles.progressNumber}>
                  {yearProgress > 0 ? '+' : ''}{yearProgress.toFixed(1)}
                </Text>
                <Text style={styles.handicapLabel}>Year Progress</Text>
              </View>
            </View>
          </LinearGradient>

          <TouchableOpacity onPress={openGoalModal} activeOpacity={0.8} style={styles.goalSquareWrap}>
            <LinearGradient
              colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.goalSquare}
            >
              {savedGoal ? (
                <>
                  <Text style={styles.goalSquareNumber}>{savedGoal}</Text>
                  <Target size={14} color="#D1F2DE" />
                </>
              ) : (
                <>
                  <Target size={22} color="#D1F2DE" />
                  <Text style={styles.goalSquareHint}>Goal</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeGoalModal}
      >
        <View style={styles.goalOverlay}>
          <LinearGradient
            colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.goalModal}
          >
            <TouchableOpacity onPress={closeGoalModal} style={styles.goalCloseBtn} activeOpacity={0.7}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.goalModalContent}>
              <Text style={styles.goalModalTitle}>Set Your Handicap Goal</Text>
              <Text style={styles.goalModalText}>
                Setting a handicap goal helps you stay focused and motivated throughout the season. 
                Track your progress and push yourself to reach the next level. 
                A clear target gives your practice purpose and makes every round count towards something bigger.
              </Text>

              {savedGoal && !canEditGoal() ? (
                <View style={styles.goalLockedSection}>
                  <Text style={styles.goalLockedText}>
                    Current goal: {savedGoal}
                  </Text>
                  <Text style={styles.goalLockedSubtext}>
                    Achieve your current goal to set a new one
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.goalBottomRow}>
              <Text style={styles.yearGoalLabel}>Year Goal</Text>
              {isEditingGoal || !savedGoal ? (
                <View style={styles.goalInputRow}>
                  <TextInput
                    ref={goalInputRef}
                    style={styles.goalInput}
                    value={handicapGoal}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9.]/g, '');
                      setHandicapGoal(filtered);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    maxLength={5}
                    autoFocus={isEditingGoal}
                  />
                  <TouchableOpacity
                    style={styles.goalSaveBtn}
                    onPress={handleSaveGoal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.goalSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.goalEditBtn}
                  onPress={() => {
                    if (canEditGoal()) {
                      setIsEditingGoal(true);
                    }
                  }}
                  activeOpacity={canEditGoal() ? 0.7 : 1}
                >
                  <Text style={styles.goalEditValue}>{savedGoal}</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  handicapBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    position: 'relative' as const,
    minHeight: 90,
    justifyContent: 'center' as const,
  },
  sgfIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute' as const,
    top: 12,
    right: 12,
  },
  handicapContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  handicapLeft: {
    flex: 1,
    alignItems: 'center' as const,
  },
  handicapNumber: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  handicapLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#D1F2DE',
    marginTop: 2,
  },
  handicapDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 12,
  },
  handicapRight: {
    flex: 1,
    alignItems: 'center' as const,
  },
  progressNumber: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  goalSquareWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  goalSquare: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 16,
    gap: 4,
  },
  goalSquareNumber: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  goalSquareHint: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#D1F2DE',
  },
  goalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  goalModal: {
    width: '100%' as const,
    borderRadius: 24,
    padding: 24,
    position: 'relative' as const,
    maxWidth: SCREEN_WIDTH - 60,
  },
  goalCloseBtn: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  goalModalContent: {
    marginTop: 36,
    marginBottom: 24,
  },
  goalModalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  goalModalText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#D1F2DE',
    lineHeight: 21,
  },
  goalLockedSection: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 14,
  },
  goalLockedText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  goalLockedSubtext: {
    fontSize: 12,
    color: '#D1F2DE',
    marginTop: 4,
  },
  goalBottomRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 12,
  },
  yearGoalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  goalInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  goalInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 70,
    textAlign: 'center' as const,
  },
  goalSaveBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  goalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#3A8E56',
  },
  goalEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  goalEditValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#3A8E56',
  },
});
