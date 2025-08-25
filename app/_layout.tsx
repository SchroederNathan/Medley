import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../contexts/auth-context";
import { ThemeContext, ThemeProvider } from "../contexts/theme-context";
import { useAppFonts } from "../lib/fonts";

const RootLayout = () => {
  const { fontsLoaded, fontError } = useAppFonts();

  // Don't render anything while fonts are loading or if there's an error
  // The splash screen will remain visible until fonts are loaded
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
  const { theme } = useContext(ThemeContext);

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
};

export default RootLayout;
