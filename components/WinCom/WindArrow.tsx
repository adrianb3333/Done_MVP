import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

export default function WindArrow({ rotationStyle }: { rotationStyle: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationStyle.value}deg` }],
  }));

  const Container = Platform.OS !== 'web' ? Animated.View : View;
  const containerStyle = Platform.OS !== 'web' ? [styles.container, animatedStyle] : styles.container;

  return (
    <Container style={containerStyle} pointerEvents="none">
      <Svg height="300" width="300" viewBox="0 0 100 100">
        <Polygon points="50,15 75,85 25,85" fill="white" opacity="0.9" />
      </Svg>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
