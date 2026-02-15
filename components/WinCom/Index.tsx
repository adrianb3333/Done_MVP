import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useDerivedValue, withSpring, useSharedValue } from 'react-native-reanimated';
import * as Location from 'expo-location';
import CompassRing from './CompassRing';
import WindArrow from './WindArrow';

export default function WindCompass({ windDirectionFromAPI }: { windDirectionFromAPI: number }) {
  const deviceHeading = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('[WindCompass] Web platform detected, skipping location services');
      return;
    }

    let headingSubscription: Location.LocationSubscription | null = null;

    const setupHeading = async () => {
      try {
        console.log('[WindCompass] Requesting location permissions...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.warn('[WindCompass] Location permission denied');
          return;
        }

        console.log('[WindCompass] Location permission granted, starting heading watch...');

        headingSubscription = await Location.watchHeadingAsync((headingData) => {
          const trueHeading = headingData.trueHeading;
          console.log('[WindCompass] True heading updated:', trueHeading);
          deviceHeading.value = trueHeading;
        });

        console.log('[WindCompass] Heading watch started successfully');
      } catch (error) {
        console.error('[WindCompass] Error setting up heading:', error);
      }
    };

    setupHeading();

    return () => {
      if (headingSubscription) {
        console.log('[WindCompass] Cleaning up heading subscription');
        headingSubscription.remove();
      }
    };
  }, [deviceHeading]);

  const ringRotation = useDerivedValue(() => {
    return withSpring(-deviceHeading.value, { damping: 20, stiffness: 150 });
  });

  const arrowRotation = useDerivedValue(() => {
    return withSpring(windDirectionFromAPI - deviceHeading.value, { damping: 15, stiffness: 150 });
  });

  return (
    <View style={styles.container}>
      <CompassRing rotationStyle={ringRotation} />
      <WindArrow rotationStyle={arrowRotation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
