import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export default function WindArrow({ rotationStyle }: { rotationStyle: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationStyle.value}deg` }],
  }));

  const Container = Platform.OS !== 'web' ? Animated.View : View;
  const containerStyle = Platform.OS !== 'web' ? [styles.container, animatedStyle] : styles.container;

  return (
    <Container style={containerStyle} pointerEvents="none">
      <Svg height="300" width="300" viewBox="0 0 300 300">
        <Defs>
          <RadialGradient id="glow" cx="150" cy="150" rx="40" ry="40" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="white" stopOpacity="0.25" />
            <Stop offset="1" stopColor="white" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="150" cy="150" r="36" fill="url(#glow)" />
        <Path
          d="M150,30 L157,130 L150,140 L143,130 Z"
          fill="white"
          opacity="0.92"
        />
        <Path
          d="M150,270 L156,175 L150,165 L144,175 Z"
          fill="white"
          opacity="0.35"
        />
        <Circle cx="150" cy="150" r="5" fill="white" opacity="0.9" />
      </Svg>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
