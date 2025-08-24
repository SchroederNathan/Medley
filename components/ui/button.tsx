import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useContext } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface ButtonProps {
  title: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
  otherProps?: TouchableOpacityProps;
  styles?: ViewStyle;
}

const Button = ({
  title,
  icon,
  onPress,
  variant = "primary",
  styles: additionalStyles,
  ...otherProps
}: ButtonProps) => {
  const { theme } = useContext(ThemeContext);

  // Use secondary colors for secondary variant, primary colors for primary variant
  const buttonBackground =
    variant === "secondary"
      ? theme.secondaryButtonBackground
      : theme.buttonBackground;
  const buttonBorder =
    variant === "secondary" ? theme.secondaryButtonBorder : theme.buttonBorder;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.buttonContainer,
        { borderColor: buttonBorder },
        additionalStyles,
      ]}
      {...otherProps}
    >
      <BlurView
        intensity={20}
        tint="default"
        style={[styles.blurView, { backgroundColor: buttonBackground }]}
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
      </BlurView>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  buttonContainer: {
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
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
});
