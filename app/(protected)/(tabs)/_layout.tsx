import { Tabs } from "expo-router";
import { Home, Search, Sparkles, UserRound } from "lucide-react-native";
import React, { useContext } from "react";
import { ThemeContext } from "../../../contexts/theme-context";

const TabsLayout = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.background, borderTopWidth: 0 },
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
        name="(search)"
        options={{
          title: "Search",
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.text,
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="(discover)"
        options={{
          title: "Discover",
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.text,
          tabBarIcon: ({ color }) => <Sparkles color={color} size={24} />,
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
