import React from 'react';
import { Tabs } from 'expo-router';
import { Play, User, Target } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';

export default function TabLayout() {
  const { sessionState, startSetup } = useSession();
  const isMinimized = sessionState === 'minimized';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        // Hiding the header globally so your custom UI can take over
        headerShown: false, 
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingTop: 8,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="play"
        options={{
          title: 'PLAY',
          tabBarIcon: ({ color, size }) => <Play color={color} size={size} />,
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
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'PRACTICE',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
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
