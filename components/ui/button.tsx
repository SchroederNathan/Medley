import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useContext } from "react";
import {
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface ButtonProps {
  title: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
  styles?: ViewStyle;
}

const Button = ({
  title,
  icon,
  onPress,
  variant = "primary",
  styles: additionalStyles,
}: ButtonProps) => {
  const { theme } = useContext(ThemeContext);

  // Use secondary colors for secondary variant, primary colors for primary variant
  const buttonBackground =
    variant === "secondary"
      ? theme.secondaryButtonBackground
      : theme.buttonBackground;
  const buttonBorder =
    variant === "secondary" ? theme.secondaryButtonBorder : theme.buttonBorder;

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // Animated style for the scale transformation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        { borderColor: buttonBorder },
        animatedStyle,
        additionalStyles,
      ]}
    >
      <BlurView
        intensity={20}
        tint="default"
        pointerEvents="none"
        style={[styles.blurView, { backgroundColor: buttonBackground }]}
      />
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95);
          Haptics.selectionAsync();
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        style={styles.pressableContent}
      >
        {icon && icon}
        <Text
          style={[
            styles.buttonText,
            { color: variant === "secondary" ? theme.background : theme.text },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default Button;

const styles = StyleSheet.create({
  buttonContainer: {
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  blurView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pressableContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
