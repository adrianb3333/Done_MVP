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

export async function updateClubSelectionDistance(
  clubId: string,
  latitude: number,
  longitude: number,
  distanceMeters: number
): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId) {
      console.warn('[ClubSelection] No authenticated user, skipping distance update');
      return false;
    }

    console.log('[ClubSelection] Updating distance for club:', clubId, 'distance:', distanceMeters, 'm');

    const { data: rows, error: fetchError } = await supabase
      .from('club_selections')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('latitude', latitude)
      .eq('longitude', longitude)
      .is('distance_meters', null)
      .order('selected_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[ClubSelection] Error finding row to update:', fetchError.message);
      return false;
    }

    if (!rows || rows.length === 0) {
      console.warn('[ClubSelection] No matching row found to update distance, inserting fallback');
      const { error: insertError } = await supabase.from('club_selections').insert({
        user_id: userId,
        club_id: clubId,
        selected_at: new Date().toISOString(),
        latitude,
        longitude,
        distance_meters: distanceMeters,
      });
      if (insertError) {
        console.error('[ClubSelection] Fallback insert error:', insertError.message);
        return false;
      }
      console.log('[ClubSelection] Fallback insert succeeded');
      return true;
    }

    const rowId = rows[0].id;
    const { error: updateError } = await supabase
      .from('club_selections')
      .update({ distance_meters: distanceMeters })
      .eq('id', rowId);

    if (updateError) {
      console.error('[ClubSelection] Update error:', updateError.message);
      return false;
    }

    console.log('[ClubSelection] Successfully updated distance_meters for row:', rowId);
    return true;
  } catch (err) {
    console.error('[ClubSelection] Unexpected error updating distance:', err);
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
