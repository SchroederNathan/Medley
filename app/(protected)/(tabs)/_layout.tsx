import * as Haptics from "expo-haptics";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import React, { useContext } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Rive from "rive-react-native";
import { BottomGradient } from "../../../components/ui/bottom-gradient";
import { HomeAnimationProvider } from "../../../contexts/home-animation-context";
import { ThemeContext } from "../../../contexts/theme-context";
import {
  HomeOutlineIcon,
  HomeFilledIcon,
  SocialOutlineIcon,
  SocialFilledIcon,
  LibraryOutlineIcon,
  LibraryFilledIcon,
  ProfileOutlineIcon,
  ProfileFilledIcon,
} from "../../../components/ui/svg-icons";

type TabButtonProps = TabTriggerSlotProps & {
  outlineIcon: React.ComponentType<{ size?: number; color?: string }>;
  filledIcon: React.ComponentType<{ size?: number; color?: string }>;
};

const TabButton: React.FC<TabButtonProps> = ({
  outlineIcon: OutlineIcon,
  filledIcon: FilledIcon,
  isFocused,
  onPress,
}) => {
  const { theme } = useContext(ThemeContext);
  const IconComponent = isFocused ? FilledIcon : OutlineIcon;
  const iconColor = isFocused ? theme.text : theme.secondaryText;

  return (
    <TouchableOpacity onPress={onPress || undefined} style={styles.tabTrigger}>
      <IconComponent size={24} color={iconColor} />
    </TouchableOpacity>
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          scale.value = withSpring(1);
        }}
        style={styles.riveButtonTrigger}
      />
    </View>
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
            <TabTrigger
              name="home"
              href="/(home)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
              <TabButton
                outlineIcon={HomeOutlineIcon}
                filledIcon={HomeFilledIcon}
              />
            </TabTrigger>
            <TabTrigger
              name="social"
              href="/(social)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
              <TabButton
                outlineIcon={SocialOutlineIcon}
                filledIcon={SocialFilledIcon}
              />
            </TabTrigger>
            <TabTrigger
              name="match"
              href="/(match)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
              <RiveButton />
            </TabTrigger>
            <TabTrigger
              name="library"
              href="/(library)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
              <TabButton
                outlineIcon={LibraryOutlineIcon}
                filledIcon={LibraryFilledIcon}
              />
            </TabTrigger>
            <TabTrigger
              name="profile"
              href="/(profile)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
              <TabButton
                outlineIcon={ProfileOutlineIcon}
                filledIcon={ProfileFilledIcon}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
});

export default TabsLayout;
