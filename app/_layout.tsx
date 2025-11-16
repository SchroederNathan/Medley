import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthContext, AuthProvider } from "../contexts/auth-context";
import {
  ContentReadyProvider,
  ContentReadyContext,
} from "../contexts/content-ready-context";
import { OverlayProvider } from "../contexts/overlay-context";
import { ThemeContext, ThemeProvider } from "../contexts/theme-context";
import { ToastProvider } from "../contexts/toast-context";
import { useAppFonts } from "../lib/fonts";
import * as Sentry from "@sentry/react-native";
import { NotificationsProvider } from "../components/providers/notifications-provider";

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

  // Don't render anything while fonts are loading or if there's an error
  // The splash screen will remain visible until fonts are loaded and auth is ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContainer />
    </ThemeProvider>
  );
};

const AppContainer = () => {
  return (
    <QueryProvider>
      <AuthProviderWithSplash />
    </QueryProvider>
  );
};

const AuthProviderWithSplash = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <AuthProvider>
      <ContentReadyProvider>
        <SplashController>
          <GestureHandlerRootView style={{ flex: 1 }}>
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
          </GestureHandlerRootView>
        </SplashController>
      </ContentReadyProvider>
    </AuthProvider>
  );
};

const SplashController = ({ children }: { children: React.ReactNode }) => {
  const { isReady, isLoggedIn } = useContext(AuthContext);
  const { isContentReady } = useContext(ContentReadyContext);

  React.useEffect(() => {
    if (isReady) {
      // If user is not logged in (onboarding/login screens), hide splash immediately
      // Otherwise, wait for content to be ready
      if (!isLoggedIn || isContentReady) {
        SplashScreen.hideAsync();
      }
    }
  }, [isReady, isLoggedIn, isContentReady]);

  return <>{children}</>;
};

export default Sentry.wrap(RootLayout);
