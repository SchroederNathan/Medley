import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthContext, AuthProvider } from "../contexts/auth-context";
import { ThemeContext, ThemeProvider } from "../contexts/theme-context";
import { useAppFonts } from "../lib/fonts";

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
      <SplashController>
        <GestureHandlerRootView>
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
        </GestureHandlerRootView>
      </SplashController>
    </AuthProvider>
  );
};

const SplashController = ({ children }: { children: React.ReactNode }) => {
  const { isReady } = useContext(AuthContext);

  React.useEffect(() => {
    if (isReady) {
      // Hide splash screen after both fonts and auth are ready
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return <>{children}</>;
};

export default RootLayout;
