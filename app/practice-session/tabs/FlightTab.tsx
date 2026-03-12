import React, { useState, useEffect } from "react";
import { StyleSheet, ImageBackground, View, ScrollView, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';

import WindCompass from "@/components/WinCom/Index";
import BallFlightToggle from "@/components/WinCom/BallFlightToggle";
import DistanceInput from "@/components/WinCom/DistanceInput";
import AdjustedDistance from "@/components/WinCom/AdjustedDistance";
import StatCard from "@/components/reusables/StatCard";

import { useWeather } from "@/hooks/useWeather";
import { calculateGolfShot, GolfCalculationResult } from "@/services/golfCalculations";
import Colors from '@/constants/colors';

type FlightOption = 'Low' | 'Normal' | 'High';

interface FlightTabProps {
  externalDistance?: number;
}

export default function FlightTab({ externalDistance }: FlightTabProps) {
  const [ballFlight, setBallFlight] = useState<FlightOption>('Normal');
  const [distance, setDistance] = useState<string>('');
  const [targetHeading] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  
  const { weather, loading } = useWeather(userLocation?.lat || null, userLocation?.lon || null, targetHeading);
  const [calculation, setCalculation] = useState<GolfCalculationResult | null>(null);

  useEffect(() => {
    if (externalDistance && externalDistance > 0) {
      setDistance(String(externalDistance));
    }
  }, [externalDistance]);

  useEffect(() => {
    const distanceNum = parseFloat(distance);
    if (weather && distanceNum > 0) {
      const result = calculateGolfShot(
        distanceNum,
        ballFlight,
        weather.windMs,
        weather.headTail,
        weather.cross,
        weather.temp,
        weather.pressureMb
      );
      setCalculation(result);
    } else {
      setCalculation(null);
    }
  }, [distance, ballFlight, weather]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setUserLocation({ lat: 59.3293, lon: 18.0686 });
      return;
    }

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation({ lat: 59.3293, lon: 18.0686 });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch {
        setUserLocation({ lat: 59.3293, lon: 18.0686 });
      }
    };

    void getLocation();
    const interval = setInterval(getLocation, 60000);
    return () => clearInterval(interval);
  }, []); 

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2og1gfzbpfgrdjyzujhyg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.compassWrapper}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.white || "#ffffff"} />
            ) : (
              <WindCompass windDirectionFromAPI={weather?.windDeg || 0} />
            )}
          </View>

          <BallFlightToggle 
            selected={ballFlight} 
            onSelect={setBallFlight} 
          />

          <View style={styles.distanceRow}>
            <View style={styles.distanceInputWrapper}>
              <DistanceInput 
                value={distance} 
                onChange={setDistance}
                label="Distance to target (m)"
              />
            </View>
            
            {calculation && (
              <View style={styles.adjustedDistanceWrapper}>
                <AdjustedDistance
                  adjustedDistance={calculation.adjustedDistance}
                  originalDistance={calculation.originalDistance}
                  windAdjustment={calculation.windAdjustment}
                  tempAdjustment={calculation.tempAdjustment}
                  crosswindDrift={calculation.crosswindDrift}
                />
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard label="Wind💨" value={weather ? `${weather.windMs} m/s` : '-- m/s'} />
              <StatCard label="Sea Level🏔️" value={weather ? `${weather.seaLevel}m` : '--m'} />
              <StatCard label="Temp☀️" value={weather ? `${weather.temp}°C` : '--°C'} />
            </View>
            
            <View style={styles.statsRow}>
              <StatCard label="Speed🏎️" value={weather ? `${weather.windMs} m/s` : '-- m/s'} />
              <StatCard label="From" value={weather ? `${weather.windDeg}°` : '--°'} />
              <StatCard label="Gust" value={weather ? `${weather.gustMs} m/s` : '-- m/s'} />
            </View>
            
            <View style={styles.statsRow}>
              <StatCard label="Cross" value={weather ? `${weather.cross > 0 ? '+' : ''}${weather.cross} m/s` : '-- m/s'} />
              <StatCard label="Head/Tail" value={weather ? `${weather.headTail > 0 ? '+' : ''}${weather.headTail} m/s` : '-- m/s'} />
              <StatCard label="Update" value={weather?.lastUpdated || '--:--'} />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#020d12',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  compassWrapper: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 30,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  distanceRow: {
    width: '100%' as const,
  },
  distanceInputWrapper: {
    width: '100%' as const,
  },
  adjustedDistanceWrapper: {
    width: '100%' as const,
  },
});
