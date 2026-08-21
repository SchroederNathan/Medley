import { Stack } from "expo-router";
import React from "react";

const UpcomingLayout = () => {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Upcoming" }} />
    </Stack>
  );
};

export default UpcomingLayout;
