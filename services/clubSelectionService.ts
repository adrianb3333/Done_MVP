import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

interface ClubSelectionData {
  clubId: string;
  latitude: number;
  longitude: number;
  sessionId?: string;
  distanceMeters?: number;
}

export async function saveClubSelection(data: ClubSelectionData): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId) {
      console.warn('[ClubSelection] No authenticated user, skipping save');
      return false;
    }

    const now = new Date().toISOString();

    console.log('[ClubSelection] Saving club selection:', {
      clubId: data.clubId,
      lat: data.latitude,
      lon: data.longitude,
      selectedAt: now,
    });

    const { error } = await supabase.from('club_selections').insert({
      user_id: userId,
      club_id: data.clubId,
      selected_at: now,
      latitude: data.latitude,
      longitude: data.longitude,
      session_id: data.sessionId ?? null,
      distance_meters: data.distanceMeters ?? null,
    });

    if (error) {
      console.error('[ClubSelection] Supabase insert error:', error.message);
      return false;
    }

    console.log('[ClubSelection] Successfully saved club selection');
    return true;
  } catch (err) {
    console.error('[ClubSelection] Unexpected error:', err);
    return false;
  }
}

export async function getCurrentGpsPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[ClubSelection] Geolocation not available on web');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          console.warn('[ClubSelection] Web geolocation error:', err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  try {
    const LocationModule = require('expo-location');
    const loc = await LocationModule.getCurrentPositionAsync({
      accuracy: LocationModule.Accuracy.High,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch (err) {
    console.warn('[ClubSelection] Native location error:', err);
    return null;
  }
}
