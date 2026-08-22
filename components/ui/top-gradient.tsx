import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext } from "react";
import { Platform, StyleSheet } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
interface TopGradientProps {
  height?: number;
}

export const TopGradient = ({ height }: TopGradientProps) => {
  const { grossHeight } = useHeaderHeight();
  const { theme } = useContext(ThemeContext);

  // Both branches must read the same height, or the two platforms disagree on
  // how much of the header the fade covers.
  const resolvedHeight = height ?? grossHeight;

  if (Platform.OS === "android") {
    // Use pure gradient on Android—software blur is expensive and inconsistent across devices.
    // 0.9 → 0 alpha creates a soft fade; height * 1.2 covers overscroll and header parallax.
    const rgb = theme.mode === "dark" ? "23, 23, 23" : "255, 255, 255";
    return (
      <LinearGradient
        style={[StyleSheet.absoluteFill, { height: resolvedHeight * 1.2 }]}
        colors={[`rgba(${rgb}, 0.9)`, `rgba(${rgb}, 0)`]}
        locations={[0.75, 1]}
      />
    );
  }

  return (
    // On iOS, combine BlurView with a gradient mask to mimic native frosted header
    // while keeping edges feathered. MaskedView applies transparency via the gradient.
    <MaskedView
      maskElement={
        <LinearGradient
          locations={[0.75, 1]}
          colors={["black", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      }
      style={[StyleSheet.absoluteFill, { height: resolvedHeight * 1.2 }]}
    >
      <BlurView tint={theme.mode} style={StyleSheet.absoluteFill} />
    </MaskedView>
  );
};
