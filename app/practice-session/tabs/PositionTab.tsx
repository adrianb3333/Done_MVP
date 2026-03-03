import React from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

function NativeMap() {
  const MapView = require('react-native-maps').default;
  const { PROVIDER_GOOGLE } = require('react-native-maps');
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        mapType="hybrid"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>HYBRID</Text>
      </View>
    </View>
  );
}

function WebMapFallback() {
  const openInMaps = () => {
    Linking.openURL(
      `https://www.google.com/maps/@${DEFAULT_REGION.latitude},${DEFAULT_REGION.longitude},17z/data=!3m1!1e1`
    );
  };

  return (
    <View style={styles.webFallback}>
      <View style={styles.iconCircle}>
        <MapPin size={40} color={Colors.accent} />
      </View>
      <Text style={styles.webTitle}>Position Map</Text>
      <Text style={styles.webSubtitle}>
        The satellite map is available on your mobile device.{"\n"}
        Open the app on your phone to view the full map.
      </Text>
      <TouchableOpacity style={styles.openBtn} onPress={openInMaps} activeOpacity={0.7}>
        <Text style={styles.openBtnText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PositionTab() {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }
  return <NativeMap />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute' as const,
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
  webFallback: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#0a1a0a',
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  webTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  webSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  openBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
