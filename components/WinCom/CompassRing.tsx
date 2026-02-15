import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

interface DegreeMarker {
  degree: number;
  label: string;
}

const DEGREE_MARKERS: DegreeMarker[] = [
  { degree: 0, label: 'N' },
  { degree: 90, label: 'E' },
  { degree: 180, label: 'S' },
  { degree: 270, label: 'W' },
];

const CENTER = 150;
const RADIUS = 140;
const TICK_LENGTH = 15;
const TEXT_RADIUS = 115;

export default function CompassRing({ rotationStyle }: { rotationStyle: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationStyle.value}deg` }],
  }));

  const Container = Platform.OS !== 'web' ? Animated.View : View;
  const containerStyle = Platform.OS !== 'web' ? [styles.fullSize, animatedStyle] : styles.fullSize;

  const calculatePosition = (degree: number, radius: number) => {
    const radian = ((degree - 90) * Math.PI) / 180;
    return {
      x: CENTER + radius * Math.cos(radian),
      y: CENTER + radius * Math.sin(radian),
    };
  };

  return (
    <Container style={containerStyle}>
      <Svg height="300" width="300" viewBox="0 0 300 300">
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          fill="none"
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r="130"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          fill="none"
        />

        {DEGREE_MARKERS.map(({ degree, label }) => {
          const outerPos = calculatePosition(degree, RADIUS);
          const innerPos = calculatePosition(degree, RADIUS - TICK_LENGTH);
          const textPos = calculatePosition(degree, TEXT_RADIUS);
          const isNorth = degree === 0;

          return (
            <React.Fragment key={degree}>
              <Line
                x1={outerPos.x}
                y1={outerPos.y}
                x2={innerPos.x}
                y2={innerPos.y}
                stroke="white"
                strokeWidth={isNorth ? "3" : "2"}
              />
              <SvgText
                x={textPos.x}
                y={textPos.y}
                fill="white"
                fontSize={isNorth ? "20" : "16"}
                fontWeight={isNorth ? "bold" : "600"}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label}
              </SvgText>
              <SvgText
                x={textPos.x}
                y={textPos.y + 20}
                fill="rgba(255,255,255,0.6)"
                fontSize="12"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {degree}°
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </Container>
  );
}

const styles = StyleSheet.create({
  fullSize: { position: 'absolute', width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
});
