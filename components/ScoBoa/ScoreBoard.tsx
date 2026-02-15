import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useScoring, PlayerRoundInfo } from '@/contexts/ScoringContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { HoleInfo, getToPar, MOCK_COURSE } from '@/mocks/courseData';

interface ScoreBoardProps {
  visible: boolean;
  onClose: () => void;
}

export default function ScoreBoard({ visible, onClose }: ScoreBoardProps) {
  const { scores, players, totalScore, totalPar, holesPlayed, courseName } = useScoring();
  const { profile } = useProfile();
  const { roundDate } = useSession();

  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const currentPlayerName = profile?.display_name || profile?.username || 'Spelare';
  const currentPlayerId = profile?.id || 'current';

  const allPlayers = useMemo(() => {
    const current: PlayerRoundInfo = { id: currentPlayerId, name: currentPlayerName, hcp: 9 };
    return [current, ...players];
  }, [currentPlayerId, currentPlayerName, players]);

  const front9 = useMemo(() => MOCK_COURSE.holes.filter((h) => h.number <= 9), []);
  const back9 = useMemo(() => MOCK_COURSE.holes.filter((h) => h.number >= 10), []);

  const front9Par = useMemo(() => front9.reduce((s, h) => s + h.par, 0), [front9]);
  const back9Par = useMemo(() => back9.reduce((s, h) => s + h.par, 0), [back9]);
  const fullPar = front9Par + back9Par;

  const getPlayerTotalScore = (playerId: string): number => {
    if (playerId === currentPlayerId) return totalScore;
    return 0;
  };

  const getPlayerHolesPlayed = (playerId: string): number => {
    if (playerId === currentPlayerId) return holesPlayed;
    return 0;
  };

  const getPlayerToPar = (playerId: string): string => {
    if (playerId === currentPlayerId) {
      return holesPlayed > 0 ? getToPar(totalScore, totalPar) : 'E';
    }
    return 'E';
  };

  const getHoleScore = (holeNum: number): number => {
    const s = scores.get(holeNum);
    return s?.score ?? 0;
  };

  const getHalfTotal = (halfHoles: HoleInfo[]): number => {
    return halfHoles.reduce((sum, h) => sum + getHoleScore(h.number), 0);
  };

  const toggleExpand = (playerId: string) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  const getScoreCellStyle = (score: number, par: number) => {
    if (score === 0) return {};
    const diff = score - par;
    if (diff <= -2) return { backgroundColor: '#ffb300' };
    if (diff === -1) return { backgroundColor: '#e53935' };
    if (diff === 0) return {};
    if (diff === 1) return { backgroundColor: '#1565c0' };
    if (diff >= 2) return { backgroundColor: '#1565c0' };
    return {};
  };

  const getScoreTextStyle = (score: number, par: number) => {
    if (score === 0) return {};
    const diff = score - par;
    if (diff <= -1) return { color: '#fff' };
    if (diff >= 1) return { color: '#fff' };
    return {};
  };

  const renderScorecard = (playerId: string) => {
    const isCurrentPlayer = playerId === currentPlayerId;
    if (!isCurrentPlayer) return null;

    const front9Total = getHalfTotal(front9);
    const back9Total = getHalfTotal(back9);

    return (
      <View style={styles.scorecardContainer}>
        <View style={styles.halfSection}>
          <View style={[styles.scorecardRow, styles.scorecardHeaderRow]}>
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCell, styles.labelCell]}>Hål</Text>
            {front9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.scorecardHeaderCell]}>{h.number}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCell, styles.totalCell]}>Ut</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Handicap</Text>
            {front9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>{h.index}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}> </Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Par</Text>
            {front9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>{h.par}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}>{front9Par}</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.boldCell]}>Resultat</Text>
            {front9.map((h) => {
              const s = getHoleScore(h.number);
              return (
                <View key={h.number} style={[styles.scoreCellWrap, getScoreCellStyle(s, h.par)]}>
                  <Text style={[styles.scorecardCell, styles.boldCell, getScoreTextStyle(s, h.par)]}>
                    {s > 0 ? s : ''}
                  </Text>
                </View>
              );
            })}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.boldCell]}>
              {front9Total > 0 ? front9Total : ''}
            </Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Net</Text>
            {front9.map((h) => {
              const s = getHoleScore(h.number);
              return (
                <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>
                  {s > 0 ? Math.max(0, s - 1) : ''}
                </Text>
              );
            })}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}>
              {front9Total > 0 ? Math.max(0, front9Total - front9.length) : ''}
            </Text>
          </View>
        </View>

        <View style={styles.halfSection}>
          <View style={[styles.scorecardRow, styles.scorecardHeaderRowBack]}>
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCellBack, styles.labelCell]}>Hål</Text>
            {back9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.scorecardHeaderCellBack]}>{h.number}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.scorecardHeaderCellBack, styles.totalCell]}>In</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Handicap</Text>
            {back9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>{h.index}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}> </Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Par</Text>
            {back9.map((h) => (
              <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>{h.par}</Text>
            ))}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}>{back9Par}</Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.boldCell]}>Resultat</Text>
            {back9.map((h) => {
              const s = getHoleScore(h.number);
              return (
                <View key={h.number} style={[styles.scoreCellWrap, getScoreCellStyle(s, h.par)]}>
                  <Text style={[styles.scorecardCell, styles.boldCell, getScoreTextStyle(s, h.par)]}>
                    {s > 0 ? s : ''}
                  </Text>
                </View>
              );
            })}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.boldCell]}>
              {back9Total > 0 ? back9Total : ''}
            </Text>
          </View>
          <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, styles.labelCell, styles.metaCell]}>Net</Text>
            {back9.map((h) => {
              const s = getHoleScore(h.number);
              return (
                <Text key={h.number} style={[styles.scorecardCell, styles.metaCell]}>
                  {s > 0 ? Math.max(0, s - 1) : ''}
                </Text>
              );
            })}
            <Text style={[styles.scorecardCell, styles.totalCell, styles.metaCell]}>
              {back9Total > 0 ? Math.max(0, back9Total - back9.length) : ''}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryItem}>Par <Text style={styles.summaryBold}>{fullPar}</Text></Text>
          <Text style={styles.summaryItem}>
            Resultat <Text style={styles.summaryBold}>
              {totalScore > 0 ? `${totalScore}/${holesPlayed}` : '0/0'}
            </Text>
          </Text>
          <Text style={styles.summaryItem}>Position <Text style={styles.summaryBold}>1.</Text></Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <ChevronDown size={28} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Game {roundDate} ({holesPlayed})</Text>
            <Text style={styles.headerSubtitle}>{courseName}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderHash}>#</Text>
          <Text style={styles.tableHeaderName}>NAMN</Text>
          <Text style={styles.tableHeaderStat}>RESULTAT</Text>
          <Text style={styles.tableHeaderStat}>TILL PAR</Text>
          <Text style={styles.tableHeaderStat}>SPELAT</Text>
        </View>

        <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
          {allPlayers.map((player, idx) => {
            const pScore = getPlayerTotalScore(player.id);
            const pToPar = getPlayerToPar(player.id);
            const pPlayed = getPlayerHolesPlayed(player.id);
            const isExpanded = expandedPlayer === player.id;

            return (
              <View key={player.id}>
                <TouchableOpacity
                  style={[styles.playerRow, isExpanded && styles.playerRowExpanded]}
                  onPress={() => toggleExpand(player.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.playerPosition}>{idx + 1}.</Text>
                  <View style={styles.playerNameCol}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerHcp}>HCP {player.hcp}</Text>
                  </View>
                  <Text style={styles.playerStat}>{pScore > 0 ? pScore : '—'}</Text>
                  <Text style={[styles.playerStat, styles.toParStat, pToPar === 'E' && styles.evenPar]}>
                    {pToPar}
                  </Text>
                  <Text style={styles.playerStat}>{pPlayed}</Text>
                </TouchableOpacity>
                {isExpanded && renderScorecard(player.id)}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#333',
  },
  tableHeaderHash: {
    width: 28,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tableHeaderName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tableHeaderStat: {
    width: 60,
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  playerList: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderLeftWidth: 4,
    borderLeftColor: '#1B5E20',
  },
  playerRowExpanded: {
    borderBottomWidth: 0,
  },
  playerPosition: {
    width: 28,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  playerNameCol: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  playerHcp: {
    fontSize: 12,
    color: '#888',
  },
  playerStat: {
    width: 60,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center',
  },
  toParStat: {
    fontWeight: '800' as const,
    color: '#e53935',
  },
  evenPar: {
    color: '#1B5E20',
  },
  scorecardContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderLeftWidth: 4,
    borderLeftColor: '#1B5E20',
  },
  halfSection: {
    marginBottom: 8,
  },
  scorecardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scorecardHeaderRow: {
    backgroundColor: '#1B5E20',
    borderRadius: 4,
    marginBottom: 1,
  },
  scorecardHeaderRowBack: {
    backgroundColor: '#c62828',
    borderRadius: 4,
    marginBottom: 1,
  },
  scorecardCell: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
    color: '#333',
  },
  scorecardHeaderCell: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  scorecardHeaderCellBack: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  labelCell: {
    flex: 1.5,
    textAlign: 'left',
    paddingLeft: 4,
  },
  totalCell: {
    fontWeight: '700' as const,
  },
  metaCell: {
    fontSize: 10,
    color: '#666',
  },
  boldCell: {
    fontWeight: '700' as const,
    fontSize: 12,
  },
  scoreCellWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginHorizontal: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  summaryItem: {
    fontSize: 14,
    color: '#555',
  },
  summaryBold: {
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
});
