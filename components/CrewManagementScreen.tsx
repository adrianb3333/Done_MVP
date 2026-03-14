import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Search, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';

const COLOR_OPTIONS = [
  '#1A1A1A', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
  '#8B5E3C', '#3A8E56', '#1075E3', '#0F6FAF', '#6B7280',
];

type PickerMode = 'players' | 'managers' | null;

interface CrewManagementScreenProps {
  initialSegment?: number;
  onClose: () => void;
}

export default function CrewManagementScreen({ onClose }: CrewManagementScreenProps) {
  const { allUsers, isLoadingAllUsers } = useProfile();

  const [crewName, setCrewName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#1A1A1A');
  const [crewLogo, _setCrewLogo] = useState<string | null>(null);

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  const openPicker = useCallback((mode: PickerMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPickerSearch('');
    setPickerMode(mode);
  }, []);

  const closePicker = useCallback(() => {
    setPickerMode(null);
    setPickerSearch('');
  }, []);

  const toggleUser = useCallback((userId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pickerMode === 'players') {
      setSelectedPlayers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    } else if (pickerMode === 'managers') {
      setSelectedManagers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  }, [pickerMode]);

  const selectedSet = pickerMode === 'players' ? selectedPlayers : selectedManagers;

  const filteredUsers = allUsers.filter((u) => {
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const renderPickerUser = useCallback(({ item }: { item: UserProfile }) => {
    const isSelected = selectedSet.includes(item.id);
    const initials = (item.display_name || item.username || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => toggleUser(item.id)}
        activeOpacity={0.7}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.display_name || item.username}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
        </View>
        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    );
  }, [selectedSet, toggleUser]);

  const getSelectedUsers = useCallback((ids: string[]) => {
    return allUsers.filter((u) => ids.includes(u.id));
  }, [allUsers]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.glassBackBtn}
            activeOpacity={0.7}
            testID="crew-settings-back"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.addButtonsRow}>
          <View style={styles.addButtonCol}>
            <TouchableOpacity
              style={styles.addCircleBtn}
              activeOpacity={0.7}
              onPress={() => openPicker('players')}
              testID="crew-add-players"
            >
              <Plus size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addCircleLabel}>Add Players</Text>
            {selectedPlayers.length > 0 && (
              <Text style={styles.addCircleCount}>{selectedPlayers.length} selected</Text>
            )}
          </View>
          <View style={styles.addButtonCol}>
            <TouchableOpacity
              style={styles.addCircleBtn}
              activeOpacity={0.7}
              onPress={() => openPicker('managers')}
              testID="crew-add-managers"
            >
              <Plus size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addCircleLabel}>Add Manager</Text>
            {selectedManagers.length > 0 && (
              <Text style={styles.addCircleCount}>{selectedManagers.length} selected</Text>
            )}
          </View>
        </View>

        {selectedPlayers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedSectionTitle}>Players ({selectedPlayers.length})</Text>
            {getSelectedUsers(selectedPlayers).map((user) => {
              const initials = (user.display_name || user.username || '?')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              return (
                <View key={user.id} style={styles.selectedUserRow}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.selectedUserAvatar} />
                  ) : (
                    <View style={styles.selectedUserAvatarPlaceholder}>
                      <Text style={styles.selectedUserInitials}>{initials}</Text>
                    </View>
                  )}
                  <Text style={styles.selectedUserName}>{user.display_name || user.username}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlayers((prev) => prev.filter((id) => id !== user.id));
                    }}
                    style={styles.removeBtn}
                  >
                    <X size={14} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {selectedManagers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedSectionTitle}>Managers ({selectedManagers.length})</Text>
            {getSelectedUsers(selectedManagers).map((user) => {
              const initials = (user.display_name || user.username || '?')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              return (
                <View key={user.id} style={styles.selectedUserRow}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.selectedUserAvatar} />
                  ) : (
                    <View style={styles.selectedUserAvatarPlaceholder}>
                      <Text style={styles.selectedUserInitials}>{initials}</Text>
                    </View>
                  )}
                  <Text style={styles.selectedUserName}>{user.display_name || user.username}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedManagers((prev) => prev.filter((id) => id !== user.id));
                    }}
                    style={styles.removeBtn}
                  >
                    <X size={14} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.settingsDivider} />

        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardLabel}>Name</Text>
          <TextInput
            style={styles.settingsCardInput}
            placeholder="Enter crew name..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={crewName}
            onChangeText={setCrewName}
          />
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardLabel}>Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(color);
                }}
                activeOpacity={0.7}
              >
                {selectedColor === color && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardLabel}>Logo</Text>
          <TouchableOpacity
            style={styles.logoUploadBtn}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              console.log('[CrewSettings] Logo upload pressed');
            }}
            activeOpacity={0.7}
          >
            {crewLogo ? (
              <Image source={{ uri: crewLogo }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Plus size={24} color="rgba(0,0,0,0.3)" />
                <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={pickerMode !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePicker}
      >
        <SafeAreaView edges={['top']} style={styles.pickerSafeTop}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              {pickerMode === 'players' ? 'Add Players' : 'Add Manager'}
            </Text>
            <TouchableOpacity
              onPress={closePicker}
              style={styles.pickerDoneBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerSearchBar}>
            <Search size={16} color="rgba(0,0,0,0.35)" />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Search users..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
            {pickerSearch.length > 0 && (
              <TouchableOpacity onPress={() => setPickerSearch('')}>
                <X size={16} color="rgba(0,0,0,0.35)" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {isLoadingAllUsers ? (
          <View style={styles.pickerLoading}>
            <ActivityIndicator size="large" color="rgba(0,0,0,0.3)" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderPickerUser}
            contentContainerStyle={styles.pickerListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.noResultsText}>No users found</Text>
            }
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  glassBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  addButtonsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 32,
    marginBottom: 28,
  },
  addButtonCol: {
    alignItems: 'center' as const,
    gap: 10,
  },
  addCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addCircleLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  addCircleCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#888',
  },
  selectedSection: {
    marginBottom: 16,
  },
  selectedSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  selectedUserRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 10,
  },
  selectedUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedUserAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectedUserInitials: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#888',
  },
  selectedUserName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginVertical: 16,
  },
  settingsCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  settingsCardLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  settingsCardInput: {
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  logoUploadBtn: {
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  logoPreview: {
    width: '100%' as const,
    height: 120,
    borderRadius: 14,
  },
  logoPlaceholder: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  logoPlaceholderText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.3)',
    fontWeight: '600' as const,
  },
  pickerSafeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  pickerDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  pickerDoneText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  pickerSearchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
  },
  pickerLoading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pickerListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userAvatarInitials: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#888',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  userHandle: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkCircleActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    paddingVertical: 40,
  },
});
