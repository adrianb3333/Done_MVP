import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { User } from 'lucide-react-native';
import { useSession } from '@/contexts/SessionContext';

function PlayTabIcon() {
  return (
    <View style={tabStyles.flatCircle}>
      <View style={[tabStyles.flatCircleInner, { backgroundColor: '#2E9E4B' }]}> 
        <Text style={tabStyles.flatCircleText}>PLAY</Text>
      </View>
    </View>
  );
}

function PracticeTabIcon() {
  return (
    <View style={tabStyles.flatCircle}>
      <View style={[tabStyles.flatCircleInner, { backgroundColor: '#1A7FD4' }]}> 
        <Text style={tabStyles.flatCircleText}>PRACTICE</Text>
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
  flatCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginTop: -14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  flatCircleInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  flatCircleText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
