import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/contexts/SessionContext';

function PlayTabIcon() {
  return (
    <View style={tabStyles.outerRing}>
      <View style={tabStyles.circleWrapper}>
        <LinearGradient
          colors={['#3A9E4A', '#2D803D', '#1B6B2D', '#145222']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={tabStyles.circleGradient}
        >
          <View style={tabStyles.innerHighlight} />
          <Text style={tabStyles.circleText}>PLAY</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

function PracticeTabIcon() {
  return (
    <View style={tabStyles.outerRing}>
      <View style={tabStyles.circleWrapper}>
        <LinearGradient
          colors={['#1A8CE6', '#0A6FC2', '#004A99', '#003366']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={tabStyles.circleGradient}
        >
          <View style={tabStyles.innerHighlight} />
          <Text style={tabStyles.circleText}>PRACTICE</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { sessionState, startSetup } = useSession();
  const isMinimized = sessionState === 'minimized';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'transparent',

          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 0,
          height: 0,
        },
      }}
    >
      <Tabs.Screen
        name="play"
        options={{
          title: '',
          tabBarIcon: () => <PlayTabIcon />,
          href: isMinimized ? null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            startSetup('play');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <User size={42} color={focused ? '#1A1A1A' : '#9E9E9E'} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: '',
          tabBarIcon: () => <PracticeTabIcon />,
          href: isMinimized ? null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            startSetup('practice');
          },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  outerRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginTop: -14,
    backgroundColor: '#E8E8E8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  circleWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden' as const,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderRightColor: 'rgba(0,0,0,0.08)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  circleGradient: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 38,
  },
  innerHighlight: {
    position: 'absolute' as const,
    top: 3,
    left: 8,
    right: 8,
    height: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
});
