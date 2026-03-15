import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface FollowRelation {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

const avatarCacheMap = new Map<string, string>();
let avatarCacheBuster = Date.now();

function resolveAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) {
    if (avatarPath.includes('supabase') && !avatarPath.includes('_cb=')) {
      return `${avatarPath}${avatarPath.includes('?') ? '&' : '?'}_cb=${avatarCacheBuster}`;
    }
    return avatarPath;
  }
  const cacheKey = `${avatarPath}_${avatarCacheBuster}`;
  const cached = avatarCacheMap.get(cacheKey);
  if (cached) return cached;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  const url = `${data.publicUrl}?_cb=${avatarCacheBuster}`;
  avatarCacheMap.set(cacheKey, url);
  return url;
}

function invalidateAvatarCache() {
  avatarCacheBuster = Date.now();
  avatarCacheMap.clear();
}

function resolveProfileAvatar(profile: UserProfile): UserProfile {
  return { ...profile, avatar_url: resolveAvatarUrl(profile.avatar_url) };
}

const BG_IMAGE_KEY = 'profile_background_image';
const COACH_MODE_KEY = 'coach_mode_activated';
const CREW_NAME_KEY = 'crew_name';
const CREW_COLOR_KEY = 'crew_color';
const CREW_LOGO_KEY = 'crew_logo';
const CREW_PLAYERS_KEY = 'crew_players';
const CREW_MANAGERS_KEY = 'crew_managers';
const CREW_DRILLS_KEY = 'crew_drills';
const CREW_SCHEDULED_KEY = 'crew_scheduled';
const CREW_ROUNDS_KEY = 'crew_rounds';
const CREW_SCHEDULED_ROUNDS_KEY = 'crew_scheduled_rounds';

export interface CrewDrill {
  id: string;
  name: string;
  category: string;
  rounds: number;
  shotsPerRound: number;
  totalShots: number;
  acceptedDistances: number[];
  info: string;
  createdAt: number;
}

export interface ScheduledDrill {
  id: string;
  drillId: string;
  drillName: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface CrewRoundGroup {
  id: string;
  players: string[];
}

export interface CrewRound {
  id: string;
  name: string;
  groups: CrewRoundGroup[];
  courseName: string;
  courseClubName?: string;
  courseCity?: string;
  courseCountry?: string;
  holeOption: string;
  info: string;
  createdAt: number;
}

export interface ScheduledRound {
  id: string;
  roundId: string;
  roundName: string;
  courseName?: string;
  courseClubName?: string;
  courseCity?: string;
  courseCountry?: string;
  holeOption?: string;
  groups?: CrewRoundGroup[];
  info?: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface CrewSettings {
  name: string;
  color: string;
  logo: string | null;
  players: string[];
  managers: string[];
}

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [backgroundImageUri, setBackgroundImageUriState] = useState<string | null>(null);
  const [isCoachMode, setIsCoachModeState] = useState<boolean>(false);
  const [crewName, setCrewNameState] = useState<string>('');
  const [crewColor, setCrewColorState] = useState<string>('#1A1A1A');
  const [crewLogo, setCrewLogoState] = useState<string | null>(null);
  const [crewPlayers, setCrewPlayersState] = useState<string[]>([]);
  const [crewManagers, setCrewManagersState] = useState<string[]>([]);
  const [crewDrills, setCrewDrillsState] = useState<CrewDrill[]>([]);
  const [crewScheduled, setCrewScheduledState] = useState<ScheduledDrill[]>([]);
  const [crewRounds, setCrewRoundsState] = useState<CrewRound[]>([]);
  const [crewScheduledRounds, setCrewScheduledRoundsState] = useState<ScheduledRound[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(BG_IMAGE_KEY).then((val) => {
      if (val) {
        console.log('[ProfileContext] Loaded background image from storage');
        setBackgroundImageUriState(val);
      }
    }).catch(() => {});
    AsyncStorage.getItem(COACH_MODE_KEY).then((val) => {
      if (val === 'true') {
        console.log('[ProfileContext] Coach mode loaded from storage');
        setIsCoachModeState(true);
      }
    }).catch(() => {});
    AsyncStorage.getItem(CREW_NAME_KEY).then((val) => {
      if (val) setCrewNameState(val);
    }).catch(() => {});
    AsyncStorage.getItem(CREW_COLOR_KEY).then((val) => {
      if (val) setCrewColorState(val);
    }).catch(() => {});
    AsyncStorage.getItem(CREW_LOGO_KEY).then((val) => {
      if (val) setCrewLogoState(val);
    }).catch(() => {});
    AsyncStorage.getItem(CREW_PLAYERS_KEY).then((val) => {
      if (val) setCrewPlayersState(JSON.parse(val));
    }).catch(() => {});
    AsyncStorage.getItem(CREW_MANAGERS_KEY).then((val) => {
      if (val) setCrewManagersState(JSON.parse(val));
    }).catch(() => {});
    AsyncStorage.getItem(CREW_DRILLS_KEY).then((val) => {
      if (val) setCrewDrillsState(JSON.parse(val));
    }).catch(() => {});
    AsyncStorage.getItem(CREW_SCHEDULED_KEY).then((val) => {
      if (val) setCrewScheduledState(JSON.parse(val));
    }).catch(() => {});
    AsyncStorage.getItem(CREW_ROUNDS_KEY).then((val) => {
      if (val) setCrewRoundsState(JSON.parse(val));
    }).catch(() => {});
    AsyncStorage.getItem(CREW_SCHEDULED_ROUNDS_KEY).then((val) => {
      if (val) setCrewScheduledRoundsState(JSON.parse(val));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[ProfileContext] Got session user:', session?.user?.id);
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[ProfileContext] Auth changed, user:', session?.user?.id);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('[ProfileContext] Fetching profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.log('[ProfileContext] Profile fetch error:', error.message);
        if (error.code === 'PGRST116') {
          console.log('[ProfileContext] No profile found, creating one...');
          const { data: authUser } = await supabase.auth.getUser();
          const newProfile = {
            id: userId,
            username: authUser.user?.email?.split('@')[0] ?? 'user',
            display_name: authUser.user?.email?.split('@')[0] ?? 'User',
            avatar_url: null,
          };
          const { data: created, error: createErr } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
          if (createErr) {
            console.error('[ProfileContext] Create profile error:', createErr.message);
            return resolveProfileAvatar(newProfile as UserProfile);
          }
          return resolveProfileAvatar(created as UserProfile);
        }
        return null;
      }
      return resolveProfileAvatar(data as UserProfile);
    },
    enabled: !!userId,
  });

  const followersQuery = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log('[ProfileContext] Fetching followers for:', userId);
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)')
        .eq('following_id', userId);
      if (error) {
        console.log('[ProfileContext] Followers error:', error.message);
        return [];
      }
      return (data ?? []).map((f: any) => f.profiles as UserProfile).filter(Boolean).map(resolveProfileAvatar);
    },
    enabled: !!userId,
  });

  const allUsersQuery = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      console.log('[ProfileContext] Fetching all users');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .order('display_name', { ascending: true });
      if (error) {
        console.log('[ProfileContext] All users error:', error.message);
        return [];
      }
      return (data ?? []).filter((u: any) => u.id !== userId).map((u: any) => resolveProfileAvatar(u as UserProfile));
    },
    enabled: !!userId,
  });

  const followingQuery = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log('[ProfileContext] Fetching following for:', userId);
      const { data, error } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url)')
        .eq('follower_id', userId);
      if (error) {
        console.log('[ProfileContext] Following error:', error.message);
        return [];
      }
      return (data ?? []).map((f: any) => f.profiles as UserProfile).filter(Boolean).map(resolveProfileAvatar);
    },
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { username?: string; display_name?: string; avatar_url?: string | null }) => {
      if (!userId) throw new Error('Not authenticated');
      console.log('[ProfileContext] Updating profile via upsert:', updates);
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: updates.username,
          display_name: updates.display_name,
          avatar_url: updates.avatar_url,
          updated_at: new Date(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!userId) throw new Error('Not authenticated');
      console.log('[ProfileContext] Toggle follow for:', targetUserId);
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single();

      if (existing) {
        console.log('[ProfileContext] Unfollowing:', targetUserId);
        await supabase.from('follows').delete().eq('id', existing.id);
        return { action: 'unfollowed' as const, targetUserId };
      } else {
        console.log('[ProfileContext] Following:', targetUserId);
        await supabase.from('follows').insert({ follower_id: userId, following_id: targetUserId });
        return { action: 'followed' as const, targetUserId };
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      void queryClient.invalidateQueries({ queryKey: ['following', userId] });
    },
  });

  const setBackgroundImage = useCallback(async (uri: string | null) => {
    console.log('[ProfileContext] Setting background image:', uri ? 'has image' : 'cleared');
    setBackgroundImageUriState(uri);
    if (uri) {
      await AsyncStorage.setItem(BG_IMAGE_KEY, uri);
    } else {
      await AsyncStorage.removeItem(BG_IMAGE_KEY);
    }
  }, []);

  const activateCoachMode = useCallback(async () => {
    console.log('[ProfileContext] Activating coach mode');
    setIsCoachModeState(true);
    await AsyncStorage.setItem(COACH_MODE_KEY, 'true');
  }, []);

  const deactivateCoachMode = useCallback(async () => {
    console.log('[ProfileContext] Deactivating coach mode');
    setIsCoachModeState(false);
    await AsyncStorage.removeItem(COACH_MODE_KEY);
  }, []);

  const saveCrewDrill = useCallback(async (drill: CrewDrill) => {
    console.log('[ProfileContext] Saving crew drill:', drill.name);
    const updated = [...crewDrills, drill];
    setCrewDrillsState(updated);
    await AsyncStorage.setItem(CREW_DRILLS_KEY, JSON.stringify(updated));
  }, [crewDrills]);

  const deleteCrewDrill = useCallback(async (drillId: string) => {
    console.log('[ProfileContext] Deleting crew drill:', drillId);
    const updated = crewDrills.filter((d) => d.id !== drillId);
    setCrewDrillsState(updated);
    await AsyncStorage.setItem(CREW_DRILLS_KEY, JSON.stringify(updated));
  }, [crewDrills]);

  const saveScheduledDrill = useCallback(async (scheduled: ScheduledDrill) => {
    console.log('[ProfileContext] Saving scheduled drill:', scheduled.drillName);
    const updated = [...crewScheduled, scheduled];
    setCrewScheduledState(updated);
    await AsyncStorage.setItem(CREW_SCHEDULED_KEY, JSON.stringify(updated));
  }, [crewScheduled]);

  const deleteScheduledDrill = useCallback(async (scheduledId: string) => {
    console.log('[ProfileContext] Deleting scheduled drill:', scheduledId);
    const updated = crewScheduled.filter((s) => s.id !== scheduledId);
    setCrewScheduledState(updated);
    await AsyncStorage.setItem(CREW_SCHEDULED_KEY, JSON.stringify(updated));
  }, [crewScheduled]);

  const saveCrewRound = useCallback(async (round: CrewRound) => {
    console.log('[ProfileContext] Saving crew round:', round.name);
    const updated = [...crewRounds, round];
    setCrewRoundsState(updated);
    await AsyncStorage.setItem(CREW_ROUNDS_KEY, JSON.stringify(updated));
  }, [crewRounds]);

  const deleteCrewRound = useCallback(async (roundId: string) => {
    console.log('[ProfileContext] Deleting crew round:', roundId);
    const updated = crewRounds.filter((r) => r.id !== roundId);
    setCrewRoundsState(updated);
    await AsyncStorage.setItem(CREW_ROUNDS_KEY, JSON.stringify(updated));
  }, [crewRounds]);

  const saveScheduledRound = useCallback(async (scheduled: ScheduledRound) => {
    console.log('[ProfileContext] Saving scheduled round:', scheduled.roundName);
    const updated = [...crewScheduledRounds, scheduled];
    setCrewScheduledRoundsState(updated);
    await AsyncStorage.setItem(CREW_SCHEDULED_ROUNDS_KEY, JSON.stringify(updated));
  }, [crewScheduledRounds]);

  const deleteScheduledRound = useCallback(async (scheduledId: string) => {
    console.log('[ProfileContext] Deleting scheduled round:', scheduledId);
    const updated = crewScheduledRounds.filter((s) => s.id !== scheduledId);
    setCrewScheduledRoundsState(updated);
    await AsyncStorage.setItem(CREW_SCHEDULED_ROUNDS_KEY, JSON.stringify(updated));
  }, [crewScheduledRounds]);

  const saveCrewSettings = useCallback(async (settings: CrewSettings) => {
    console.log('[ProfileContext] Saving crew settings:', settings.name, settings.color);
    setCrewNameState(settings.name);
    setCrewColorState(settings.color);
    setCrewLogoState(settings.logo);
    setCrewPlayersState(settings.players);
    setCrewManagersState(settings.managers);
    await AsyncStorage.setItem(CREW_NAME_KEY, settings.name);
    await AsyncStorage.setItem(CREW_COLOR_KEY, settings.color);
    if (settings.logo) {
      await AsyncStorage.setItem(CREW_LOGO_KEY, settings.logo);
    } else {
      await AsyncStorage.removeItem(CREW_LOGO_KEY);
    }
    await AsyncStorage.setItem(CREW_PLAYERS_KEY, JSON.stringify(settings.players));
    await AsyncStorage.setItem(CREW_MANAGERS_KEY, JSON.stringify(settings.managers));
  }, []);

  const uploadAvatar = useCallback(async (uri: string) => {
    if (!userId) throw new Error('Not authenticated');
    console.log('[ProfileContext] Uploading avatar from:', uri);
    const fileName = `${userId}/profile.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('[ProfileContext] Upload error:', uploadError.message);
      throw uploadError;
    }
    console.log('[ProfileContext] Upload success:', data);

    invalidateAvatarCache();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: fileName })
      .eq('id', userId);

    if (updateError) {
      console.error('[ProfileContext] Profile update error:', updateError.message);
      throw updateError;
    }

    console.log('[ProfileContext] Profile avatar_url updated to:', fileName);

    const resolvedUrl = resolveAvatarUrl(fileName);
    console.log('[ProfileContext] Resolved avatar URL:', resolvedUrl);

    const currentProfile = queryClient.getQueryData<UserProfile | null>(['profile', userId]);
    if (currentProfile) {
      queryClient.setQueryData(['profile', userId], {
        ...currentProfile,
        avatar_url: resolvedUrl,
      });
      console.log('[ProfileContext] Optimistically updated profile cache with new avatar');
    }

    void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    return fileName;
  }, [userId, queryClient]);

  const isFollowing = useCallback((targetUserId: string) => {
    return (followingQuery.data ?? []).some((u) => u.id === targetUserId);
  }, [followingQuery.data]);

  const refetchAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    void queryClient.invalidateQueries({ queryKey: ['followers', userId] });
    void queryClient.invalidateQueries({ queryKey: ['following', userId] });
    void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  }, [queryClient, userId]);

  return useMemo(() => ({
    userId,
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    followers: followersQuery.data ?? [],
    following: followingQuery.data ?? [],
    followersCount: (followersQuery.data ?? []).length,
    followingCount: (followingQuery.data ?? []).length,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    toggleFollow: toggleFollowMutation.mutateAsync,
    isTogglingFollow: toggleFollowMutation.isPending,
    uploadAvatar,
    isFollowing,
    allUsers: allUsersQuery.data ?? [],
    isLoadingAllUsers: allUsersQuery.isLoading,
    refetchAll,
    backgroundImageUri,
    setBackgroundImage,
    isCoachMode,
    activateCoachMode,
    deactivateCoachMode,
    crewName,
    crewColor,
    crewLogo,
    crewPlayers,
    crewManagers,
    crewDrills,
    saveCrewDrill,
    deleteCrewDrill,
    crewScheduled,
    saveScheduledDrill,
    deleteScheduledDrill,
    crewRounds,
    saveCrewRound,
    deleteCrewRound,
    crewScheduledRounds,
    saveScheduledRound,
    deleteScheduledRound,
    saveCrewSettings,
  }), [
    userId,
    profileQuery.data,
    profileQuery.isLoading,
    followersQuery.data,
    followingQuery.data,
    updateProfileMutation.mutateAsync,
    updateProfileMutation.isPending,
    toggleFollowMutation.mutateAsync,
    toggleFollowMutation.isPending,
    uploadAvatar,
    isFollowing,
    allUsersQuery.data,
    allUsersQuery.isLoading,
    refetchAll,
    backgroundImageUri,
    setBackgroundImage,
    isCoachMode,
    activateCoachMode,
    deactivateCoachMode,
    crewName,
    crewColor,
    crewLogo,
    crewPlayers,
    crewManagers,
    crewDrills,
    saveCrewDrill,
    deleteCrewDrill,
    crewScheduled,
    saveScheduledDrill,
    deleteScheduledDrill,
    crewRounds,
    saveCrewRound,
    deleteCrewRound,
    crewScheduledRounds,
    saveScheduledRound,
    deleteScheduledRound,
    saveCrewSettings,
  ]);
});
