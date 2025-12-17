import React from "react";
import {
  Insets,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AnimatedIconButtonProps = {
  icon: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  hitSlop?: Insets;
  style?: StyleProp<ViewStyle>;
} & Pick<
  PressableProps,
  | "onPress"
  | "disabled"
  | "accessibilityLabel"
  | "accessibilityHint"
  | "accessibilityRole"
  | "testID"
>;

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
  icon,
  onPress,
  disabled,
  size = 40,
  backgroundColor = "rgba(10, 10, 10, 0.7)",
  hitSlop = { top: 12, bottom: 12, left: 12, right: 12 },
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  testID,
}) => {
  const pressScale = useSharedValue(1);

  const pressAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(pressScale.value, { duration: 200 }),
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
      onPress={onPress}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        style,
        pressAnimatedStyle,
      ]}
    >
      {icon}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor, borderRadius: size / 2, zIndex: -1 },
        ]}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
  },
});
