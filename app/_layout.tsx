import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform, Image, Animated, Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AppNavigationProvider, useAppNavigation } from "@/contexts/AppNavigationContext";
import { UserDataProvider } from "@/hooks/useUserData";
import { SensorProvider } from "@/contexts/SensorContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { BattleProvider } from "@/contexts/BattleContext";
import { BagProvider } from "@/contexts/BagContext";
import BattleInviteBanner from "@/components/BattleInviteBanner";
import PlaySessionTabs from "@/app/play-session/PlaySessionTabs";
import PracticeSessionTabs from "@/app/practice-session/PracticeSessionTabs";
import MiniSessionModal from "@/components/MiniSessionModal";
import Sidebar from "@/components/Sidebar";
import DataOverviewScreen from "@/components/DataOverviewScreen";
import CommunityScreen from "@/components/CommunityScreen";
import CrewScreen from "@/components/CrewScreen";
import WeatherScreen from "@/components/WeatherScreen";
import ProfileScreen from "@/app/(tabs)/profile";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import PracticeSummary from "@/components/PracticeSummary";
import CrewEventBanner from "@/components/CrewEventBanner";
import CrewDrillMode from "@/components/CrewDrillMode";
import CrewRoundMode from "@/components/CrewRoundMode";

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {
    console.log('SplashScreen.preventAutoHideAsync failed');
  });
}

const queryClient = new QueryClient();

function AppContent() {
  const { sessionState, sessionType, showPracticeSummary, crewSession, crewSessionActive } = useSession();
  const { currentSection } = useAppNavigation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoadingSplash, setShowLoadingSplash] = useState<boolean>(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const prevSessionRef = useRef<Session | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('App loading, showing splash for 7 seconds');
    splashOpacity.setValue(1);
    const splashTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowLoadingSplash(false);
      });
    }, 6400);

    return () => clearTimeout(splashTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('Auth state changed:', !!newSession);
      prevSessionRef.current = newSession;
      setSession(newSession);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || showLoadingSplash) return;

    const inAuthGroup = segments[0] === 'auth';

    try {
      if (!session && !inAuthGroup) {
        router.replace('/auth');
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.log('Navigation error (safe to ignore):', e);
    }
  }, [session, segments, loading, showLoadingSplash, router]);

  if (showLoadingSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
        <Image
          source={require('@/assets/images/loading-bg.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
        <View style={styles.splashLogoContainer}>
          <Image
            source={require('@/assets/images/loading-logo.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    );
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  if (showPracticeSummary) {
    return <PracticeSummary />;
  }

  if (crewSessionActive && crewSession) {
    if (crewSession.type === 'drill') {
      return <CrewDrillMode session={crewSession} />;
    }
    if (crewSession.type === 'round' || crewSession.type === 'tournament') {
      return <CrewRoundMode session={crewSession} />;
    }
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

  if (currentSection === 'crew') {
    return (
      <View style={styles.container}>
        <CrewScreen />
        <Sidebar />
      </View>
    );
  }

  if (currentSection === 'weather') {
    return (
      <View style={styles.container}>
        <WeatherScreen />
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
          name="modals/pairing-process-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/my-bag-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/my-bag-build-modal" 
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
          name="modals/rounds-history-modal" 
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
          name="modals/past-summaries-modal" 
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
        <Stack.Screen 
          name="modals/notifications-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/chat-list-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom"
          }} 
        />
        <Stack.Screen 
          name="modals/chat-conversation-modal" 
          options={{ 
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_right"
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
    </View>
  );
}

function RootLayoutNav() {
  return (
    <>
      <AppContent />
      <BattleInviteBanner />
      <CrewEventBanner />
    </>
  );
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
          <SensorProvider>
            <ProfileProvider>
              <AppNavigationProvider>
                <BagProvider>
                  <BattleProvider>
                    <ChatProvider>
                      <UserDataProvider>
                        <RootLayoutNav />
                      </UserDataProvider>
                    </ChatProvider>
                  </BattleProvider>
                </BagProvider>
              </AppNavigationProvider>
            </ProfileProvider>
          </SensorProvider>
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
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  splashImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
  splashLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  splashLogo: {
    width: 220,
    height: 80,
  },
});