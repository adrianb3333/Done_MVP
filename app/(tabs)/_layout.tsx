import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/contexts/SessionContext';

function PlayTabIcon() {
  return (
    <View style={tabStyles.circleWrapper}>
      <LinearGradient
        colors={['#4BA35B', '#3D954D', '#2D803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={tabStyles.circleGradient}
      >
        <Text style={tabStyles.circleText}>PLAY</Text>
      </LinearGradient>
    </View>
  );
}

function PracticeTabIcon() {
  return (
    <View style={tabStyles.circleWrapper}>
      <LinearGradient
        colors={['#1C8CFF', '#1075E3', '#0059B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={tabStyles.circleGradient}
      >
        <Text style={tabStyles.circleText}>PRACTICE</Text>
      </LinearGradient>
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
  circleWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden' as const,
    marginTop: -14,
  },
  circleGradient: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 40,
  },
  circleText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
