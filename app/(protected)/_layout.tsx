import { Redirect, Stack } from "expo-router";
import React, { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";

const ProtectedLayout = () => {
  const authState = useContext(AuthContext);

  if (!authState.isReady) {
    return null;
  }

  if (!authState.isLoggedIn) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProtectedLayout;
