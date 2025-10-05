import { Stack } from "expo-router";
import React, { useContext } from "react";
import { ThemeContext } from "../../../../contexts/theme-context";
const HomeLayout = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
};

export default HomeLayout;
