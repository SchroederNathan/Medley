import { LinearGradient } from "expo-linear-gradient";
import React, { FC } from "react";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { useHeaderHeight } from "../../hooks/use-header-height";

export const TopGradient: FC = () => {
  const { grossHeight } = useHeaderHeight();

  if (Platform.OS === "android") {
    // Use pure gradient on Android—software blur is expensive and inconsistent across devices.
    // 0.9 → 0 alpha creates a soft fade; height * 1.2 covers overscroll and header parallax.
    return (
      <LinearGradient
        style={[StyleSheet.absoluteFillObject, { height: grossHeight * 1.2 }]}
        colors={["rgba(23, 23, 23, 0.9)", "rgba(23, 23, 23, 0)"]}
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
      style={[StyleSheet.absoluteFill, { height: grossHeight * 1.2 }]}
    >
      {/* Dark tint matches app theme; actual blur amount is handled externally when needed. */}
      <BlurView tint="dark" style={StyleSheet.absoluteFill} />
    </MaskedView>
  );
};
