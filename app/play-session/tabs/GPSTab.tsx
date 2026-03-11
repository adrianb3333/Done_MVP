import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Move, RotateCcw, ZoomIn, Navigation } from 'lucide-react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
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

interface MiniCompassProps {
  windDeg: number;
  windMs: number;
}

const MINI_CENTER = 32;
const MINI_RADIUS = 28;
const MINI_TEXT_R = 18;

function MiniWindCompass({ windDeg, windMs }: MiniCompassProps) {
  const MARKERS = [
    { deg: 0, label: 'N' },
    { deg: 90, label: 'E' },
    { deg: 180, label: 'S' },
    { deg: 270, label: 'W' },
  ];

  const pos = (degree: number, radius: number) => {
    const rad = ((degree - 90) * Math.PI) / 180;
    return { x: MINI_CENTER + radius * Math.cos(rad), y: MINI_CENTER + radius * Math.sin(rad) };
  };

  const arrowRad = ((windDeg - 90) * Math.PI) / 180;
  const tipR = MINI_RADIUS - 4;
  const baseR = 8;
  const tipX = MINI_CENTER + tipR * Math.cos(arrowRad);
  const tipY = MINI_CENTER + tipR * Math.sin(arrowRad);
  const leftRad = arrowRad + Math.PI - 0.35;
  const rightRad = arrowRad + Math.PI + 0.35;
  const lx = MINI_CENTER + baseR * Math.cos(leftRad);
  const ly = MINI_CENTER + baseR * Math.sin(leftRad);
  const rx = MINI_CENTER + baseR * Math.cos(rightRad);
  const ry = MINI_CENTER + baseR * Math.sin(rightRad);

  return (
    <View style={miniStyles.wrapper}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Circle cx={MINI_CENTER} cy={MINI_CENTER} r={MINI_RADIUS} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
        <Circle cx={MINI_CENTER} cy={MINI_CENTER} r={MINI_RADIUS - 6} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
        {MARKERS.map(({ deg, label }) => {
          const outer = pos(deg, MINI_RADIUS);
          const inner = pos(deg, MINI_RADIUS - 5);
          const textP = pos(deg, MINI_TEXT_R);
          return (
            <React.Fragment key={deg}>
              <Line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth={deg === 0 ? '2' : '1'} />
              <SvgText x={textP.x} y={textP.y} fill="white" fontSize="7" fontWeight={deg === 0 ? 'bold' : '500'} textAnchor="middle" alignmentBaseline="middle">
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Polygon points={`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`} fill="white" opacity="0.85" />
      </Svg>
      <Text style={miniStyles.speedText}>{windMs} m/s</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center' as const,
  },
  speedText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600' as const,
    marginTop: 2,
  },
});

interface GPSTabProps {
  onDistanceChange?: (distance: number) => void;
  onAdjustedDistanceChange?: (adjustedDistance: number) => void;
}

function NativeMap({ onDistanceChange, onAdjustedDistanceChange }: GPSTabProps) {
  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');
  const insets = useSafeAreaInsets();

  const mapRef = useRef<any>(null);
  const locationWatchRef = useRef<any>(null);
  const [startPosition, setStartPosition] = useState<Coordinate>(DEFAULT_START);
  const [dragEnd, setDragEnd] = useState<Coordinate | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [pinnedPosition, setPinnedPosition] = useState<Coordinate | null>(null);

  const { weather } = useWeather(geoLocation?.lat || null, geoLocation?.lon || null, 0);

  const adjustedDistance = useMemo(() => {
    if (!weather || distance <= 0) return null;
    return calculateGolfShot(distance, 'Normal', weather.windMs, weather.headTail, weather.cross, weather.temp);
  }, [weather, distance]);

  useEffect(() => {
    if (adjustedDistance) {
      onAdjustedDistanceChange?.(Math.round(adjustedDistance.adjustedDistance));
    }
  }, [adjustedDistance, onAdjustedDistanceChange]);

  useEffect(() => {
    if (distance > 0) {
      onDistanceChange?.(distance);
    }
  }, [distance, onDistanceChange]);

  useEffect(() => {
    const LocationModule = require('expo-location');
    let mounted = true;
    void (async () => {
      try {
        const { status } = await LocationModule.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          if (mounted) {
            setPermissionDenied(true);
            setLoading(false);
          }
          return;
        }
        const loc = await LocationModule.getCurrentPositionAsync({
          accuracy: LocationModule.Accuracy.High,
        });
        console.log('Got user location:', loc.coords.latitude, loc.coords.longitude);
        if (mounted) {
          const userCoord: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          setStartPosition(userCoord);
          setDragEnd(DEFAULT_END);
          const initialDist = Math.round(haversineDistance(userCoord, DEFAULT_END));
          setDistance(initialDist);
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

  const startLocationWatch = useCallback(async (pinCoord: Coordinate) => {
    const Loc = require('expo-location');
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
    try {
      const sub = await Loc.watchPositionAsync(
        { accuracy: Loc.Accuracy.High, distanceInterval: 1, timeInterval: 2000 },
        (loc: any) => {
          const current: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const dist = Math.round(haversineDistance(pinCoord, current));
          console.log('Live location update - distance from pin:', dist, 'm');
          setStartPosition(pinCoord);
          setDragEnd(current);
          setDistance(dist);
          setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        }
      );
      locationWatchRef.current = sub;
    } catch (err) {
      console.log('Error starting location watch:', err);
    }
  }, []);

  const stopLocationWatch = useCallback(() => {
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopLocationWatch();
    };
  }, [stopLocationWatch]);

  const handleSetPin = useCallback(async () => {
    const Loc = require('expo-location');
    if (!pinnedPosition) {
      try {
        const loc = await Loc.getCurrentPositionAsync({ accuracy: Loc.Accuracy.High });
        const pinCoord: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        console.log('Pin set at:', pinCoord.latitude, pinCoord.longitude);
        setPinnedPosition(pinCoord);
        setStartPosition(pinCoord);
        setGpsActive(true);
        void startLocationWatch(pinCoord);
      } catch (err) {
        console.log('Error setting pin:', err);
      }
    } else {
      console.log('Pin removed');
      setPinnedPosition(null);
      setGpsActive(false);
      stopLocationWatch();
      setStartPosition(DEFAULT_START);
      setDragEnd(DEFAULT_END);
      const dist = Math.round(haversineDistance(DEFAULT_START, DEFAULT_END));
      setDistance(dist);
    }
  }, [pinnedPosition, startLocationWatch, stopLocationWatch]);

  const handleDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setDragEnd(newCoord);
    const dist = Math.round(haversineDistance(startPosition, newCoord));
    setDistance(dist);
  }, [startPosition]);

  const handleDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('Drag ended at:', newCoord.latitude, newCoord.longitude);
    setDragEnd(newCoord);
    const dist = Math.round(haversineDistance(startPosition, newCoord));
    setDistance(dist);
  }, [startPosition]);

  const handleReset = useCallback(() => {
    if (pinnedPosition) {
      return;
    }
    setDragEnd(DEFAULT_END);
    setStartPosition(DEFAULT_START);
    const resetDist = Math.round(haversineDistance(DEFAULT_START, DEFAULT_END));
    setDistance(resetDist);
    mapRef.current?.fitToCoordinates(
      [DEFAULT_START, DEFAULT_END],
      { edgePadding: { top: 100, right: 60, bottom: 80, left: 60 }, animated: true }
    );
  }, [pinnedPosition]);

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
            <Marker
              coordinate={startPosition}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.startMarker}>
                <View style={styles.startMarkerInner} />
              </View>
            </Marker>
            {!pinnedPosition && (
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
            )}
          </>
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.gpsToggle, gpsActive && styles.gpsToggleActive, { top: insets.top + 12 }]}
        onPress={handleSetPin}
        activeOpacity={0.7}
      >
        <Navigation size={18} color={gpsActive ? '#34C759' : '#FFFFFF'} fill={gpsActive ? '#34C759' : 'transparent'} />
        <Text style={[styles.gpsToggleText, gpsActive && styles.gpsToggleTextActive]}>
          {pinnedPosition ? 'Remove Pin' : 'Set Pin'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.distanceOverlay, { top: insets.top + 52 }]}>
        <Text style={styles.distanceMainValue}>{distance}</Text>
        <Text style={styles.distanceMainUnit}>m</Text>
        {windDistText !== null && (
          <View style={styles.windDistRow}>
            <Text style={styles.windDistValueOrange}>{windDistText}</Text>
            <Text style={styles.windDistUnitOrange}>m</Text>
            <Text style={styles.windDistSubtext}>Adjusted based on weather data</Text>
          </View>
        )}
      </View>

      {!pinnedPosition && (
        <View style={styles.toolLabel}>
          <Move size={14} color="#34C759" />
          <Text style={styles.toolLabelText}>Drag to measure</Text>
        </View>
      )}

      {pinnedPosition && (
        <View style={styles.toolLabel}>
          <Navigation size={14} color="#34C759" />
          <Text style={styles.toolLabelText}>Pin set - walk to update distance</Text>
        </View>
      )}

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
        <View style={[styles.miniCompassBox, { top: insets.top + 12 }]}>
          <MiniWindCompass windDeg={weather.windDeg} windMs={weather.windMs} />
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

export default function GPSTab({ onDistanceChange, onAdjustedDistanceChange }: GPSTabProps) {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }
  return <NativeMap onDistanceChange={onDistanceChange} onAdjustedDistanceChange={onAdjustedDistanceChange} />;
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
  },
  distanceMainValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900' as const,
    lineHeight: 52,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  distanceMainUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: -4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  windDistRow: {
    marginTop: 4,
  },
  windDistValueOrange: {
    color: '#FF9500',
    fontSize: 36,
    fontWeight: '900' as const,
    lineHeight: 40,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  windDistUnitOrange: {
    color: 'rgba(255,149,0,0.75)',
    fontSize: 16,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  windDistSubtext: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 8,
    fontWeight: '500' as const,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  miniCompassBox: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
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
