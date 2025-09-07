import { Stack } from "expo-router";
import React, { useContext } from "react";
import { ThemeContext } from "../../../../contexts/theme-context";

const LibraryLayout = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Library" }} />
    </Stack>
  );
};

export default LibraryLayout;
