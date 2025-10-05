import { Image } from "expo-image";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import {
  CircleUserRound,
  Home,
  Library,
  UsersRound,
} from "lucide-react-native";
import React, { useContext } from "react";
import {
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

const TabButton: React.FC<TabButtonProps> = ({ icon, isFocused, onPress }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity onPress={onPress || undefined} style={styles.tabTrigger}>
      {React.cloneElement(icon as React.ReactElement<any>, {
        color: isFocused ? theme.text : theme.secondaryText,
      })}
    </TouchableOpacity>
  );
};

const ImageTabButton: React.FC<TouchableOpacityProps> = ({ ...props }) => {
  return (
    <TouchableOpacity {...props} style={[styles.tabTrigger]}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../../../assets/images/tab-button.png")}
          style={[styles.image]}
          contentFit="cover"
        />
      </View>
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
            <TabTrigger name="social" href="/(social)" asChild>
              <TabButton icon={<UsersRound size={24} />} />
            </TabTrigger>
            <TabTrigger name="match" href="/(match)" asChild>
              <ImageTabButton />
            </TabTrigger>
            <TabTrigger name="library" href="/(library)" asChild>
              <TabButton icon={<Library size={24} />} />
            </TabTrigger>
            <TabTrigger name="profile" href="/(profile)" asChild>
              <TabButton icon={<CircleUserRound size={24} />} />
            </TabTrigger>
          </View>
        </View>
        <TabList style={{ display: "none" }}>
          <TabTrigger name="home" href="/(home)" />
          <TabTrigger name="social" href="/(social)" />
          <TabTrigger name="match" href="/(match)" />
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
  imageContainer: {
    boxShadow: "0px 0px 20px 10px rgba(0, 0, 0, 0.3)",
    borderRadius: 100,
  },
  image: {
    width: 52,
    height: 52,
  },
});

export default TabsLayout;
