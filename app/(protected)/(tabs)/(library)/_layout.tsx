import { Stack } from "expo-router";
import React from "react";

const LibraryLayout = () => {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Library" }} />
    </Stack>
  );
};

export default LibraryLayout;
