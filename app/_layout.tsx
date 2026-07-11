import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Text } from "react-native";
import Colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated, isLoading, fetchServerData } = useAuth();
  const { hydrateFromServer, clearActivityData } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const prevAuthRef = useRef<boolean | null>(null);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenWelcome').then(val => {
      setHasSeenWelcome(!!val);
      setWelcomeChecked(true);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const wasAuthenticated = prevAuthRef.current;
    const isNowAuthenticated = isAuthenticated;
    prevAuthRef.current = isNowAuthenticated;

    if (isNowAuthenticated && wasAuthenticated !== true) {
      fetchServerData().then(data => {
        if (data) {
          hydrateFromServer({
            sessions: data.sessions,
            checkins: data.checkins,
            assessments: data.assessments,
          });
        }
      });
    }

    if (!isNowAuthenticated && wasAuthenticated === true) {
      clearActivityData();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isLoading || !welcomeChecked) return;

    const inAuthGroup = segments[0] === 'auth';
    const inWelcome = segments[0] === 'welcome';

    if (!isAuthenticated && !inAuthGroup && !inWelcome) {
      if (!hasSeenWelcome) {
        router.replace('/welcome');
      } else {
        router.replace('/auth/login');
      }
    } else if (isAuthenticated && (inAuthGroup || inWelcome)) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, welcomeChecked, hasSeenWelcome]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 16 }}>
        <ActivityIndicator size="large" color="#6B5B95" />
        <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 15, color: '#6B7394' }}>Preparing your experience...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back", gestureEnabled: true, gestureDirection: 'horizontal' }}>
      <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="exercise/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
      <Stack.Screen name="article/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="crisis" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
      <Stack.Screen name="bodymap" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="goals" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="achievements" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="conditions" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="condition/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="assessment/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="edit-conditions" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="edit-preferences" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="session-history" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="search" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="premium" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <AppProvider>
                <StatusBar style="dark" />
                <AuthGate />
              </AppProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
