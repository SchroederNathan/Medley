import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useIsRestoring } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { NotificationsProvider } from "../components/providers/notifications-provider";
import ChannelOverrideBanner from "../components/ui/channel-override-banner";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthContext, AuthProvider } from "../contexts/auth-context";
import { OverlayProvider } from "../contexts/overlay-context";
import { ThemeContext, ThemeProvider } from "../contexts/theme-context";
import { ToastProvider } from "../contexts/toast-context";
import { useAppFonts } from "../lib/fonts";
import { setClerkTokenGetter } from "../lib/utils";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

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

  // Session Replay: record every session that hits an error so the triage
  // agent (.eas/workflows/agent-triage.yml) can reconstruct the user path.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Feeds the current Clerk session token to the Supabase client, which sends
// it as the Bearer token on every database/storage/function request.
const SupabaseTokenBridge = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(async () => (isSignedIn ? await getToken() : null));
  }, [getToken, isSignedIn]);

  return null;
};

const RootLayout = () => {
  const { fontsLoaded, fontError } = useAppFonts();
  const fontsReady = fontsLoaded || fontError != null;

  // Native splash stays up until SplashHideGate runs; keep tree unmounted until fonts load.
  if (!fontsReady) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <SupabaseTokenBridge />
      <ThemeProvider>
        <AppContainer fontsReady={fontsReady} />
      </ThemeProvider>
    </ClerkProvider>
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

  // Navigator containers paint react-navigation's own theme background, which
  // `contentStyle` does not reach. Left opaque, it covers anything mounted
  // behind a navigator — including the AuroraBackground inside the tabs
  // layout. The root Stack below still paints the real background colour, so
  // making this transparent only removes a redundant opaque layer.
  const navigationTheme = useMemo(() => {
    const base = theme.mode === "dark" ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: "transparent" } };
  }, [theme.mode]);

  return (
    <AuthProvider>
      <SplashHideGate fontsReady={fontsReady} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <OverlayProvider>
            <ToastProvider>
              <NotificationsProvider>
                <StatusBar style="auto" />
                <NavigationThemeProvider value={navigationTheme}>
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
                  </Stack>
                </NavigationThemeProvider>
                <ChannelOverrideBanner />
              </NotificationsProvider>
            </ToastProvider>
          </OverlayProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
};

export default Sentry.wrap(RootLayout);
