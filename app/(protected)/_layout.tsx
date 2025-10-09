import { Redirect, Stack } from "expo-router";
import React, { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { ThemeContext } from "../../contexts/theme-context";

const ProtectedLayout = () => {
  const authState = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  if (!authState.isReady) {
    return null;
  }

  if (!authState.isLoggedIn) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="media-detail/index"
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen name="collection/create" options={{ headerShown: false, presentation: "formSheet", sheetGrabberVisible: true, sheetAllowedDetents: [0.25, 1], contentStyle: { backgroundColor: 'transparent' } }} /> */}

      <Stack.Screen
        name="collection/create"
        options={{
          headerShown: false,
          presentation: "modal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />

      <Stack.Screen
        name="collection/[id]"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
};

export default ProtectedLayout;
