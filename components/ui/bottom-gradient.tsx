import { LinearGradient } from "expo-linear-gradient";
import React, { FC, useContext } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";

interface BottomGradientProps {
  style?: ViewStyle;
}

export const BottomGradient: FC<BottomGradientProps> = ({ style }) => {
  const { theme } = useContext(ThemeContext);
  // Fade from transparent to the page background so the tab bar area blends
  // into the scroll content in both light and dark mode
  const rgb = theme.mode === "dark" ? "10, 10, 10" : "255, 255, 255";

  return (
    <LinearGradient
      style={[StyleSheet.absoluteFill, { marginTop: -10 }, style]}
      colors={[`rgba(${rgb}, 0)`, `rgba(${rgb}, 0.75)`, `rgba(${rgb}, 1)`]}
      locations={[0, 0.4, 1]}
    />
  );
};
