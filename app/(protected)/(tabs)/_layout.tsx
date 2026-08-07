import FolderLibrarySolidIcon from "@hugeicons-pro/core-solid-standard/FolderLibraryIcon";
import Home11SolidIcon from "@hugeicons-pro/core-solid-standard/Home11Icon";
import UserCircleSolidIcon from "@hugeicons-pro/core-solid-standard/UserCircleIcon";
import UserMultiple02SolidIcon from "@hugeicons-pro/core-solid-standard/UserMultiple02Icon";
import FolderLibraryIcon from "@hugeicons-pro/core-stroke-standard/FolderLibraryIcon";
import Home11Icon from "@hugeicons-pro/core-stroke-standard/Home11Icon";
import UserCircleIcon from "@hugeicons-pro/core-stroke-standard/UserCircleIcon";
import UserMultiple02Icon from "@hugeicons-pro/core-stroke-standard/UserMultiple02Icon";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react-native";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import React, { useContext } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Rive from "rive-react-native";
import { AuroraBackground } from "../../../components/ui/aurora-background";
import { BottomGradient } from "../../../components/ui/bottom-gradient";
import {
  AuroraScrollProvider,
  useAuroraScroll,
} from "../../../contexts/aurora-scroll-context";
import { HomeAnimationProvider } from "../../../contexts/home-animation-context";
import { ThemeContext } from "../../../contexts/theme-context";

type TabButtonProps = TabTriggerSlotProps & {
  outlineIcon: IconSvgElement;
  filledIcon: IconSvgElement;
};

const TabButton: React.FC<TabButtonProps> = ({
  outlineIcon,
  filledIcon,
  isFocused,
  onPress,
}) => {
  const { theme } = useContext(ThemeContext);
  const iconColor = isFocused ? theme.text : theme.secondaryText;

  return (
    <Pressable onPress={onPress || undefined} style={styles.tabTrigger}>
      <HugeiconsIcon
        icon={isFocused ? filledIcon : outlineIcon}
        size={24}
        color={iconColor}
        // Solid icons are fill-only; a stroke width would outline them.
        strokeWidth={isFocused ? undefined : 2}
      />
    </Pressable>
  );
};

const RiveButton: React.FC<TabTriggerSlotProps> = ({ onPress, isFocused }) => {
  const bottom = useSafeAreaInsets().bottom;

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // Animated style for the scale transformation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.riveButtonWrapper}>
      <Animated.View
        style={[styles.riveButtonContainer, { bottom: bottom }, animatedStyle]}
      >
        <Rive resourceName="warp_circle" style={styles.riveButton} />
      </Animated.View>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={styles.riveButtonTrigger}
      />
    </View>
  );
};

// Has to be its own component: TabsLayout renders the providers, so it sits
// outside them and cannot read the shared scroll offset itself.
const TabsAurora = () => {
  const scrollOffset = useAuroraScroll();
  return <AuroraBackground scrollOffset={scrollOffset} />;
};

const TabsLayout = () => {
  return (
    <HomeAnimationProvider>
      <AuroraScrollProvider>
        <Tabs>
          {/* One canvas for all five tabs. Mounting it per screen would run up
            to five full-screen shaders at once — the same shape as the
            AGENTS.md REACT-NATIVE-2D hang. Tabs renders children in order, so
            this paints behind TabSlot. */}
          <TabsAurora />
          <TabSlot />
          <View style={styles.tabList}>
            <BottomGradient />
            <View style={styles.tabBar}>
              <TabTrigger name="home" href="/(home)" onPress={() => {}} asChild>
                <TabButton
                  outlineIcon={Home11Icon}
                  filledIcon={Home11SolidIcon}
                />
              </TabTrigger>
              <TabTrigger
                name="social"
                href="/(social)"
                onPress={() => {}}
                asChild
              >
                <TabButton
                  outlineIcon={UserMultiple02Icon}
                  filledIcon={UserMultiple02SolidIcon}
                />
              </TabTrigger>
              <TabTrigger
                name="match"
                href="/(match)"
                onPress={() => {}}
                asChild
              >
                <RiveButton />
              </TabTrigger>
              <TabTrigger
                name="library"
                href="/(library)"
                onPress={() => {}}
                asChild
              >
                <TabButton
                  outlineIcon={FolderLibraryIcon}
                  filledIcon={FolderLibrarySolidIcon}
                />
              </TabTrigger>
              <TabTrigger
                name="profile"
                href="/(profile)"
                onPress={() => {}}
                asChild
              >
                <TabButton
                  outlineIcon={UserCircleIcon}
                  filledIcon={UserCircleSolidIcon}
                />
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
      </AuroraScrollProvider>
    </HomeAnimationProvider>
  );
};

const styles = StyleSheet.create({
  tabList: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
  shadowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: 52,
    height: 52,
  },
  riveButtonContainer: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 100,
    zIndex: 10,
    elevation: 10,
  },
  riveButton: {
    width: 72,
    height: 72,
  },
  riveButtonWrapper: {
    position: "relative",
    width: 72,
    height: 72,
  },
  riveButtonTrigger: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
});

export default TabsLayout;
