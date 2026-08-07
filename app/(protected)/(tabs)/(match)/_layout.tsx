import { Stack } from "expo-router";
import React from "react";
const MatchLayout = () => {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
};

export default MatchLayout;
