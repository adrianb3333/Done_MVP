import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AppNavigationProvider, useAppNavigation } from "@/contexts/AppNavigationContext";
import { UserDataProvider } from "@/hooks/useUserData";
import PlaySessionTabs from "@/app/play-session/PlaySessionTabs";
import PracticeSessionTabs from "@/app/practice-session/PracticeSessionTabs";
import MiniSessionModal from "@/components/MiniSessionModal";
import Sidebar from "@/components/Sidebar";
import DataOverviewScreen from "@/components/DataOverviewScreen";
import CommunityScreen from "@/components/CommunityScreen";
import ProfileScreen from "@/app/(tabs)/profile";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import PracticeSummary from "@/components/PracticeSummary";

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

const queryClient = new QueryClient();

function AppContent() {
  const { sessionState, sessionType, showPracticeSummary } = useSession();
  const { currentSection } = useAppNavigation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const prevSessionRef = useRef<Session | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Supabase auth timeout, continuing anyway');
      setLoading(false);
    }, 3000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Supabase session loaded:', !!session);
        clearTimeout(timeout);
        if (session && isInitialLoadRef.current) {
          prevSessionRef.current = session;
          setShowOnboarding(true);
        }
        isInitialLoadRef.current = false;
        setSession(session);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Supabase error:', error);
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', !!session);
      if (session && !prevSessionRef.current && isInitialLoadRef.current) {
        console.log('User just logged in, showing onboarding');
        setShowOnboarding(true);
      }
      prevSessionRef.current = session;
      setSession(session);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, loading, router]);

  if (loading) {
    return <View style={styles.container} />;
  }

  if (showPracticeSummary) {
    return <PracticeSummary />;
  }

  if (sessionState === 'active') {
    if (sessionType === 'play') {
      return <PlaySessionTabs />;
    }
    if (sessionType === 'practice') {
      return <PracticeSessionTabs />;
    }
  }

  if (sessionState === 'minimized') {
    return (
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <ProfileScreen />
        </View>
        <MiniSessionModal />
        <Sidebar />
      </View>
    );
  }

  if (currentSection === 'data-overview') {
    return (
      <View style={styles.container}>
        <DataOverviewScreen />
        <Sidebar />
      </View>
    );
  }

  if (currentSection === 'community') {
    return (
      <View style={styles.container}>
        <CommunityScreen />
        <Sidebar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#020d12' }
        }}
      >
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* MODAL CONFIGURATIONS */}
        <Stack.Screen 
          name="modals/club-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/swing-thoughts-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="modals/mental-game-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="modals/vid-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/friends-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/course-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/news-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/recap-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/roundsum-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/pair-impact-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/handicap-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/qr-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/compare-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        {/* End Modals */}

        <Stack.Screen 
          name="play-setup" 
          options={{ 
            headerShown: false, 
            presentation: "fullScreenModal",
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="practice-setup" 
          options={{ 
            headerShown: false, 
            presentation: "fullScreenModal",
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false, 
            presentation: "fullScreenModal",
            animation: "slide_from_right"
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Sidebar />
      <OnboardingOverlay
        visible={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
      />
    </View>
  );
}

function RootLayoutNav() {
  return <AppContent />;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SessionProvider>
          <ProfileProvider>
            <AppNavigationProvider>
              <UserDataProvider>
                <RootLayoutNav />
              </UserDataProvider>
            </AppNavigationProvider>
          </ProfileProvider>
        </SessionProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d12', // Ensure root container is dark
  },
  profileContainer: {
    flex: 1,
  },
});