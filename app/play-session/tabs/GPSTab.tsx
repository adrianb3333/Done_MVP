import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import Colors from '@/constants/colors';

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function GPSTab() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
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
});
