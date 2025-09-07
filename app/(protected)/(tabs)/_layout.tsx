import { Tabs } from "expo-router";
import { Home, Library, UserRound } from "lucide-react-native";
import React, { useContext } from "react";
import { ThemeContext } from "../../../contexts/theme-context";
const TabsLayout = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
          paddingTop: 12,
          height: 80,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.text,
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="(library)"
        options={{
          title: "Library",
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.text,
          tabBarIcon: ({ color }) => <Library color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profile",
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.text,
          tabBarIcon: ({ color }) => <UserRound color={color} size={24} />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
