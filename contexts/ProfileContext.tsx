import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

function resolveAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl + '?t=' + Date.now();
}

function resolveProfileAvatar(profile: UserProfile): UserProfile {
  return { ...profile, avatar_url: resolveAvatarUrl(profile.avatar_url) };
}

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
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
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
    },
  });

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

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: fileName })
      .eq('id', userId);

    if (updateError) {
      console.error('[ProfileContext] Profile update error:', updateError.message);
      throw updateError;
    }

    console.log('[ProfileContext] Profile avatar_url updated to:', fileName);
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    return fileName;
  }, [userId, queryClient]);

  const isFollowing = useCallback((targetUserId: string) => {
    return (followingQuery.data ?? []).some((u) => u.id === targetUserId);
  }, [followingQuery.data]);

  return {
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
    refetchAll: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  };
});
