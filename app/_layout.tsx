import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";
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
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back", gestureEnabled: true, gestureDirection: 'horizontal' }}>
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
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
