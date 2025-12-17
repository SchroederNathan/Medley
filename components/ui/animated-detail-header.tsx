import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { AnimatedIconButton } from "./animated-icon-button";
import { ChevronDown, ChevronLeft } from "./svg-icons";

interface RightButton {
  icon: React.ReactNode;
  onPress: () => void;
}

interface AnimatedDetailHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  theme: React.ContextType<typeof ThemeContext>["theme"];
  topPadding: number;
  isModal?: boolean;
  rightButtons?: RightButton[];
  onBackPress?: () => void;
  titleYPosition?: number;
}

const HEADER_HEIGHT = 44; // Standard header height
const BACKDROP_HEIGHT = 320; // Same as current backdrop height
const POSTER_PADDING = 72;
const DEFAULT_TITLE_Y_POSITION = BACKDROP_HEIGHT - POSTER_PADDING + 80;

export const AnimatedDetailHeader: React.FC<AnimatedDetailHeaderProps> = ({
  scrollY,
  title,
  theme,
  topPadding,
  isModal = false,
  rightButtons,
  onBackPress,
  titleYPosition = DEFAULT_TITLE_Y_POSITION,
}) => {
  // Scroll-based transition boundaries - when title reaches top of screen
  const rInputRange = useDerivedValue(() => {
    // Header transition starts when scrolling begins
    const start = titleYPosition * 0.1;
    // Header transition completes when title would be hidden behind header
    const end = titleYPosition - topPadding - HEADER_HEIGHT;
    return [start, end];
  });

  // Header title visibility - appears when original title scrolls past
  const rHeaderTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(scrollY.value > rInputRange.value[1] ? 1 : 0, {
        duration: 200,
      }),
    };
  });

  // Header background visibility - appears slightly before title
  const rHeaderBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(scrollY.value > rInputRange.value[1] * 0.95 ? 1 : 0, {
        duration: 200,
      }),
    };
  });

  return (
    <>
      {/* Animated Header Background */}
      <Animated.View
        style={[
          styles.headerBackground,
          {
            top: 0,
            paddingTop: topPadding,
            backgroundColor: theme.background,
            borderBottomColor: theme.buttonBorder,
          },
          rHeaderBackgroundStyle,
        ]}
        pointerEvents="none"
      >
        {/* Header Title - fades in when scrolling */}
        <Animated.View style={[styles.headerTitleContainer, rHeaderTitleStyle]}>
          <Text
            style={[styles.headerTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Back Button Overlay - stays above header */}
      <AnimatedIconButton
        onPress={onBackPress || (() => router.back())}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[
          styles.backButton,
          {
            top: topPadding,
            position: "absolute",
            zIndex: 20,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        icon={
          isModal ? (
            <ChevronDown size={20} color={theme.text} />
          ) : (
            <ChevronLeft size={20} color={theme.text} />
          )
        }
      />

      {/* Right Container */}
      {rightButtons && rightButtons.length > 0 && (
        <View style={[styles.rightContainer, { top: topPadding }]}>
          {rightButtons.map((button, index) => (
            <AnimatedIconButton
              key={index}
              icon={button.icon}
              onPress={button.onPress}
              style={styles.rightButton}
            />
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Animated header
  headerBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    height: HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60, // Space for back button
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },

  // Back button
  backButton: {
    position: "absolute",
    left: 16,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  rightContainer: {
    position: "absolute",
    right: 20,
    height: 40,
    zIndex: 20,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  rightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
