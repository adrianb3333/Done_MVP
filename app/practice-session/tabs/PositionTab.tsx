import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Move, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Coordinate {
  latitude: number;
  longitude: number;
}

function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function offsetCoordinate(coord: Coordinate, meters: number): Coordinate {
  const earthRadius = 6371000;
  const dLat = meters / earthRadius;
  return {
    latitude: coord.latitude + (dLat * 180) / Math.PI,
    longitude: coord.longitude,
  };
}

function NativeMap() {
  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');
  const Location = require('expo-location');

  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [dragEnd, setDragEnd] = useState<Coordinate | null>(null);
  const [distance, setDistance] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          if (mounted) {
            setPermissionDenied(true);
            setLoading(false);
          }
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('Got user location:', loc.coords.latitude, loc.coords.longitude);
        if (mounted) {
          const coords: Coordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation(coords);
          const initialDragEnd = offsetCoordinate(coords, 100);
          setDragEnd(initialDragEnd);
          setDistance(100);
          setLoading(false);
        }
      } catch (err) {
        console.log('Error getting location:', err);
        if (mounted) {
          setPermissionDenied(true);
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('Drag ended at:', newCoord.latitude, newCoord.longitude);
    setDragEnd(newCoord);
    if (userLocation) {
      const dist = haversineDistance(userLocation, newCoord);
      setDistance(Math.round(dist));
    }
  }, [userLocation]);

  const handleReset = useCallback(() => {
    if (userLocation) {
      const resetEnd = offsetCoordinate(userLocation, 100);
      setDragEnd(resetEnd);
      setDistance(100);
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 500);
    }
  }, [userLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Getting your position...</Text>
      </View>
    );
  }

  if (permissionDenied || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={40} color="#FF5252" />
        <Text style={styles.loadingText}>Location permission required</Text>
        <Text style={styles.loadingSubtext}>Enable location to use the Position tool</Text>
      </View>
    );
  }

  const region = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        mapType="hybrid"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {dragEnd && (
          <>
            <Polyline
              coordinates={[userLocation, dragEnd]}
              strokeColor="#34C759"
              strokeWidth={3}
              lineDashPattern={[8, 6]}
            />
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.startMarker}>
                <View style={styles.startMarkerInner} />
              </View>
            </Marker>
            <Marker
              coordinate={dragEnd}
              draggable
              onDragEnd={handleDragEnd}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.dragMarker}>
                <View style={styles.dragMarkerInner}>
                  <Move size={14} color="#fff" />
                </View>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      <View style={styles.distanceBadge}>
        <Text style={styles.distanceValue}>{distance}</Text>
        <Text style={styles.distanceUnit}>m</Text>
      </View>

      <View style={styles.toolLabel}>
        <Move size={14} color="#34C759" />
        <Text style={styles.toolLabelText}>Drag to measure</Text>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
        <RotateCcw size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function WebMapFallback() {
  const openInMaps = () => {
    void Linking.openURL(
      `https://www.google.com/maps/@40.7128,-74.0060,17z/data=!3m1!1e1`
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#0a1a0a',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  loadingSubtext: {
    color: '#888',
    fontSize: 13,
  },
  startMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(52,199,89,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  startMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dragMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,59,48,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dragMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  distanceBadge: {
    position: 'absolute' as const,
    top: 16,
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.4)',
  },
  distanceValue: {
    color: '#34C759',
    fontSize: 32,
    fontWeight: '800' as const,
  },
  distanceUnit: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 4,
    opacity: 0.8,
  },
  toolLabel: {
    position: 'absolute' as const,
    bottom: 20,
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  toolLabelText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  resetBtn: {
    position: 'absolute' as const,
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
