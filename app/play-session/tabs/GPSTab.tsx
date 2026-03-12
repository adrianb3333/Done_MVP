import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Move, RotateCcw, ZoomIn, Navigation, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useWeather } from '@/hooks/useWeather';
import { calculateGolfShot } from '@/services/golfCalculations';
import { useScoring } from '@/contexts/ScoringContext';
import { loadCourseLocation } from '@/mocks/courseData';
import type { CourseLocation } from '@/mocks/courseData';

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

function offsetCoordinate(base: Coordinate, bearingDeg: number, distanceMeters: number): Coordinate {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(base.latitude);
  const lon1 = toRad(base.longitude);
  const bearing = toRad(bearingDeg);
  const d = distanceMeters / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
  const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { latitude: toDeg(lat2), longitude: toDeg(lon2) };
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
  const { holes } = useScoring();

  const mapRef = useRef<any>(null);
  const locationWatchRef = useRef<any>(null);
  const [courseLocation, setCourseLocation] = useState<CourseLocation | null>(null);
  const [currentGpsHoleIndex, setCurrentGpsHoleIndex] = useState<number>(0);
  const [startPosition, setStartPosition] = useState<Coordinate | null>(null);
  const [endPosition, setEndPosition] = useState<Coordinate | null>(null);
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

  const holeCoordinates = useMemo(() => {
    if (!courseLocation?.latitude || !courseLocation?.longitude) return [];
    const baseCoord: Coordinate = { latitude: courseLocation.latitude, longitude: courseLocation.longitude };

    return holes.map((hole) => {
      const tee = baseCoord;
      const greenDistMeters = hole.distance > 0 ? hole.distance * 0.9144 : 350;
      const green = offsetCoordinate(tee, 0, greenDistMeters);
      return { tee, green, hole };
    });
  }, [courseLocation, holes]);

  const currentGpsHole = useMemo(() => {
    if (holeCoordinates.length === 0) return null;
    return holeCoordinates[currentGpsHoleIndex] ?? null;
  }, [holeCoordinates, currentGpsHoleIndex]);

  const currentHoleData = useMemo(() => {
    if (currentGpsHoleIndex < holes.length) return holes[currentGpsHoleIndex];
    return null;
  }, [holes, currentGpsHoleIndex]);

  useEffect(() => {
    void loadCourseAndLocation();
  }, []);

  const loadCourseAndLocation = async () => {
    try {
      const loc = await loadCourseLocation();
      if (loc && loc.latitude && loc.longitude) {
        console.log('[GPSTab] Loaded course location:', loc.latitude, loc.longitude);
        setCourseLocation(loc);
      } else {
        console.log('[GPSTab] No course location found, using user location');
      }
    } catch (e) {
      console.log('[GPSTab] Error loading course location:', e);
    }
    void initLocation();
  };

  const initLocation = async () => {
    const LocationModule = require('expo-location');
    try {
      const { status } = await LocationModule.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      const loc = await LocationModule.getCurrentPositionAsync({
        accuracy: LocationModule.Accuracy.High,
      });
      console.log('Got user location:', loc.coords.latitude, loc.coords.longitude);
      setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      setLoading(false);
    } catch (err) {
      console.log('Error getting location:', err);
      setPermissionDenied(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && currentGpsHole) {
      const tee = currentGpsHole.tee;
      const green = currentGpsHole.green;
      setStartPosition(tee);
      setEndPosition(green);
      setDragEnd(green);
      const dist = Math.round(haversineDistance(tee, green));
      setDistance(dist);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [tee, green],
          { edgePadding: { top: 140, right: 60, bottom: 100, left: 60 }, animated: true }
        );
      }
    }
  }, [loading, currentGpsHole]);

  const handleNextHole = useCallback(() => {
    if (currentGpsHoleIndex < holes.length - 1) {
      setPinnedPosition(null);
      setGpsActive(false);
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
      setCurrentGpsHoleIndex((prev) => prev + 1);
    }
  }, [currentGpsHoleIndex, holes.length]);

  const handlePrevHole = useCallback(() => {
    if (currentGpsHoleIndex > 0) {
      setPinnedPosition(null);
      setGpsActive(false);
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
      setCurrentGpsHoleIndex((prev) => prev - 1);
    }
  }, [currentGpsHoleIndex]);

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
      if (currentGpsHole) {
        setStartPosition(currentGpsHole.tee);
        setDragEnd(currentGpsHole.green);
        const dist = Math.round(haversineDistance(currentGpsHole.tee, currentGpsHole.green));
        setDistance(dist);
      }
    }
  }, [pinnedPosition, startLocationWatch, stopLocationWatch, currentGpsHole]);

  const handleDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setDragEnd(newCoord);
    if (startPosition) {
      const dist = Math.round(haversineDistance(startPosition, newCoord));
      setDistance(dist);
    }
  }, [startPosition]);

  const handleDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('Drag ended at:', newCoord.latitude, newCoord.longitude);
    setDragEnd(newCoord);
    if (startPosition) {
      const dist = Math.round(haversineDistance(startPosition, newCoord));
      setDistance(dist);
    }
  }, [startPosition]);

  const handleReset = useCallback(() => {
    if (pinnedPosition || !currentGpsHole) return;
    setStartPosition(currentGpsHole.tee);
    setDragEnd(currentGpsHole.green);
    const resetDist = Math.round(haversineDistance(currentGpsHole.tee, currentGpsHole.green));
    setDistance(resetDist);
    mapRef.current?.fitToCoordinates(
      [currentGpsHole.tee, currentGpsHole.green],
      { edgePadding: { top: 140, right: 60, bottom: 100, left: 60 }, animated: true }
    );
  }, [pinnedPosition, currentGpsHole]);

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

  const displayStart = startPosition ?? { latitude: 0, longitude: 0 };
  const displayEnd = dragEnd ?? endPosition ?? displayStart;

  const initialRegion = {
    latitude: (displayStart.latitude + displayEnd.latitude) / 2,
    longitude: (displayStart.longitude + displayEnd.longitude) / 2,
    latitudeDelta: Math.abs(displayEnd.latitude - displayStart.latitude) * 2.5 + 0.002,
    longitudeDelta: Math.abs(displayEnd.longitude - displayStart.longitude) * 2.5 + 0.002,
  };

  const handleMapReady = () => {
    if (mapRef.current && startPosition && dragEnd) {
      mapRef.current.fitToCoordinates(
        [startPosition, dragEnd],
        { edgePadding: { top: 140, right: 60, bottom: 100, left: 60 }, animated: false }
      );
    }
  };

  const windDistText = adjustedDistance ? Math.round(adjustedDistance.adjustedDistance) : null;
  const isFirstHole = currentGpsHoleIndex === 0;
  const isLastHole = currentGpsHoleIndex === holes.length - 1;

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
        {startPosition && dragEnd && (
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

      <View style={[styles.holeHeader, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.holeNavArrow, isFirstHole && styles.holeNavArrowDisabled]}
          onPress={handlePrevHole}
          disabled={isFirstHole}
          activeOpacity={0.6}
        >
          <ChevronLeft size={22} color={isFirstHole ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
        </TouchableOpacity>

        <View style={styles.holeHeaderCenter}>
          <Text style={styles.holeHeaderTitle}>
            Hole {currentHoleData?.number ?? currentGpsHoleIndex + 1}
          </Text>
          <Text style={styles.holeHeaderPar}>
            PAR {currentHoleData?.par ?? '-'} • {currentHoleData?.distance ?? '-'} yds
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.holeNavArrow, isLastHole && styles.holeNavArrowDisabled]}
          onPress={handleNextHole}
          disabled={isLastHole}
          activeOpacity={0.6}
        >
          <ChevronRight size={22} color={isLastHole ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.gpsToggle, { top: insets.top + 64 }]}
        onPress={handleSetPin}
        activeOpacity={0.7}
      >
        <Navigation size={18} color={gpsActive ? '#34C759' : '#FFFFFF'} fill={gpsActive ? '#34C759' : 'transparent'} />
        <Text style={[styles.gpsToggleText, gpsActive && styles.gpsToggleTextActive]}>
          {pinnedPosition ? 'Remove Pin' : 'Set Pin'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.distanceOverlay, { top: insets.top + 104 }]}>
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
        <View style={[styles.miniCompassBox, { top: insets.top + 64 }]}>
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
  holeHeader: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  holeNavArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  holeNavArrowDisabled: {
    opacity: 0.4,
  },
  holeHeaderCenter: {
    alignItems: 'center' as const,
    flex: 1,
  },
  holeHeaderTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  holeHeaderPar: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
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
