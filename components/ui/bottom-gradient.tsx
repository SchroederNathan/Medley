import { LinearGradient } from "expo-linear-gradient";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

export const BottomGradient: FC = () => {
  // Use gradient that creates a smooth fade from transparent to solid background
  // for the tab bar area, providing a modern layered effect
  return (
    <LinearGradient
      style={[StyleSheet.absoluteFillObject, { height: 100, marginTop: -20 }]}
      colors={[
        "rgba(10, 10, 10, 0)",
        "rgba(10, 10, 10, 0.6)",
        "rgba(10, 10, 10, 1)",
      ]}
      locations={[0, 0.4, 0.9]}
    />
  );
};
