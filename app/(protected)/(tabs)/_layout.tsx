import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from "expo-router/ui";
import { Home, Library, UserRound } from "lucide-react-native";
import React, { useContext } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { HomeAnimationProvider } from "../../../contexts/home-animation-context";
import { ThemeContext } from "../../../contexts/theme-context";
import { BottomGradient } from "../../../components/ui/bottom-gradient";

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ReactNode;
};

const TabButton: React.FC<TabButtonProps> = ({ icon, isFocused, ...props }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <Pressable {...props} style={styles.tabTrigger}>
      {React.cloneElement(icon as React.ReactElement<any>, {
        color: isFocused ? theme.text : theme.secondaryText
      })}
    </Pressable>
  );
};

const TabsLayout = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <HomeAnimationProvider>
      <Tabs>
        <TabSlot />
        <View style={styles.tabList}>
          <BottomGradient />
          <View style={styles.tabBar}>
            <TabTrigger name="home" href="/(home)" asChild>
              <TabButton icon={<Home size={24} />} />
            </TabTrigger>
            <TabTrigger name="library" href="/(library)" asChild>
              <TabButton icon={<Library size={24} />} />
            </TabTrigger>
            <TabTrigger name="profile" href="/(profile)" asChild>
              <TabButton icon={<UserRound size={24} />} />
            </TabTrigger>
          </View>
        </View>
        <TabList style={{ display: 'none' }}>
          <TabTrigger name="home" href="/(home)" />
          <TabTrigger name="library" href="/(library)" />
          <TabTrigger name="profile" href="/(profile)" />
        </TabList>
      </Tabs>
    </HomeAnimationProvider>
  );
};

const styles = StyleSheet.create({
  tabList: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 34, // Account for iOS home indicator
    height: 80,
  },
  tabTrigger: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TabsLayout;
