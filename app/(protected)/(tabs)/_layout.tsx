import * as Haptics from "expo-haptics";
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
              <TabButton icon={<Home size={24} />} />
            </TabTrigger>
            <TabTrigger
              name="social"
              href="/(social)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
              <TabButton icon={<UsersRound size={24} />} />
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
              <TabButton icon={<Library size={24} />} />
            </TabTrigger>
            <TabTrigger
              name="profile"
              href="/(profile)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
              asChild
            >
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
