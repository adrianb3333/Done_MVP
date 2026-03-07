import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Search, X, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '@/contexts/ProfileContext';

interface PlayerItem {
  id: string;
  name: string;
  avatar_url: string | null;
  club?: string;
  hcp?: number;
}

const STORAGE_KEY_PLAYERS = 'play_setup_selected_players';

const MOCK_RECENT: PlayerItem[] = [
  { id: 'r1', name: 'Leo Selin', avatar_url: null, club: 'Borås Golfklubb', hcp: 14.0 },
  { id: 'r2', name: 'Olof Lord Anderén', avatar_url: null, club: 'Hulta Golfklubb', hcp: 14.9 },
  { id: 'r3', name: 'Adam Larsson', avatar_url: null, club: 'Forsgårdens Golfklubb', hcp: 2.1 },
  { id: 'r4', name: 'Kris -', avatar_url: null, club: 'Hulta Golfklubb', hcp: 1.7 },
  { id: 'r5', name: 'William Skarland', avatar_url: null, club: 'Hulta Golfklubb', hcp: 3.1 },
  { id: 'r6', name: 'Melker Boman', avatar_url: null, club: 'Borås Golfklubb', hcp: 15.8 },
];

export default function FriendsModal() {
  const { profile, allUsers, following } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<PlayerItem[]>([]);

  const currentUserName = profile?.display_name || profile?.username || 'Du';

  const friendsList = useMemo<PlayerItem[]>(() => {
    if (following.length > 0) {
      return following.map((f) => ({
        id: f.id,
        name: f.display_name || f.username,
        avatar_url: f.avatar_url,
        club: undefined,
        hcp: undefined,
      }));
    }
    return [];
  }, [following]);

  const recentList = useMemo<PlayerItem[]>(() => {
    const supabaseUsers: PlayerItem[] = allUsers.map((u) => ({
      id: u.id,
      name: u.display_name || u.username,
      avatar_url: u.avatar_url,
      club: undefined,
      hcp: undefined,
    }));
    const merged = [...MOCK_RECENT];
    for (const su of supabaseUsers) {
      if (!merged.find((m) => m.id === su.id) && su.id !== profile?.id) {
        merged.push(su);
      }
    }
    return merged;
  }, [allUsers, profile?.id]);

  const filteredRecent = useMemo(() => {
    if (!searchQuery.trim()) return recentList;
    const q = searchQuery.toLowerCase();
    return recentList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.club && p.club.toLowerCase().includes(q))
    );
  }, [recentList, searchQuery]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friendsList;
    const q = searchQuery.toLowerCase();
    return friendsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.club && p.club.toLowerCase().includes(q))
    );
  }, [friendsList, searchQuery]);

  const isSelected = useCallback(
    (id: string) => selected.some((p) => p.id === id),
    [selected]
  );

  const togglePlayer = useCallback(
    (player: PlayerItem) => {
      setSelected((prev) => {
        if (prev.some((p) => p.id === player.id)) {
          return prev.filter((p) => p.id !== player.id);
        }
        if (prev.length >= 3) return prev;
        return [...prev, player];
      });
    },
    []
  );

  const removeSelected = useCallback((id: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleDone = async () => {
    try {
      const toStore = selected.map((p) => ({
        id: p.id,
        name: p.name,
        avatar_url: p.avatar_url,
        club: p.club,
        hcp: p.hcp,
      }));
      await AsyncStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(toStore));
      console.log('[FriendsModal] Saved players:', toStore.length);
    } catch (e) {
      console.log('[FriendsModal] Error saving:', e);
    }
    router.back();
  };

  const renderSlots = () => {
    const slots: (PlayerItem | null)[] = [
      ...selected,
      ...Array(Math.max(0, 3 - selected.length)).fill(null),
    ];

    return (
      <View style={styles.slotsRow}>
        <View style={styles.slotItem}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.slotAvatar} />
          ) : (
            <View style={[styles.slotAvatar, styles.slotAvatarPlaceholder]}>
              <Text style={styles.slotInitial}>{currentUserName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.slotName} numberOfLines={1}>{currentUserName.split(' ')[0]}</Text>
        </View>
        {slots.map((player, index) => (
          <View key={index} style={styles.slotItem}>
            {player ? (
              <TouchableOpacity onPress={() => removeSelected(player.id)}>
                <View style={styles.slotAvatarWrap}>
                  {player.avatar_url ? (
                    <Image source={{ uri: player.avatar_url }} style={styles.slotAvatar} />
                  ) : (
                    <View style={[styles.slotAvatar, styles.slotAvatarPlaceholder]}>
                      <Text style={styles.slotInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.slotRemoveBadge}>
                    <X size={10} color="#fff" />
                  </View>
                </View>
                <Text style={styles.slotName} numberOfLines={1}>{player.name.split(' ')[0]}</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.slotEmpty}>
                  <Text style={styles.slotEmptyNum}>{index + 2}</Text>
                </View>
                <Text style={styles.slotName}> </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPlayerRow = ({ item }: { item: PlayerItem }) => {
    const active = isSelected(item.id);
    return (
      <TouchableOpacity
        style={styles.playerRow}
        onPress={() => togglePlayer(item)}
        activeOpacity={0.6}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.playerAvatar} />
        ) : (
          <View style={[styles.playerAvatar, styles.playerAvatarPlaceholder]}>
            <Text style={styles.playerAvatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.playerMeta}>
          <Text style={styles.playerName}>{item.name}</Text>
          <Text style={styles.playerClub}>
            {item.club ?? ''}{item.club && item.hcp !== undefined ? ' | ' : ''}{item.hcp !== undefined ? item.hcp.toFixed(1) : ''}
          </Text>
        </View>
        <View style={[styles.radio, active && styles.radioActive]}>
          {active && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const sections = useMemo(() => {
    const data: { key: string; title: string; data: PlayerItem[] }[] = [];
    if (filteredRecent.length > 0) {
      data.push({ key: 'recent', title: 'Nyligen spelat med', data: filteredRecent });
    }
    if (filteredFriends.length > 0) {
      data.push({ key: 'friends', title: 'Vänner', data: filteredFriends });
    }
    return data;
  }, [filteredRecent, filteredFriends]);

  const flatData = useMemo(() => {
    const items: ({ type: 'header'; title: string } | { type: 'player'; player: PlayerItem })[] = [];
    for (const section of sections) {
      items.push({ type: 'header', title: section.title });
      for (const p of section.data) {
        items.push({ type: 'player', player: p });
      }
    }
    return items;
  }, [sections]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>GRUPP 1</Text>
          <Text style={styles.headerCount}>{selected.length + 1}/4</Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Klar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Sök bland alla spelare"
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {renderSlots()}

      <TouchableOpacity style={styles.createRow} activeOpacity={0.7}>
        <View style={styles.createIcon}>
          <Plus size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.createText}>Skapa oregistrerad spelare</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <FlatList
        data={flatData}
        keyExtractor={(item, index) => {
          if (item.type === 'header') return `header-${item.title}`;
          return item.player.id + '-' + index;
        }}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }
          return renderPlayerRow({ item: item.player });
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#243028',
  },
  headerSpacer: {
    width: 60,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerCount: {
    fontSize: 13,
    color: '#8A9B90',
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#222222',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#222222',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 20,
  },
  slotItem: {
    alignItems: 'center',
    width: 64,
  },
  slotAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ddd',
  },
  slotAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222222',
  },
  slotInitial: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  slotAvatarWrap: {
    position: 'relative' as const,
  },
  slotRemoveBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#3a4a40',
    borderStyle: 'dashed' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  slotEmptyNum: {
    fontSize: 16,
    color: '#5A6B60',
    fontWeight: '600' as const,
  },
  slotName: {
    fontSize: 12,
    color: '#8A9B90',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  createIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ddd',
  },
  playerAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222222',
  },
  playerAvatarInitial: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#8A9B90',
  },
  playerMeta: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  playerClub: {
    fontSize: 13,
    color: '#8A9B90',
    marginTop: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a4a40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#FFFFFF',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 40,
  },
});
