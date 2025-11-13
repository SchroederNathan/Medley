import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { ChevronDown, ChevronLeft } from "./svg-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RightButton {
  icon: React.ReactNode;
  onPress: () => void;
}

// Component for animated right button with press scale effect
const AnimatedRightButton: React.FC<{
  button: RightButton;
  style?: any;
}> = ({ button, style }) => {
  const pressScale = useSharedValue(1);

  const pressAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(pressScale.value, {
            duration: 200,
          }),
        },
      ],
    };
  });

  const handlePressIn = () => {
    pressScale.value = 0.95;
  };

  const handlePressOut = () => {
    pressScale.value = 1;
  };

  return (
    <AnimatedPressable
      onPress={button.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 12, bottom: 12 }}
      style={[style, pressAnimatedStyle]}
      accessibilityRole="button"
    >
      {button.icon}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(10, 10, 10, 0.7)",
          borderRadius: 20,
          zIndex: -1,
        }}
      />
    </AnimatedPressable>
  );
};

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

  // Back button press animation
  const backPressScale = useSharedValue(1);

  const backPressAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(backPressScale.value, {
            duration: 200,
          }),
        },
      ],
    };
  });

  const handleBackPressIn = () => {
    backPressScale.value = 0.95;
  };

  const handleBackPressOut = () => {
    backPressScale.value = 1;
  };

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
      <AnimatedPressable
        onPress={onBackPress || (() => router.back())}
        onPressIn={handleBackPressIn}
        onPressOut={handleBackPressOut}
        hitSlop={{ top: 12, bottom: 12 }}
        style={[
          styles.backButton,
          {
            top: topPadding,
            position: "absolute",
            zIndex: 20,
          },
          backPressAnimatedStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        {isModal ? (
          <ChevronDown size={20} color={theme.text} />
        ) : (
          <ChevronLeft size={20} color={theme.text} />
        )}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(10, 10, 10, 0.7)",
            borderRadius: 20,
            zIndex: -1,
          }}
        />
      </AnimatedPressable>

      {/* Right Container */}
      {rightButtons && rightButtons.length > 0 && (
        <View style={[styles.rightContainer, { top: topPadding }]}>
          {rightButtons.map((button, index) => (
            <AnimatedRightButton
              key={index}
              button={button}
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
