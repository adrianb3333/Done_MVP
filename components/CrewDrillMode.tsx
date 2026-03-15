import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronLeft, ChevronRight, Users, Trophy, X, Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSession, CrewSessionData } from '@/contexts/SessionContext';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileScreen from '@/app/(tabs)/profile';


interface CrewDrillModeProps {
  session: CrewSessionData;
}

interface PlayerScore {
  oderId: string;
  odName: string;
  odAvatar: string | null;
  scores: number[];
  totalScore: number;
}

export default function CrewDrillMode({ session }: CrewDrillModeProps) {
  const insets = useSafeAreaInsets();
  const { endCrewSession } = useSession();
  const { allUsers, userId, crewColor } = useProfile();
  const _bgColor = crewColor || '#1A1A1A';

  const totalRounds = session.drillRounds ?? 3;
  const shotsPerRound = session.drillShotsPerRound ?? 10;
  const totalShots = session.drillTotalShots ?? totalRounds * shotsPerRound;
  const acceptedDistances = session.drillAcceptedDistances ?? [];

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [scores, setScores] = useState<number[]>(Array(totalRounds).fill(0));
  const [inputValue, setInputValue] = useState<string>('');
  const [flight, setFlight] = useState<string>('Normal');
  const [position, setPosition] = useState<string>('Center');
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showMinimized, setShowMinimized] = useState<boolean>(false);
  const [_isFinished, setIsFinished] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const myTotalScore = scores.reduce((a, b) => a + b, 0);

  const crewScores = useMemo<PlayerScore[]>(() => {
    const participants = session.participants ?? [];
    return participants.map((pid) => {
      const user = allUsers.find((u) => u.id === pid);
      const isMe = pid === userId;
      return {
        oderId: pid,
        odName: isMe ? 'You' : (user?.display_name || user?.username || 'Player'),
        odAvatar: user?.avatar_url || null,
        scores: isMe ? scores : Array(totalRounds).fill(Math.floor(Math.random() * shotsPerRound)),
        totalScore: isMe ? myTotalScore : Math.floor(Math.random() * totalShots),
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [session.participants, allUsers, userId, scores, myTotalScore, totalRounds, shotsPerRound, totalShots]);

  const top3 = useMemo(() => crewScores.slice(0, 3), [crewScores]);

  const handleScoreInput = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setInputValue(value);
  }, []);

  const handleConfirmScore = useCallback(() => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScores((prev) => {
      const updated = [...prev];
      updated[currentRound - 1] = num;
      return updated;
    });
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
      setInputValue('');
    } else {
      setIsFinished(true);
      setShowSummary(true);
    }
  }, [inputValue, currentRound, totalRounds]);

  const handleNextRound = useCallback(() => {
    if (currentRound < totalRounds) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentRound(currentRound + 1);
      setInputValue('');
    }
  }, [currentRound, totalRounds]);

  const handlePrevRound = useCallback(() => {
    if (currentRound > 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentRound(currentRound - 1);
      setInputValue(scores[currentRound - 2]?.toString() || '');
    }
  }, [currentRound, scores]);

  const handleMinimize = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMinimized(true);
  }, []);

  const handleQuit = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    endCrewSession();
  }, [endCrewSession]);

  const handleFinish = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endCrewSession();
  }, [endCrewSession]);

  if (showMinimized) {
    return (
      <View style={styles.minimizedContainer}>
        <View style={styles.profileContainer}>
          <ProfileScreen />
        </View>
        <View style={[styles.miniModal, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
            style={styles.miniModalGradient}
          >
            <View style={styles.miniModalContent}>
              <View style={styles.miniModalInfo}>
                <Text style={styles.miniModalLabel}>Crew Drill</Text>
                <Text style={styles.miniModalName} numberOfLines={1}>{session.eventName}</Text>
                <Text style={styles.miniModalProgress}>
                  Round {currentRound}/{totalRounds} · Score: {myTotalScore}
                </Text>
              </View>
              <View style={styles.miniModalButtons}>
                <TouchableOpacity
                  style={styles.miniResumeBtn}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowMinimized(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.miniResumeBtnText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniQuitBtn}
                  onPress={handleQuit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.miniQuitBtnText}>Quit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (showSummary) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.summaryHeaderTitle}>Drill Summary</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryScoreCard}>
            <Text style={styles.summaryScoreLabel}>Your Score</Text>
            <Text style={styles.summaryScoreValue}>{myTotalScore}</Text>
            <Text style={styles.summaryScoreSub}>
              {totalRounds} rounds · {shotsPerRound} shots/round
            </Text>
          </View>

          <View style={styles.summaryRoundsCard}>
            <Text style={styles.summaryRoundsTitle}>Round Breakdown</Text>
            {scores.map((score, idx) => (
              <View key={idx} style={styles.summaryRoundRow}>
                <Text style={styles.summaryRoundLabel}>Round {idx + 1}</Text>
                {acceptedDistances[idx] ? (
                  <Text style={styles.summaryRoundDist}>{acceptedDistances[idx]}m</Text>
                ) : null}
                <Text style={styles.summaryRoundScore}>{score}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryTop3Card}>
            <View style={styles.summaryTop3Header}>
              <Trophy size={18} color="#FFD700" />
              <Text style={styles.summaryTop3Title}>Top 3 Crew</Text>
            </View>
            {top3.map((player, idx) => (
              <View key={player.oderId} style={styles.summaryTop3Row}>
                <View style={[styles.summaryRankBadge, idx === 0 && { backgroundColor: '#FFD700' }, idx === 1 && { backgroundColor: '#C0C0C0' }, idx === 2 && { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.summaryRankText}>{idx + 1}</Text>
                </View>
                {player.odAvatar ? (
                  <Image source={{ uri: player.odAvatar }} style={styles.summaryPlayerAvatar} />
                ) : (
                  <View style={styles.summaryPlayerAvatarPlaceholder}>
                    <Text style={styles.summaryPlayerInitial}>
                      {player.odName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.summaryPlayerName} numberOfLines={1}>{player.odName}</Text>
                <Text style={styles.summaryPlayerScore}>{player.totalScore}</Text>
              </View>
            ))}
            {top3.length > 0 && (
              <View style={styles.summaryWinnerRow}>
                <Trophy size={14} color="#FFD700" />
                <Text style={styles.summaryWinnerText}>Winner: {top3[0].odName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={0.8}
            style={styles.finishBtnOuter}
          >
            <LinearGradient
              colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finishBtn}
            >
              <Text style={styles.finishBtnText}>Finish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleMinimize} style={styles.minimizeBtn}>
          <ChevronDown size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEventName} numberOfLines={1}>{session.eventName}</Text>
          <Text style={styles.headerCategory}>{session.drillCategory ?? 'Drill'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentRound / totalRounds) * 100}%` }]} />
      </View>

      <View style={styles.mainContent}>
        <View style={styles.roundNav}>
          <TouchableOpacity onPress={handlePrevRound} disabled={currentRound <= 1} style={[styles.roundNavBtn, currentRound <= 1 && { opacity: 0.3 }]}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.roundInfo}>
            <Text style={styles.roundLabel}>Round {currentRound}</Text>
            <Text style={styles.roundSub}>of {totalRounds}</Text>
          </View>
          <TouchableOpacity onPress={handleNextRound} disabled={currentRound >= totalRounds} style={[styles.roundNavBtn, currentRound >= totalRounds && { opacity: 0.3 }]}>
            <ChevronRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {acceptedDistances[currentRound - 1] > 0 && (
          <View style={styles.distanceBadge}>
            <Navigation size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.distanceText}>{acceptedDistances[currentRound - 1]}m</Text>
          </View>
        )}

        <View style={styles.scoreInputSection}>
          <Text style={styles.scoreInputLabel}>Enter Score</Text>
          <View style={styles.scoreInputWrapper}>
            <TextInput
              style={styles.scoreInput}
              value={inputValue}
              onChangeText={handleScoreInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              textAlign="center"
              returnKeyType="done"
              onSubmitEditing={handleConfirmScore}
            />
          </View>
          <Text style={styles.scoreInputHint}>out of {shotsPerRound} shots</Text>
        </View>

        <TouchableOpacity
          onPress={handleConfirmScore}
          activeOpacity={0.8}
          style={[styles.confirmBtnOuter, { opacity: inputValue ? 1 : 0.4 }]}
          disabled={!inputValue}
        >
          <LinearGradient
            colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmBtnText}>
              {currentRound < totalRounds ? 'Next Round' : 'Finish Drill'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.currentScoresRow}>
          {scores.map((s, idx) => (
            <View key={idx} style={[styles.scoreChip, idx === currentRound - 1 && styles.scoreChipActive]}>
              <Text style={[styles.scoreChipText, idx === currentRound - 1 && styles.scoreChipTextActive]}>
                {idx < currentRound ? s : '-'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomCorner}>
          <Text style={styles.bottomCornerLabel}>Flight</Text>
          <TouchableOpacity
            style={styles.bottomCornerBtn}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const flights = ['Low', 'Normal', 'High'];
              const idx = flights.indexOf(flight);
              setFlight(flights[(idx + 1) % flights.length]);
            }}
          >
            <Text style={styles.bottomCornerValue}>{flight}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.vsCrewBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowLeaderboard(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.vsCrewInner}>
            <Users size={16} color="#FFFFFF" />
            <Text style={styles.vsCrewText}>VS Crew</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomCorner}>
          <Text style={styles.bottomCornerLabel}>Position</Text>
          <TouchableOpacity
            style={styles.bottomCornerBtn}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const positions = ['Center', 'Left', 'Right'];
              const idx = positions.indexOf(position);
              setPosition(positions[(idx + 1) % positions.length]);
            }}
          >
            <Text style={styles.bottomCornerValue}>{position}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showLeaderboard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.leaderboardOverlay}>
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <View style={styles.leaderboardHeaderLeft}>
                <Trophy size={18} color="#FFD700" />
                <Text style={styles.leaderboardTitle}>Crew Leaderboard</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.leaderboardList}>
              {crewScores.map((player, idx) => (
                <View key={player.oderId} style={[styles.leaderboardRow, idx === 0 && { backgroundColor: 'rgba(255,215,0,0.08)' }]}>
                  <Text style={[styles.leaderboardRank, idx === 0 && { color: '#FFD700' }]}>#{idx + 1}</Text>
                  {player.odAvatar ? (
                    <Image source={{ uri: player.odAvatar }} style={styles.leaderboardAvatar} />
                  ) : (
                    <View style={styles.leaderboardAvatarPlaceholder}>
                      <Text style={styles.leaderboardAvatarInitial}>
                        {player.odName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.leaderboardName} numberOfLines={1}>{player.odName}</Text>
                  <Text style={[styles.leaderboardScore, idx === 0 && { color: '#FFD700' }]}>{player.totalScore}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  minimizedContainer: {
    flex: 1,
  },
  profileContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  minimizeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    alignItems: 'center' as const,
  },
  headerEventName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center' as const,
  },
  roundNav: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 24,
    marginBottom: 20,
  },
  roundNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roundInfo: {
    alignItems: 'center' as const,
  },
  roundLabel: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  roundSub: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  distanceBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  scoreInputSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  scoreInputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  scoreInputWrapper: {
    width: 120,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scoreInput: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    width: '100%' as const,
    textAlign: 'center' as const,
    padding: 0,
  },
  scoreInputHint: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  confirmBtnOuter: {
    width: '100%' as const,
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 24,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  currentScoresRow: {
    flexDirection: 'row' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
  },
  scoreChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scoreChipActive: {
    backgroundColor: 'rgba(52,199,89,0.2)',
    borderWidth: 1.5,
    borderColor: '#34C759',
  },
  scoreChipText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  scoreChipTextActive: {
    color: '#34C759',
  },
  bottomBar: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomCorner: {
    alignItems: 'center' as const,
    gap: 4,
  },
  bottomCornerLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bottomCornerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bottomCornerValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  vsCrewBtn: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  vsCrewInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  vsCrewText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  leaderboardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end' as const,
  },
  leaderboardCard: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%' as any,
    paddingBottom: 40,
  },
  leaderboardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leaderboardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  leaderboardList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  leaderboardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
    width: 32,
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  leaderboardAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  leaderboardAvatarInitial: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  leaderboardScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  miniModal: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  },
  miniModalGradient: {
    marginHorizontal: 12,
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  miniModalContent: {
    padding: 18,
    gap: 14,
  },
  miniModalInfo: {},
  miniModalLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  miniModalName: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  miniModalProgress: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  miniModalButtons: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  miniResumeBtn: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  miniResumeBtnText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  miniQuitBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,59,48,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  miniQuitBtnText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FF3B30',
  },
  scrollView: {
    flex: 1,
  },
  summaryContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  summaryHeaderTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    flex: 1,
  },
  summaryScoreCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  summaryScoreLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  summaryScoreValue: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  summaryScoreSub: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  summaryRoundsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  summaryRoundsTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryRoundRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  summaryRoundLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  summaryRoundDist: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.3)',
  },
  summaryRoundScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summaryTop3Card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  summaryTop3Header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  summaryTop3Title: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summaryTop3Row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    gap: 10,
  },
  summaryRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  summaryRankText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#0A0A0A',
  },
  summaryPlayerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  summaryPlayerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  summaryPlayerInitial: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  summaryPlayerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  summaryPlayerScore: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summaryWinnerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  summaryWinnerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  finishBtnOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  finishBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  finishBtnText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
