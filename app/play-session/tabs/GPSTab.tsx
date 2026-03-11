import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Move, RotateCcw, Wind, ArrowUp, ZoomIn, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '@/hooks/useWeather';
import { calculateGolfShot } from '@/services/golfCalculations';

interface Coordinate {
  latitude: number;
  longitude: number;
}

const DEFAULT_START: Coordinate = { latitude: 57.698483, longitude: 12.580719 };
const DEFAULT_END: Coordinate = { latitude: 57.701442, longitude: 12.581172 };

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

function computeBearing(from: Coordinate, to: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLon = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(toRad(to.latitude));
  const x = Math.cos(toRad(from.latitude)) * Math.sin(toRad(to.latitude)) -
    Math.sin(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.cos(dLon);
  return Math.atan2(y, x);
}

function destinationPoint(from: Coordinate, bearingRad: number, distanceM: number): Coordinate {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(from.latitude);
  const lon1 = toRad(from.longitude);
  const angDist = distanceM / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angDist) + Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearingRad));
  const lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(angDist) * Math.cos(lat1), Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2));
  return { latitude: toDeg(lat2), longitude: toDeg(lon2) };
}

function offsetCoordinate(coord: Coordinate, bearingRad: number, offsetM: number): Coordinate {
  const perpBearing = bearingRad + Math.PI / 2;
  return destinationPoint(coord, perpBearing, offsetM);
}

interface GPSTabProps {
  onDistanceChange?: (distance: number) => void;
}

function NativeMap({ onDistanceChange }: GPSTabProps) {
  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');
  const Location = require('expo-location');

  const mapRef = useRef<any>(null);
  const [startPosition, setStartPosition] = useState<Coordinate>(DEFAULT_START);
  const [dragEnd, setDragEnd] = useState<Coordinate | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [_liveUserLocation, setLiveUserLocation] = useState<Coordinate | null>(null);

  const { weather } = useWeather(geoLocation?.lat || null, geoLocation?.lon || null, 0);

  const adjustedDistance = useMemo(() => {
    if (!weather || distance <= 0) return null;
    return calculateGolfShot(distance, 'Normal', weather.windMs, weather.headTail, weather.cross, weather.temp);
  }, [weather, distance]);

  const weatherLine = useMemo(() => {
    if (!adjustedDistance || !dragEnd) return null;
    const bearing = computeBearing(startPosition, dragEnd);
    const adjEnd = destinationPoint(startPosition, bearing, adjustedDistance.adjustedDistance);
    const OFFSET = 8;
    const startOffset = offsetCoordinate(startPosition, bearing, OFFSET);
    const endOffset = offsetCoordinate(adjEnd, bearing, OFFSET);
    return { start: startOffset, end: endOffset };
  }, [adjustedDistance, startPosition, dragEnd]);

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
          setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          setLiveUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setStartPosition(DEFAULT_START);
          setDragEnd(DEFAULT_END);
          const initialDist = Math.round(haversineDistance(DEFAULT_START, DEFAULT_END));
          setDistance(initialDist);
          onDistanceChange?.(initialDist);
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

  const toggleGps = useCallback(async () => {
    const Loc = require('expo-location');
    if (!gpsActive) {
      try {
        const loc = await Loc.getCurrentPositionAsync({
          accuracy: Loc.Accuracy.High,
        });
        const newStart: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        console.log('GPS ON - using live position:', newStart.latitude, newStart.longitude);
        setLiveUserLocation(newStart);
        setStartPosition(newStart);
        setGpsActive(true);
        if (dragEnd) {
          const dist = Math.round(haversineDistance(newStart, dragEnd));
          setDistance(dist);
          onDistanceChange?.(dist);
          mapRef.current?.fitToCoordinates(
            [newStart, dragEnd],
            { edgePadding: { top: 100, right: 60, bottom: 80, left: 60 }, animated: true }
          );
        }
      } catch (err) {
        console.log('Error getting GPS position:', err);
      }
    } else {
      console.log('GPS OFF - reverting to default coordinates');
      setStartPosition(DEFAULT_START);
      setGpsActive(false);
      if (dragEnd) {
        const dist = Math.round(haversineDistance(DEFAULT_START, dragEnd));
        setDistance(dist);
        onDistanceChange?.(dist);
        mapRef.current?.fitToCoordinates(
          [DEFAULT_START, dragEnd],
          { edgePadding: { top: 100, right: 60, bottom: 80, left: 60 }, animated: true }
        );
      }
    }
  }, [gpsActive, dragEnd, onDistanceChange]);

  const handleDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setDragEnd(newCoord);
    const dist = Math.round(haversineDistance(startPosition, newCoord));
    setDistance(dist);
    onDistanceChange?.(dist);
  }, [startPosition, onDistanceChange]);

  const handleDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('Drag ended at:', newCoord.latitude, newCoord.longitude);
    setDragEnd(newCoord);
    const dist = Math.round(haversineDistance(startPosition, newCoord));
    setDistance(dist);
    onDistanceChange?.(dist);
  }, [startPosition, onDistanceChange]);

  const handleReset = useCallback(() => {
    setDragEnd(DEFAULT_END);
    if (!gpsActive) {
      setStartPosition(DEFAULT_START);
    }
    const start = gpsActive ? startPosition : DEFAULT_START;
    const resetDist = Math.round(haversineDistance(start, DEFAULT_END));
    setDistance(resetDist);
    onDistanceChange?.(resetDist);
    mapRef.current?.fitToCoordinates(
      [start, DEFAULT_END],
      { edgePadding: { top: 100, right: 60, bottom: 80, left: 60 }, animated: true }
    );
  }, [gpsActive, startPosition, onDistanceChange]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Getting your position...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={40} color="#FF5252" />
        <Text style={styles.loadingText}>Location permission required</Text>
        <Text style={styles.loadingSubtext}>Enable location to use the GPS tool</Text>
      </View>
    );
  }

  const handleMapReady = () => {
    if (mapRef.current && dragEnd) {
      mapRef.current.fitToCoordinates(
        [startPosition, dragEnd],
        {
          edgePadding: { top: 100, right: 60, bottom: 80, left: 60 },
          animated: false,
        }
      );
    }
  };

  const initialRegion = {
    latitude: (startPosition.latitude + (dragEnd?.latitude ?? startPosition.latitude)) / 2,
    longitude: (startPosition.longitude + (dragEnd?.longitude ?? startPosition.longitude)) / 2,
    latitudeDelta: Math.abs((dragEnd?.latitude ?? startPosition.latitude) - startPosition.latitude) * 2.5 + 0.002,
    longitudeDelta: Math.abs((dragEnd?.longitude ?? startPosition.longitude) - startPosition.longitude) * 2.5 + 0.002,
  };

  const windDistText = adjustedDistance ? Math.round(adjustedDistance.adjustedDistance) : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        mapType="hybrid"
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {dragEnd && (
          <>
            <Polyline
              coordinates={[startPosition, dragEnd]}
              strokeColor="#FFFFFF"
              strokeWidth={3}
            />
            {weatherLine && (
              <>
                <Polyline
                  coordinates={[weatherLine.start, weatherLine.end]}
                  strokeColor="#FF9500"
                  strokeWidth={2}
                />
                <Marker
                  coordinate={weatherLine.end}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.orangeEndMarker}>
                    <View style={styles.orangeEndMarkerInner} />
                  </View>
                </Marker>
              </>
            )}
            <Marker
              coordinate={startPosition}
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
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.dragMarkerHitArea}>
                <View style={styles.dragMarkerOuter}>
                  <Move size={20} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.gpsToggle, gpsActive && styles.gpsToggleActive]}
        onPress={toggleGps}
        activeOpacity={0.7}
      >
        <Navigation size={18} color={gpsActive ? '#34C759' : '#FFFFFF'} fill={gpsActive ? '#34C759' : 'transparent'} />
        <Text style={[styles.gpsToggleText, gpsActive && styles.gpsToggleTextActive]}>
          GPS {gpsActive ? 'ON' : 'OFF'}
        </Text>
      </TouchableOpacity>

      <View style={styles.distanceOverlay}>
        <Text style={styles.distanceMainValue}>{distance}</Text>
        <Text style={styles.distanceMainUnit}>m</Text>
        {windDistText !== null && (
          <View style={styles.windDistRow}>
            <LinearGradient
              colors={['#FF9500', '#FF6B00', '#FF9500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.windDistGradientBg}
            >
              <Text style={styles.windDistValue}>{windDistText}</Text>
              <Text style={styles.windDistUnit}>m</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.toolLabel}>
        <Move size={14} color="#34C759" />
        <Text style={styles.toolLabelText}>Drag to measure</Text>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
        <RotateCcw size={18} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.zoomBtn}
        onPress={() => {
          if (dragEnd && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: dragEnd.latitude,
              longitude: dragEnd.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }, 600);
          }
        }}
        activeOpacity={0.7}
      >
        <ZoomIn size={18} color="#fff" />
      </TouchableOpacity>

      {weather && (
        <View style={styles.windBox}>
          <View style={styles.windArrowRow}>
            <View style={{ transform: [{ rotate: `${weather.windDeg}deg` }] }}>
              <ArrowUp size={16} color="#4FC3F7" />
            </View>
            <Text style={styles.windSpeedText}>{weather.windMs} m/s</Text>
          </View>
          <View style={styles.windDivider} />
          {adjustedDistance ? (
            <View style={styles.windDistInfoRow}>
              <Wind size={12} color="#FF9500" />
              <Text style={styles.windAdjText}>{Math.round(adjustedDistance.adjustedDistance)}m</Text>
            </View>
          ) : (
            <Text style={styles.windNoData}>--</Text>
          )}
        </View>
      )}
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
        <MapPin size={40} color="#34C759" />
      </View>
      <Text style={styles.webTitle}>GPS Map</Text>
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

export default function GPSTab({ onDistanceChange }: GPSTabProps) {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }
  return <NativeMap onDistanceChange={onDistanceChange} />;
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
  dragMarkerHitArea: {
    width: 90,
    height: 90,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dragMarkerOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  gpsToggle: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  gpsToggleActive: {
    borderColor: 'rgba(52,199,89,0.5)',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  gpsToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  gpsToggleTextActive: {
    color: '#34C759',
  },
  distanceOverlay: {
    position: 'absolute' as const,
    left: 16,
    top: 60,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  distanceMainValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900' as const,
    lineHeight: 52,
    letterSpacing: -1,
  },
  distanceMainUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: -4,
  },
  windDistRow: {
    marginTop: 8,
  },
  windDistGradientBg: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  windDistValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900' as const,
    lineHeight: 40,
    letterSpacing: -1,
  },
  windDistUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '700' as const,
    marginLeft: 3,
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
  orangeEndMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,149,0,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  orangeEndMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF9500',
    borderWidth: 2,
    borderColor: 'rgba(255,149,0,0.6)',
  },
  zoomBtn: {
    position: 'absolute' as const,
    bottom: 70,
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
  windBox: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.3)',
    minWidth: 72,
    alignItems: 'center' as const,
  },
  windArrowRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  windSpeedText: {
    color: '#4FC3F7',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  windDivider: {
    width: '100%' as const,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 6,
  },
  windDistInfoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  windAdjText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '800' as const,
  },
  windNoData: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600' as const,
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
    backgroundColor: '#34C759',
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
