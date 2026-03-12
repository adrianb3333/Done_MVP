import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Navigation, Crosshair } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText, Polygon } from 'react-native-svg';
import Colors from '@/constants/colors';
import { useWeather } from '@/hooks/useWeather';
import { calculateGolfShot } from '@/services/golfCalculations';

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


interface PositionTabProps {
  onDistanceChange?: (distance: number) => void;
  externalPinnedPosition?: Coordinate | null;
  onPinChange?: (pin: Coordinate | null) => void;
}

function NativeMap({ onDistanceChange, externalPinnedPosition, onPinChange }: PositionTabProps) {
  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');
  const Location = require('expo-location');

  const mapRef = useRef<any>(null);
  const locationSubRef = useRef<any>(null);

  const [userPosition, setUserPosition] = useState<Coordinate | null>(null);
  const [pinnedPosition, setPinnedPosition] = useState<Coordinate | null>(externalPinnedPosition ?? null);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);

  const { weather } = useWeather(geoLocation?.lat || null, geoLocation?.lon || null, 0);

  const adjustedDistance = useMemo(() => {
    if (!weather || distance <= 0) return null;
    return calculateGolfShot(distance, 'Normal', weather.windMs, weather.headTail, weather.cross, weather.temp, weather.pressureMb);
  }, [weather, distance]);



  useEffect(() => {
    let mounted = true;
    const Loc = Location;
    void (async () => {
      try {
        const { status } = await Loc.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          if (mounted) {
            setPermissionDenied(true);
            setLoading(false);
          }
          return;
        }
        const loc = await Loc.getCurrentPositionAsync({
          accuracy: Loc.Accuracy.High,
        });
        console.log('Got user location:', loc.coords.latitude, loc.coords.longitude);
        if (mounted) {
          const pos: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserPosition(pos);
          setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
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

  useEffect(() => {
    let sub: any = null;
    void (async () => {
      try {
        const Loc = require('expo-location');
        sub = await Loc.watchPositionAsync(
          { accuracy: Loc.Accuracy.High, distanceInterval: 1, timeInterval: 1000 },
          (loc: any) => {
            const newPos: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserPosition(newPos);
            setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          }
        );
        locationSubRef.current = sub;
      } catch (err) {
        console.log('Error watching position:', err);
      }
    })();
    return () => {
      if (locationSubRef.current?.remove) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (pinnedPosition && userPosition) {
      const dist = Math.round(haversineDistance(pinnedPosition, userPosition));
      setDistance(dist);
      onDistanceChange?.(dist);
    }
  }, [pinnedPosition, userPosition, onDistanceChange]);

  useEffect(() => {
    if (externalPinnedPosition && !pinnedPosition) {
      setPinnedPosition(externalPinnedPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPinnedPosition]);

  const handleSetPin = useCallback(() => {
    if (!userPosition) return;
    console.log('Set Pin at:', userPosition.latitude, userPosition.longitude);
    const newPin = { ...userPosition };
    setPinnedPosition(newPin);
    onPinChange?.(newPin);
    const dist = 0;
    setDistance(dist);
    onDistanceChange?.(dist);
  }, [userPosition, onDistanceChange, onPinChange]);

  const handleClearPin = useCallback(() => {
    console.log('Clearing pin');
    setPinnedPosition(null);
    onPinChange?.(null);
    setDistance(0);
    onDistanceChange?.(0);
  }, [onDistanceChange, onPinChange]);

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
        <Text style={styles.loadingSubtext}>Enable location to use the Position tool</Text>
      </View>
    );
  }

  const centerCoord = userPosition ?? { latitude: 0, longitude: 0 };

  const initialRegion = {
    latitude: centerCoord.latitude,
    longitude: centerCoord.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const handleMapReady = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.animateToRegion({
        latitude: userPosition.latitude,
        longitude: userPosition.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 300);
    }
  };

  const fitToBoth = () => {
    if (mapRef.current && pinnedPosition && userPosition) {
      mapRef.current.fitToCoordinates(
        [pinnedPosition, userPosition],
        { edgePadding: { top: 120, right: 60, bottom: 80, left: 60 }, animated: true }
      );
    }
  };

  const windDistText = adjustedDistance ? Math.round(adjustedDistance.adjustedDistance) : null;
  const windDeg = weather?.windDeg ?? 0;

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
        {pinnedPosition && (
          <>
            <Marker
              coordinate={pinnedPosition}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.pinMarker}>
                <View style={styles.pinMarkerInner} />
              </View>
            </Marker>

            {userPosition && (
              <Polyline
                coordinates={[pinnedPosition, userPosition]}
                strokeColor="#FFFFFF"
                strokeWidth={3}
              />
            )}
          </>
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.gpsToggle]}
        onPress={() => {
          if (userPosition && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: userPosition.latitude,
              longitude: userPosition.longitude,
              latitudeDelta: 0.003,
              longitudeDelta: 0.003,
            }, 500);
          }
        }}
        activeOpacity={0.7}
      >
        <Navigation size={18} color="#34C759" fill="#34C759" />
        <Text style={[styles.gpsToggleText, { color: '#34C759' }]}>My Location</Text>
      </TouchableOpacity>

      {pinnedPosition && (
        <View style={styles.distanceOverlay}>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceMainValue}>{distance}</Text>
            <Text style={styles.distanceMainUnit}>Meters</Text>
          </View>
          <Text style={styles.distanceLabel}>GPS Distance</Text>
          {windDistText !== null && (
            <View style={styles.windDistRow}>
              <Text style={styles.windDistValueOrange}>{windDistText}</Text>
              <Text style={styles.windDistUnitOrange}>Meters</Text>
            </View>
          )}
          {windDistText !== null && (
            <Text style={styles.windDistLabel}>Adjusted Weather Distance</Text>
          )}
        </View>
      )}

      {!pinnedPosition && (
        <View style={styles.toolLabel}>
          <Crosshair size={14} color="#34C759" />
          <Text style={styles.toolLabelText}>Tap "Set Pin" to start measuring</Text>
        </View>
      )}

      {pinnedPosition && (
        <TouchableOpacity style={styles.fitBtn} onPress={fitToBoth} activeOpacity={0.7}>
          <MapPin size={16} color="#fff" />
          <Text style={styles.fitBtnText}>Fit</Text>
        </TouchableOpacity>
      )}

      <View style={styles.setPinContainer}>
        {weather && (
          <View style={styles.miniCompassContainer}>
            <View style={{ transform: [{ rotate: `${-windDeg}deg` }] }}>
              <Svg height={64} width={64} viewBox="0 0 100 100">
                <Circle cx={50} cy={50} r={46} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} fill="none" />
                <Circle cx={50} cy={50} r={38} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} fill="none" />
                <Line x1={50} y1={4} x2={50} y2={14} stroke="white" strokeWidth={2} />
                <Line x1={96} y1={50} x2={86} y2={50} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
                <Line x1={50} y1={96} x2={50} y2={86} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
                <Line x1={4} y1={50} x2={14} y2={50} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
                <SvgText x={50} y={22} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">N</SvgText>
                <SvgText x={82} y={52} fill="rgba(255,255,255,0.5)" fontSize={8} textAnchor="middle" alignmentBaseline="middle">E</SvgText>
                <SvgText x={50} y={82} fill="rgba(255,255,255,0.5)" fontSize={8} textAnchor="middle" alignmentBaseline="middle">S</SvgText>
                <SvgText x={18} y={52} fill="rgba(255,255,255,0.5)" fontSize={8} textAnchor="middle" alignmentBaseline="middle">W</SvgText>
              </Svg>
            </View>
            <View style={styles.miniArrowOverlay}>
              <View style={{ transform: [{ rotate: `${windDeg}deg` }] }}>
                <Svg height={64} width={64} viewBox="0 0 100 100">
                  <Polygon points="50,22 60,70 40,70" fill="white" opacity={0.85} />
                </Svg>
              </View>
            </View>
          </View>
        )}

        {!pinnedPosition ? (
          <TouchableOpacity style={styles.setPinBtn} onPress={handleSetPin} activeOpacity={0.7}>
            <MapPin size={16} color="#fff" />
            <Text style={styles.setPinText}>Set Pin</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.clearPinBtn} onPress={handleClearPin} activeOpacity={0.7}>
            <MapPin size={16} color="#FF5252" />
            <Text style={styles.clearPinText}>Clear Pin</Text>
          </TouchableOpacity>
        )}
      </View>
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

export default function PositionTab({ onDistanceChange, externalPinnedPosition, onPinChange }: PositionTabProps) {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }
  return (
    <NativeMap
      onDistanceChange={onDistanceChange}
      externalPinnedPosition={externalPinnedPosition}
      onPinChange={onPinChange}
    />
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
  pinMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52,199,89,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(52,199,89,0.6)',
  },
  pinMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
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
    borderColor: 'rgba(52,199,89,0.4)',
  },
  gpsToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  distanceOverlay: {
    position: 'absolute' as const,
    left: 16,
    top: 90,
  },
  distanceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 6,
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
    fontSize: 16,
    fontWeight: '700' as const,
  },
  distanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  windDistRow: {
    marginTop: 10,
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  windDistValueOrange: {
    color: '#FF9500',
    fontSize: 36,
    fontWeight: '900' as const,
    lineHeight: 40,
    letterSpacing: -1,
  },
  windDistUnitOrange: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '700' as const,
    marginLeft: 4,
  },
  windDistLabel: {
    color: 'rgba(255,149,0,0.6)',
    fontSize: 10,
    fontWeight: '500' as const,
    marginTop: 2,
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
  fitBtn: {
    position: 'absolute' as const,
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  setPinContainer: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    alignItems: 'center' as const,
    gap: 10,
  },
  miniCompassContainer: {
    width: 64,
    height: 64,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  miniArrowOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 64,
    height: 64,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  setPinBtn: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  setPinText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  clearPinBtn: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.5)',
  },
  clearPinText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '700' as const,
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
