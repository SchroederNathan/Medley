import { Image } from "expo-image";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { Home, Library, Search, UserRound } from "lucide-react-native";
import React, { useContext } from "react";
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { BottomGradient } from "../../../components/ui/bottom-gradient";
import { HomeAnimationProvider } from "../../../contexts/home-animation-context";
import { ThemeContext } from "../../../contexts/theme-context";

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ReactNode;
};

const TabButton: React.FC<TabButtonProps> = ({ icon, isFocused, ...props }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <Pressable {...props} style={styles.tabTrigger}>
      {React.cloneElement(icon as React.ReactElement<any>, {
        color: isFocused ? theme.text : theme.secondaryText,
      })}
    </Pressable>
  );
};

const ImageTabButton: React.FC<TouchableOpacityProps> = ({ ...props }) => {
  return (
    <TouchableOpacity {...props} style={styles.tabTrigger}>
      <Image
        source={require("../../../assets/images/tab-button.png")}
        style={styles.image}
        contentFit="cover"
      />
    </TouchableOpacity>
  );
};

const TabsLayout = () => {
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
            <TabTrigger name="search" href="/(search)" asChild>
              <TabButton icon={<Search size={24} />} />
            </TabTrigger>
            <TabTrigger name="discover" href="/(discover)" asChild>
              <ImageTabButton />
            </TabTrigger>
            <TabTrigger name="library" href="/(library)" asChild>
              <TabButton icon={<Library size={24} />} />
            </TabTrigger>
            <TabTrigger name="profile" href="/(profile)" asChild>
              <TabButton icon={<UserRound size={24} />} />
            </TabTrigger>
          </View>
        </View>
        <TabList style={{ display: "none" }}>
          <TabTrigger name="home" href="/(home)" />
          <TabTrigger name="library" href="/(library)" />
          <TabTrigger name="search" href="/(search)" />
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
  image: {
    width: 52,
    height: 52,
  },
});

export default TabsLayout;
