import { LinearGradient } from "expo-linear-gradient";
import React, { FC } from "react";
import { StyleSheet, ViewStyle } from "react-native";

interface BottomGradientProps {
  style?: ViewStyle;
}

export const BottomGradient: FC<BottomGradientProps> = ({ style }) => {
  // Use gradient that creates a smooth fade from transparent to solid background
  // for the tab bar area, providing a modern layered effect
  return (
    <LinearGradient
      style={[StyleSheet.absoluteFillObject, { marginTop: -10 }, style]}
      colors={[
        "rgba(10, 10, 10, 0)",
        "rgba(10, 10, 10, 0.75)",
        "rgba(10, 10, 10, 1)",
      ]}
      locations={[0, 0.4, 1]}
    />
  );
};
