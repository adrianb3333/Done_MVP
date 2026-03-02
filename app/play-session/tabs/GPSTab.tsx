import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';

let AppleMaps: any = null;
let GoogleMaps: any = null;
let AppleMapsMapType: any = null;
let GoogleMapsMapType: any = null;

if (Platform.OS !== 'web') {
  try {
    const expoMaps = require('expo-maps');
    AppleMaps = expoMaps.AppleMaps;
    GoogleMaps = expoMaps.GoogleMaps;
    AppleMapsMapType = expoMaps.AppleMapsMapType;
    GoogleMapsMapType = expoMaps.GoogleMapsMapType;
  } catch (e) {
    console.log('[GPSTab] expo-maps not available:', e);
  }
}

const DEFAULT_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060,
};

const DEFAULT_ZOOM = 17;

export default function GPSTab() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webTitle}>GPS Map</Text>
          <Text style={styles.webSubtitle}>Satellite map view is available on mobile devices</Text>
          <Text style={styles.webCoords}>
            {DEFAULT_LOCATION.latitude.toFixed(4)}°N, {Math.abs(DEFAULT_LOCATION.longitude).toFixed(4)}°W
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (Platform.OS === 'ios' && AppleMaps) {
    return (
      <View style={styles.container}>
        <AppleMaps.View
          style={styles.map}
          cameraPosition={{
            coordinates: DEFAULT_LOCATION,
            zoom: DEFAULT_ZOOM,
          }}
          properties={{
            mapType: AppleMapsMapType?.IMAGERY ?? 'imagery',
            isMyLocationEnabled: true,
          }}
          uiSettings={{
            compassEnabled: true,
            myLocationButtonEnabled: true,
            scaleBarEnabled: true,
          }}
        />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>SATELLITE</Text>
        </View>
      </View>
    );
  }

  if (Platform.OS === 'android' && GoogleMaps) {
    return (
      <View style={styles.container}>
        <GoogleMaps.View
          style={styles.map}
          cameraPosition={{
            coordinates: DEFAULT_LOCATION,
            zoom: DEFAULT_ZOOM,
          }}
          properties={{
            mapType: GoogleMapsMapType?.SATELLITE ?? 'satellite',
            isMyLocationEnabled: true,
          }}
          uiSettings={{
            compassEnabled: true,
            myLocationButtonEnabled: true,
            zoomControlsEnabled: true,
            scaleBarEnabled: true,
          }}
        />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>SATELLITE</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackText}>Map not available</Text>
      <Text style={styles.fallbackSub}>Please rebuild the app with expo-maps configured</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1a0f',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  overlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  overlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0a1a0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webMapPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  webTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  webCoords: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1a0f',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  fallbackSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
