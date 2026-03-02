import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';

let MapView: any = null;
if (Platform.OS !== 'web') {
  try {
    MapView = require('react-native-maps').default;
  } catch (e) {
    console.log('[GPSTab] react-native-maps not available:', e);
  }
}

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function GPSTab() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webTitle}>GPS Map</Text>
          <Text style={styles.webSubtitle}>Satellite map view is available on mobile devices</Text>
          <Text style={styles.webCoords}>
            {DEFAULT_REGION.latitude.toFixed(4)}°N, {Math.abs(DEFAULT_REGION.longitude).toFixed(4)}°W
          </Text>
        </View>
      </View>
    );
  }

  if (!MapView) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Map not available</Text>
        <Text style={styles.fallbackSub}>react-native-maps could not be loaded</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        mapType="satellite"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>SATELLITE</Text>
      </View>
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
