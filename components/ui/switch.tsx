import { CheckIcon, XIcon } from "./svg-icons";
import React, { FC } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  ZoomIn,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import * as Haptics from "expo-haptics";
// Switch dimensions - compact 40x26 design
const SWITCH_WIDTH = 52;
const SWITCH_THUMB_SIZE = 24;
const SWITCH_HORIZONTAL_PADDING = 4; // Creates 3px margin from track edges
const SWITCH_VERTICAL_PADDING = 4; // Creates 3px margin from top/bottom
const SWITCH_HEIGHT = SWITCH_THUMB_SIZE + SWITCH_VERTICAL_PADDING * 2;
// Maximum thumb travel distance: total width minus thumb size minus both side paddings
const SWITCH_MAX_OFFSET =
  SWITCH_WIDTH - SWITCH_THUMB_SIZE - SWITCH_HORIZONTAL_PADDING * 2;

type Props = {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export const Switch: FC<Props> = ({ value = false, onValueChange }) => {
  const { theme } = React.useContext(ThemeContext);

  // Thumb position: 0 (left/off) to SWITCH_MAX_OFFSET (right/on)
  const offset = useSharedValue(value ? SWITCH_MAX_OFFSET : 0);
  // Internal state tracking for consistent animations
  const isOn = useSharedValue(value);

  const toggleSwitch = () => {
    const newValue = !isOn.get();
    isOn.set(newValue);

    // Spring animation for smooth thumb slide
    offset.set(withSpring(newValue ? SWITCH_MAX_OFFSET : 0, {}));
    onValueChange?.(newValue);
  };

  // Thumb position animation - translates from left (0) to right (SWITCH_MAX_OFFSET)
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      offset.get(),
      [0, SWITCH_MAX_OFFSET],
      [theme.text, theme.background]
    );

    return {
      transform: [{ translateX: offset.get() }],
      backgroundColor, // Interpolated color for the thumb
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const trackBackgroundColor = interpolateColor(
      offset.get(),
      [0, SWITCH_MAX_OFFSET],
      [theme.inputBackground, theme.text]
    );

    return {
      backgroundColor: trackBackgroundColor, // Interpolated color for the track
    };
  });

  return (
    <Pressable
      onPress={toggleSwitch}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <Animated.View
        style={[
          styles.track,
          backgroundStyle,
          { boxShadow: `0 0 0px 1px ${theme.border}` },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            animatedStyle,
            {
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.text,
            },
          ]}
        >
          {value ? (
            // Key prop ensures ZoomIn animation triggers on state change
            // Icons provide clear visual feedback
            <Animated.View key="check" entering={ZoomIn}>
              <CheckIcon size={12} color={theme.text} strokeWidth={4} />
            </Animated.View>
          ) : (
            <Animated.View key="x" entering={ZoomIn}>
              <XIcon size={14} color={theme.border} strokeWidth={4} />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    paddingHorizontal: SWITCH_HORIZONTAL_PADDING,
    paddingVertical: SWITCH_VERTICAL_PADDING,
    paddingBottom: SWITCH_VERTICAL_PADDING,
  },
  thumb: {
    width: SWITCH_THUMB_SIZE,
    height: SWITCH_THUMB_SIZE,
    borderRadius: SWITCH_THUMB_SIZE / 2,
  },
});
