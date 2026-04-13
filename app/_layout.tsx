import { useIsRestoring } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { NotificationsProvider } from "../components/providers/notifications-provider";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthContext, AuthProvider } from "../contexts/auth-context";
import { OverlayProvider } from "../contexts/overlay-context";
import { ThemeContext, ThemeProvider } from "../contexts/theme-context";
import { ToastProvider } from "../contexts/toast-context";
import { useAppFonts } from "../lib/fonts";

if (Platform.OS === "ios" || Platform.OS === "android") {
  SplashScreen.preventAutoHideAsync();
  SplashScreen.setOptions({ fade: true, duration: 400 });
}

Sentry.init({
  dsn: "https://077c17121b5dbfc5cecd4ec763173e88@o4510162802049024.ingest.us.sentry.io/4510162816073728",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const RootLayout = () => {
  const { fontsLoaded, fontError } = useAppFonts();
  const fontsReady = fontsLoaded || fontError != null;

  // Native splash stays up until SplashHideGate runs; keep tree unmounted until fonts load.
  if (!fontsReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContainer fontsReady={fontsReady} />
    </ThemeProvider>
  );
};

const AppContainer = ({ fontsReady }: { fontsReady: boolean }) => {
  return (
    <QueryProvider>
      <AuthProviderWithProviders fontsReady={fontsReady} />
    </QueryProvider>
  );
};

const SplashHideGate = ({ fontsReady }: { fontsReady: boolean }) => {
  const { isReady } = useContext(AuthContext);
  const isRestoring = useIsRestoring();

  useEffect(() => {
    if (!fontsReady || !isReady || isRestoring) return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;
    void SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, isReady, isRestoring]);

  return null;
};

const AuthProviderWithProviders = ({ fontsReady }: { fontsReady: boolean }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <AuthProvider>
      <SplashHideGate fontsReady={fontsReady} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <OverlayProvider>
            <ToastProvider>
              <NotificationsProvider>
                <StatusBar style="auto" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                  }}
                >
                  <Stack.Screen
                    name="(protected)"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="onboarding"
                    options={{
                      animation: "none",
                    }}
                  />
                  <Stack.Screen
                    name="login"
                    options={{
                      animation: "none",
                    }}
                  />
                  <Stack.Screen
                    name="name"
                    options={{
                      animation: "none",
                    }}
                  />
                  <Stack.Screen
                    name="media-preferences"
                    options={{
                      animation: "none",
                    }}
                  />
                  <Stack.Screen
                    name="signup"
                    options={{
                      animation: "none",
                    }}
                  />
                </Stack>
              </NotificationsProvider>
            </ToastProvider>
          </OverlayProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
};

export default Sentry.wrap(RootLayout);
