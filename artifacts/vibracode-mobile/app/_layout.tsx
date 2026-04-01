import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexChatProvider } from "@/src/context/ConvexChatProvider";
import { ConvexChatBoundary } from "@/src/context/ConvexChatBoundary";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { CONFIG } from "@/src/config";

LogBox.ignoreLogs([
  "ms timeout exceeded",
  "fontfaceobserver",
  "FontFaceObserver",
  "Require cycle:",
]);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const convex = new ConvexReactClient(CONFIG.CONVEX_URL, {
  unsavedChangesWarning: false,
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setReady(true), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <SettingsProvider>
                  <ConvexChatBoundary fallbackChildren={<RootLayoutNav />}>
                    <ConvexChatProvider>
                      <RootLayoutNav />
                    </ConvexChatProvider>
                  </ConvexChatBoundary>
                </SettingsProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ConvexProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
