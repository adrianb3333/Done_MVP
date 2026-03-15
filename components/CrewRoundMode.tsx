import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronLeft, ChevronRight, Trophy, X, Users, MapPin, Wind, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSession, CrewSessionData } from '@/contexts/SessionContext';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileScreen from '@/app/(tabs)/profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CrewRoundModeProps {
  session: CrewSessionData;
}

interface HoleScore {
  strokes: number;
  par: number;
}

interface PlayerStanding {
  playerId: string;
  name: string;
  avatar: string | null;
  totalStrokes: number;
  totalPar: number;
  relativeScore: number;
}

const TAB_KEYS = ['Score', 'GPS', 'Wind', 'Data'] as const;
type TabKey = typeof TAB_KEYS[number];

export default function CrewRoundMode({ session }: CrewRoundModeProps) {
  const insets = useSafeAreaInsets();
  const { endCrewSession } = useSession();
  const { allUsers, userId } = useProfile();

  const isRound = session.type === 'round';
  const totalHoles = session.holeOption === '9_first' || session.holeOption === '9_back' ? 9 : 18;
  const startHole = session.holeOption === '9_back' ? 10 : 1;

  const [activeTab, setActiveTab] = useState<TabKey>('Score');
  const [currentHole, setCurrentHole] = useState<number>(startHole);
  const [holeScores, setHoleScores] = useState<HoleScore[]>(
    Array.from({ length: totalHoles }, () => ({ strokes: 0, par: 4 }))
  );
  const [strokeInput, setStrokeInput] = useState<string>('');
  const [_showLeaderboard, _setShowLeaderboard] = useState<boolean>(false);
  const [showMinimized, setShowMinimized] = useState<boolean>(false);
  const [_isFinished, setIsFinished] = useState<boolean>(false);
  const [showWaitingModal, setShowWaitingModal] = useState<boolean>(false);
  const [allPlayersFinished, setAllPlayersFinished] = useState<boolean>(false);
  const [showFinalSummary, setShowFinalSummary] = useState<boolean>(false);
  const [scoreSegment, setScoreSegment] = useState<'Score' | 'Leaderboard'>('Score');
  const [showDataPlayerPicker, setShowDataPlayerPicker] = useState<boolean>(false);
  const [selectedDataPlayer, setSelectedDataPlayer] = useState<string | null>(null);

  const tabAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = (SCREEN_WIDTH - 32) / TAB_KEYS.length;

  const handleTabChange = useCallback((tab: TabKey) => {
    const idx = TAB_KEYS.indexOf(tab);
    Animated.spring(tabAnim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    setActiveTab(tab);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [tabAnim]);

  const tabTranslateX = tabAnim.interpolate({
    inputRange: TAB_KEYS.map((_, i) => i),
    outputRange: TAB_KEYS.map((_, i) => i * tabWidth),
  });

  const holeIndex = currentHole - startHole;

  const myTotalStrokes = holeScores.reduce((a, b) => a + b.strokes, 0);
  const myTotalPar = holeScores.reduce((a, b) => a + b.par, 0);
  const myRelative = myTotalStrokes - myTotalPar;

  const crewStandings = useMemo<PlayerStanding[]>(() => {
    const participants = session.participants ?? [];
    return participants.map((pid) => {
      const user = allUsers.find((u) => u.id === pid);
      const isMe = pid === userId;
      const totalStrokes = isMe ? myTotalStrokes : Math.floor(Math.random() * totalHoles * 5) + totalHoles * 3;
      const totalPar = totalHoles * 4;
      return {
        playerId: pid,
        name: isMe ? 'You' : (user?.display_name || user?.username || 'Player'),
        avatar: user?.avatar_url || null,
        totalStrokes,
        totalPar,
        relativeScore: totalStrokes - totalPar,
      };
    }).sort((a, b) => a.relativeScore - b.relativeScore);
  }, [session.participants, allUsers, userId, myTotalStrokes, totalHoles]);

  const handleStrokeConfirm = useCallback(() => {
    const num = parseInt(strokeInput, 10);
    if (isNaN(num) || num < 1) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHoleScores((prev) => {
      const updated = [...prev];
      updated[holeIndex] = { ...updated[holeIndex], strokes: num };
      return updated;
    });
    if (currentHole < startHole + totalHoles - 1) {
      setCurrentHole(currentHole + 1);
      setStrokeInput('');
    } else {
      setIsFinished(true);
      setShowWaitingModal(true);
      setTimeout(() => {
        setAllPlayersFinished(true);
      }, 3000);
    }
  }, [strokeInput, holeIndex, currentHole, startHole, totalHoles]);

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

  const formatRelative = (rel: number) => {
    if (rel === 0) return 'E';
    return rel > 0 ? `+${rel}` : `${rel}`;
  };

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
                <Text style={styles.miniModalLabel}>Crew {isRound ? 'Round' : 'Tournament'}</Text>
                <Text style={styles.miniModalName} numberOfLines={1}>{session.eventName}</Text>
                <Text style={styles.miniModalProgress}>
                  Hole {currentHole} · {formatRelative(myRelative)} ({myTotalStrokes})
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

  if (showFinalSummary) {
    const winner = crewStandings[0];
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.summaryTitle}>Final Results</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryScoreCard}>
            <Text style={styles.summaryScoreLabel}>Your Round</Text>
            <Text style={styles.summaryScoreValue}>{formatRelative(myRelative)}</Text>
            <Text style={styles.summaryScoreSub}>
              {myTotalStrokes} strokes · {totalHoles} holes
            </Text>
          </View>

          {session.courseName ? (
            <View style={styles.summaryInfoRow}>
              <MapPin size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.summaryInfoText}>{session.courseName}</Text>
            </View>
          ) : null}

          <View style={styles.summaryStandingsCard}>
            <View style={styles.summaryStandingsHeader}>
              <Trophy size={18} color="#FFD700" />
              <Text style={styles.summaryStandingsTitle}>
                {winner?.name === 'You' ? 'You Win!' : `Winner: ${winner?.name}`}
              </Text>
            </View>
            {crewStandings.map((player, idx) => (
              <View key={player.playerId} style={[styles.standingRow, idx === 0 && { backgroundColor: 'rgba(255,215,0,0.06)' }]}>
                <View style={[
                  styles.standingRankBadge,
                  idx === 0 && { backgroundColor: '#FFD700' },
                  idx === 1 && { backgroundColor: '#C0C0C0' },
                  idx === 2 && { backgroundColor: '#CD7F32' },
                ]}>
                  <Text style={[styles.standingRankText, idx < 3 && { color: '#0A0A0A' }]}>{idx + 1}</Text>
                </View>
                {player.avatar ? (
                  <Image source={{ uri: player.avatar }} style={styles.standingAvatar} />
                ) : (
                  <View style={styles.standingAvatarPlaceholder}>
                    <Text style={styles.standingAvatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.standingName} numberOfLines={1}>{player.name}</Text>
                <View style={styles.standingScoreCol}>
                  <Text style={[styles.standingRelative, player.relativeScore <= 0 && { color: '#34C759' }]}>
                    {formatRelative(player.relativeScore)}
                  </Text>
                  <Text style={styles.standingStrokes}>{player.totalStrokes}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleFinish} activeOpacity={0.8} style={styles.finishBtnOuter}>
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

  if (showWaitingModal) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.waitingTitle}>Round Complete</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryScoreCard}>
            <Text style={styles.summaryScoreLabel}>Your Score</Text>
            <Text style={styles.summaryScoreValue}>{formatRelative(myRelative)}</Text>
            <Text style={styles.summaryScoreSub}>{myTotalStrokes} strokes</Text>
          </View>

          <View style={styles.waitingCard}>
            {allPlayersFinished ? (
              <TouchableOpacity
                style={styles.waitingCheckBtn}
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowWaitingModal(false);
                  setShowFinalSummary(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.waitingCheckCircle}>
                  <Check size={32} color="#34C759" strokeWidth={3} />
                </View>
                <Text style={styles.waitingCheckText}>All players finished!</Text>
                <Text style={styles.waitingCheckSub}>Tap to see final results</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingPending}>
                <Text style={styles.waitingPendingText}>Waiting for other players...</Text>
                <Text style={styles.waitingPendingSub}>Your round data has been saved</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderScoreTab = () => {
    return (
      <View style={styles.scoreTabContent}>
        <View style={styles.scoreSegmentRow}>
          <TouchableOpacity
            style={[styles.scoreSegmentBtn, scoreSegment === 'Score' && styles.scoreSegmentBtnActive]}
            onPress={() => setScoreSegment('Score')}
          >
            <Text style={[styles.scoreSegmentText, scoreSegment === 'Score' && styles.scoreSegmentTextActive]}>Score</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scoreSegmentBtn, scoreSegment === 'Leaderboard' && styles.scoreSegmentBtnActive]}
            onPress={() => setScoreSegment('Leaderboard')}
          >
            <Text style={[styles.scoreSegmentText, scoreSegment === 'Leaderboard' && styles.scoreSegmentTextActive]}>Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {scoreSegment === 'Score' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scoreScrollContent}>
            <View style={styles.holeNav}>
              <TouchableOpacity
                onPress={() => { if (currentHole > startHole) { setCurrentHole(currentHole - 1); setStrokeInput(''); } }}
                disabled={currentHole <= startHole}
                style={[styles.holeNavBtn, currentHole <= startHole && { opacity: 0.3 }]}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.holeInfo}>
                <Text style={styles.holeNumber}>Hole {currentHole}</Text>
                <Text style={styles.holePar}>Par {holeScores[holeIndex]?.par ?? 4}</Text>
              </View>
              <TouchableOpacity
                onPress={() => { if (currentHole < startHole + totalHoles - 1) { setCurrentHole(currentHole + 1); setStrokeInput(''); } }}
                disabled={currentHole >= startHole + totalHoles - 1}
                style={[styles.holeNavBtn, currentHole >= startHole + totalHoles - 1 && { opacity: 0.3 }]}
              >
                <ChevronRight size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.strokeInputSection}>
              <Text style={styles.strokeInputLabel}>Strokes</Text>
              <View style={styles.strokeInputWrapper}>
                <TextInput
                  style={styles.strokeInput}
                  value={strokeInput}
                  onChangeText={setStrokeInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  textAlign="center"
                  onSubmitEditing={handleStrokeConfirm}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleStrokeConfirm}
              activeOpacity={0.8}
              style={[styles.nextHoleBtn, { opacity: strokeInput ? 1 : 0.4 }]}
              disabled={!strokeInput}
            >
              <LinearGradient
                colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextHoleBtnGrad}
              >
                <Text style={styles.nextHoleBtnText}>
                  {currentHole < startHole + totalHoles - 1 ? 'Next Hole' : 'Finish Round'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.scoreSummaryRow}>
              <View style={styles.scoreSummaryItem}>
                <Text style={styles.scoreSummaryLabel}>Total</Text>
                <Text style={styles.scoreSummaryValue}>{myTotalStrokes}</Text>
              </View>
              <View style={styles.scoreSummaryItem}>
                <Text style={styles.scoreSummaryLabel}>Relative</Text>
                <Text style={[styles.scoreSummaryValue, myRelative <= 0 && { color: '#34C759' }]}>
                  {formatRelative(myRelative)}
                </Text>
              </View>
              <View style={styles.scoreSummaryItem}>
                <Text style={styles.scoreSummaryLabel}>Holes</Text>
                <Text style={styles.scoreSummaryValue}>
                  {holeScores.filter((h) => h.strokes > 0).length}/{totalHoles}
                </Text>
              </View>
            </View>

            <View style={styles.miniScorecard}>
              {holeScores.map((hole, idx) => {
                const holeNum = startHole + idx;
                const isActive = holeNum === currentHole;
                const hasScore = hole.strokes > 0;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.miniHoleCell,
                      isActive && styles.miniHoleCellActive,
                      hasScore && styles.miniHoleCellFilled,
                    ]}
                    onPress={() => { setCurrentHole(holeNum); setStrokeInput(hole.strokes > 0 ? hole.strokes.toString() : ''); }}
                  >
                    <Text style={[styles.miniHoleNum, isActive && { color: '#34C759' }]}>{holeNum}</Text>
                    <Text style={[styles.miniHoleScore, hasScore && { color: '#FFFFFF' }]}>
                      {hasScore ? hole.strokes : '-'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.leaderboardContent}>
            {crewStandings.map((player, idx) => (
              <View key={player.playerId} style={[styles.leaderboardRow, idx === 0 && { backgroundColor: 'rgba(255,215,0,0.06)' }]}>
                <Text style={[styles.leaderboardRank, idx === 0 && { color: '#FFD700' }]}>#{idx + 1}</Text>
                {player.avatar ? (
                  <Image source={{ uri: player.avatar }} style={styles.leaderboardAvatar} />
                ) : (
                  <View style={styles.leaderboardAvatarPlaceholder}>
                    <Text style={styles.leaderboardInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.leaderboardName} numberOfLines={1}>{player.name}</Text>
                <View style={styles.leaderboardScoreCol}>
                  <Text style={[styles.leaderboardRelative, player.relativeScore <= 0 && { color: '#34C759' }]}>
                    {formatRelative(player.relativeScore)}
                  </Text>
                  <Text style={styles.leaderboardStrokes}>{player.totalStrokes}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderDataTab = () => {
    const displayPlayer = selectedDataPlayer
      ? allUsers.find((u) => u.id === selectedDataPlayer)
      : null;
    const displayName = displayPlayer ? (displayPlayer.display_name || displayPlayer.username) : 'You';

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dataContent}>
        <View style={styles.dataStrokesGainedCard}>
          <Text style={styles.dataCardTitle}>Strokes Gained</Text>
          <View style={styles.dataStrokesRow}>
            <View style={styles.dataStrokesItem}>
              <Text style={styles.dataStrokesLabel}>Tee</Text>
              <Text style={styles.dataStrokesValue}>+0.3</Text>
            </View>
            <View style={styles.dataStrokesItem}>
              <Text style={styles.dataStrokesLabel}>Approach</Text>
              <Text style={styles.dataStrokesValue}>-0.5</Text>
            </View>
            <View style={styles.dataStrokesItem}>
              <Text style={styles.dataStrokesLabel}>Short</Text>
              <Text style={styles.dataStrokesValue}>+0.1</Text>
            </View>
            <View style={styles.dataStrokesItem}>
              <Text style={styles.dataStrokesLabel}>Putting</Text>
              <Text style={styles.dataStrokesValue}>-0.2</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dataPlayerPickerBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowDataPlayerPicker(true);
          }}
          activeOpacity={0.7}
        >
          <Users size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.dataPlayerPickerText}>
            Viewing: {displayName}
          </Text>
          <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        <View style={styles.dataAdvancedCard}>
          <Text style={styles.dataCardTitle}>Advanced Data</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataRowLabel}>Fairways Hit</Text>
            <Text style={styles.dataRowValue}>8/14</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataRowLabel}>GIR</Text>
            <Text style={styles.dataRowValue}>10/18</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataRowLabel}>Putts</Text>
            <Text style={styles.dataRowValue}>32</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataRowLabel}>Avg Drive</Text>
            <Text style={styles.dataRowValue}>245 yd</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderGPSTab = () => (
    <View style={styles.emptyTab}>
      <Text style={styles.emptyTabEmoji}>🗺️</Text>
      <Text style={styles.emptyTabTitle}>GPS</Text>
      <Text style={styles.emptyTabSub}>Course GPS data will appear here</Text>
    </View>
  );

  const renderWindTab = () => (
    <View style={styles.emptyTab}>
      <Wind size={32} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyTabTitle}>Wind</Text>
      <Text style={styles.emptyTabSub}>Wind conditions and adjustments</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleMinimize} style={styles.minimizeBtn}>
          <ChevronDown size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEventName} numberOfLines={1}>{session.eventName}</Text>
          {session.courseName ? (
            <Text style={styles.headerCourseName} numberOfLines={1}>{session.courseName}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <View style={styles.tabRow}>
          {TAB_KEYS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, { width: tabWidth }]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View
          style={[styles.tabUnderline, { width: tabWidth - 16, marginLeft: 8, transform: [{ translateX: tabTranslateX }] }]}
        />
      </View>

      <View style={styles.mainContent}>
        {activeTab === 'Score' && renderScoreTab()}
        {activeTab === 'GPS' && renderGPSTab()}
        {activeTab === 'Wind' && renderWindTab()}
        {activeTab === 'Data' && renderDataTab()}
      </View>

      <Modal
        visible={showDataPlayerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDataPlayerPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Player</Text>
              <TouchableOpacity onPress={() => setShowDataPlayerPicker(false)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.pickerRow, !selectedDataPlayer && styles.pickerRowActive]}
                onPress={() => { setSelectedDataPlayer(null); setShowDataPlayerPicker(false); }}
              >
                <Text style={styles.pickerRowText}>You</Text>
                {!selectedDataPlayer && <Check size={18} color="#34C759" />}
              </TouchableOpacity>
              {(session.participants ?? []).filter((pid) => pid !== userId).map((pid) => {
                const user = allUsers.find((u) => u.id === pid);
                const name = user?.display_name || user?.username || 'Player';
                const isActive = selectedDataPlayer === pid;
                return (
                  <TouchableOpacity
                    key={pid}
                    style={[styles.pickerRow, isActive && styles.pickerRowActive]}
                    onPress={() => { setSelectedDataPlayer(pid); setShowDataPlayerPicker(false); }}
                  >
                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.pickerAvatar} />
                    ) : (
                      <View style={styles.pickerAvatarPlaceholder}>
                        <Text style={styles.pickerAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.pickerRowText}>{name}</Text>
                    {isActive && <Check size={18} color="#34C759" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  minimizedContainer: { flex: 1 },
  profileContainer: { flex: 1 },
  headerBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  minimizeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  headerCenter: { alignItems: 'center' as const },
  headerEventName: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  headerCourseName: { fontSize: 12, fontWeight: '600' as const, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  tabBar: { paddingHorizontal: 16, paddingBottom: 4 },
  tabRow: { flexDirection: 'row' as const },
  tabBtn: { paddingVertical: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: 'rgba(255,255,255,0.35)' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' as const },
  tabUnderline: { height: 3, backgroundColor: '#FFFFFF', borderRadius: 1.5 },
  mainContent: { flex: 1 },
  scoreTabContent: { flex: 1 },
  scoreSegmentRow: {
    flexDirection: 'row' as const, marginHorizontal: 20, marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 3,
  },
  scoreSegmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' as const },
  scoreSegmentBtnActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  scoreSegmentText: { fontSize: 13, fontWeight: '600' as const, color: 'rgba(255,255,255,0.4)' },
  scoreSegmentTextActive: { color: '#FFFFFF', fontWeight: '700' as const },
  scoreScrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  holeNav: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'center' as const, gap: 24, marginBottom: 20,
  },
  holeNavBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  holeInfo: { alignItems: 'center' as const },
  holeNumber: { fontSize: 28, fontWeight: '800' as const, color: '#FFFFFF' },
  holePar: { fontSize: 13, fontWeight: '600' as const, color: 'rgba(255,255,255,0.4)' },
  strokeInputSection: { alignItems: 'center' as const, marginBottom: 20 },
  strokeInputLabel: {
    fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)',
    marginBottom: 10, letterSpacing: 0.5,
  },
  strokeInputWrapper: {
    width: 100, height: 70, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  strokeInput: {
    fontSize: 32, fontWeight: '800' as const, color: '#FFFFFF',
    width: '100%' as const, textAlign: 'center' as const, padding: 0,
  },
  nextHoleBtn: { width: '100%' as const, borderRadius: 16, overflow: 'hidden' as const, marginBottom: 20 },
  nextHoleBtnGrad: { paddingVertical: 15, borderRadius: 16, alignItems: 'center' as const },
  nextHoleBtnText: { fontSize: 16, fontWeight: '800' as const, color: '#FFFFFF' },
  scoreSummaryRow: {
    flexDirection: 'row' as const, justifyContent: 'space-around' as const,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    paddingVertical: 14, marginBottom: 20,
  },
  scoreSummaryItem: { alignItems: 'center' as const },
  scoreSummaryLabel: { fontSize: 11, fontWeight: '600' as const, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  scoreSummaryValue: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF', marginTop: 2 },
  miniScorecard: {
    flexDirection: 'row' as const, flexWrap: 'wrap' as const,
    gap: 6, justifyContent: 'center' as const,
  },
  miniHoleCell: {
    width: 36, height: 48, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center' as const, justifyContent: 'center' as const, gap: 2,
  },
  miniHoleCellActive: { borderWidth: 1.5, borderColor: '#34C759' },
  miniHoleCellFilled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  miniHoleNum: { fontSize: 9, fontWeight: '600' as const, color: 'rgba(255,255,255,0.3)' },
  miniHoleScore: { fontSize: 14, fontWeight: '700' as const, color: 'rgba(255,255,255,0.3)' },
  leaderboardContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  leaderboardRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, gap: 10,
  },
  leaderboardRank: { fontSize: 15, fontWeight: '800' as const, color: 'rgba(255,255,255,0.5)', width: 30 },
  leaderboardAvatar: { width: 34, height: 34, borderRadius: 17 },
  leaderboardAvatarPlaceholder: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  leaderboardInitial: { fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  leaderboardName: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  leaderboardScoreCol: { alignItems: 'flex-end' as const },
  leaderboardRelative: { fontSize: 16, fontWeight: '800' as const, color: '#FF6B6B' },
  leaderboardStrokes: { fontSize: 11, fontWeight: '600' as const, color: 'rgba(255,255,255,0.35)' },
  dataContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  dataStrokesGainedCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12,
  },
  dataCardTitle: { fontSize: 15, fontWeight: '800' as const, color: '#FFFFFF', marginBottom: 14 },
  dataStrokesRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  dataStrokesItem: { alignItems: 'center' as const },
  dataStrokesLabel: { fontSize: 11, fontWeight: '600' as const, color: 'rgba(255,255,255,0.4)' },
  dataStrokesValue: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF', marginTop: 4 },
  dataPlayerPickerBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  dataPlayerPickerText: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  dataAdvancedCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18,
  },
  dataRow: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const,
    alignItems: 'center' as const, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dataRowLabel: { fontSize: 14, fontWeight: '600' as const, color: 'rgba(255,255,255,0.5)' },
  dataRowValue: { fontSize: 16, fontWeight: '800' as const, color: '#FFFFFF' },
  emptyTab: {
    flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const,
    paddingBottom: 60,
  },
  emptyTabEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTabTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF', marginBottom: 6 },
  emptyTabSub: { fontSize: 14, fontWeight: '500' as const, color: 'rgba(255,255,255,0.4)' },
  miniModal: { position: 'absolute' as const, bottom: 0, left: 0, right: 0 },
  miniModalGradient: { marginHorizontal: 12, borderRadius: 20, overflow: 'hidden' as const },
  miniModalContent: { padding: 18, gap: 14 },
  miniModalInfo: {},
  miniModalLabel: {
    fontSize: 11, fontWeight: '700' as const, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const, letterSpacing: 0.8,
  },
  miniModalName: { fontSize: 17, fontWeight: '800' as const, color: '#FFFFFF', marginTop: 2 },
  miniModalProgress: { fontSize: 13, fontWeight: '600' as const, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  miniModalButtons: { flexDirection: 'row' as const, gap: 10 },
  miniResumeBtn: {
    flex: 1, backgroundColor: '#34C759', paddingVertical: 12,
    borderRadius: 12, alignItems: 'center' as const,
  },
  miniResumeBtnText: { fontSize: 15, fontWeight: '800' as const, color: '#FFFFFF' },
  miniQuitBtn: {
    flex: 1, backgroundColor: 'rgba(255,59,48,0.2)', paddingVertical: 12,
    borderRadius: 12, alignItems: 'center' as const,
  },
  miniQuitBtnText: { fontSize: 15, fontWeight: '800' as const, color: '#FF3B30' },
  scrollView: { flex: 1 },
  summaryContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },
  summaryTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF', textAlign: 'center' as const, flex: 1 },
  waitingTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF', textAlign: 'center' as const, flex: 1 },
  summaryScoreCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    padding: 28, alignItems: 'center' as const, marginBottom: 16,
  },
  summaryScoreLabel: {
    fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const, letterSpacing: 0.8,
  },
  summaryScoreValue: { fontSize: 48, fontWeight: '900' as const, color: '#FFFFFF', marginTop: 4 },
  summaryScoreSub: { fontSize: 13, fontWeight: '600' as const, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  summaryInfoRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    marginBottom: 16, paddingLeft: 4,
  },
  summaryInfoText: { fontSize: 14, fontWeight: '600' as const, color: 'rgba(255,255,255,0.5)' },
  summaryStandingsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 16,
  },
  summaryStandingsHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 14,
  },
  summaryStandingsTitle: { fontSize: 16, fontWeight: '800' as const, color: '#FFD700' },
  standingRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4, gap: 10,
  },
  standingRankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  standingRankText: { fontSize: 12, fontWeight: '800' as const, color: 'rgba(255,255,255,0.5)' },
  standingAvatar: { width: 32, height: 32, borderRadius: 16 },
  standingAvatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  standingAvatarInitial: { fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  standingName: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  standingScoreCol: { alignItems: 'flex-end' as const },
  standingRelative: { fontSize: 16, fontWeight: '800' as const, color: '#FF6B6B' },
  standingStrokes: { fontSize: 11, fontWeight: '600' as const, color: 'rgba(255,255,255,0.35)' },
  finishBtnOuter: { borderRadius: 16, overflow: 'hidden' as const },
  finishBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' as const },
  finishBtnText: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  waitingCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    padding: 28, alignItems: 'center' as const,
  },
  waitingCheckBtn: { alignItems: 'center' as const },
  waitingCheckCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(52,199,89,0.15)',
    alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 12,
  },
  waitingCheckText: { fontSize: 17, fontWeight: '800' as const, color: '#FFFFFF' },
  waitingCheckSub: { fontSize: 13, fontWeight: '600' as const, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  waitingPending: { alignItems: 'center' as const },
  waitingPendingText: { fontSize: 17, fontWeight: '700' as const, color: '#FFFFFF' },
  waitingPendingSub: { fontSize: 13, fontWeight: '500' as const, color: 'rgba(255,255,255,0.4)', marginTop: 6 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
  pickerCard: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%' as any, paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, paddingHorizontal: 20,
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  pickerRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 12, paddingHorizontal: 20, gap: 12,
  },
  pickerRowActive: { backgroundColor: 'rgba(52,199,89,0.08)' },
  pickerAvatar: { width: 32, height: 32, borderRadius: 16 },
  pickerAvatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  pickerAvatarInitial: { fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  pickerRowText: { flex: 1, fontSize: 15, fontWeight: '600' as const, color: '#FFFFFF' },
});
