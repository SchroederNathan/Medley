import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface ButtonProps {
  title: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
  styles?: ViewStyle;
  disabled?: boolean;
}

const Button = ({
  title,
  icon,
  onPress,
  variant = "primary",
  styles: additionalStyles,
  disabled = false,
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

  // Convert border color to transparent for gradient
  // Handle rgba format (e.g., "rgba(64, 64, 64, 0.5)" -> "rgba(64, 64, 64, 0)")
  let transparentBorder = buttonBorder;
  const rgbaMatch = buttonBorder.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (rgbaMatch) {
    transparentBorder = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0)`;
  } else {
    // Handle hex format (e.g., "#737373" -> "rgba(115, 115, 115, 0)")
    const hexMatch = buttonBorder.match(/#([0-9A-Fa-f]{6})/);
    if (hexMatch) {
      const r = parseInt(hexMatch[1].substring(0, 2), 16);
      const g = parseInt(hexMatch[1].substring(2, 4), 16);
      const b = parseInt(hexMatch[1].substring(4, 6), 16);
      transparentBorder = `rgba(${r}, ${g}, ${b}, 0)`;
    }
  }

  return (
    <Animated.View
      style={[animatedStyle, additionalStyles, disabled && { opacity: 0.5 }]}
    >
      <Pressable
        onPressIn={() => {
          if (!disabled) {
            scale.value = withTiming(0.98, { duration: 100 });
            Haptics.selectionAsync();
          }
        }}
        onPressOut={() => {
          if (!disabled) {
            scale.value = withTiming(1, { duration: 100 });
          }
        }}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={styles.pressable}
      >
        <LinearGradient
          colors={[buttonBorder, transparentBorder]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBorder}
        >
          <Animated.View
            style={[
              styles.buttonContainer,
              { backgroundColor: buttonBackground },
            ]}
          >
            <BlurView
              intensity={20}
              tint="default"
              pointerEvents="none"
              style={[styles.blurView, { backgroundColor: buttonBackground }]}
            />
            <Animated.View style={styles.pressableContent}>
              {icon && icon}
              <Animated.Text
                style={[
                  styles.buttonText,
                  {
                    color:
                      variant === "secondary" ? theme.background : theme.text,
                  },
                ]}
              >
                {title}
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default Button;

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 12,
    padding: 1,
    borderCurve: "continuous",
  },
  buttonContainer: {
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 11,
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
  pressable: {
    width: "100%",
  },
  pressableContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
