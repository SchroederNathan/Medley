import ArrowDown01Icon from "@hugeicons-pro/core-stroke-standard/ArrowDown01Icon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { View } from "react-native";
import { useHeaderHeight } from "../../hooks/use-header-height";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  TRIGGER_DRAG_DISTANCE,
  useHomeAnimation,
} from "../../contexts/home-animation-context";

export const AnimatedChevron = () => {
  const { grossHeight } = useHeaderHeight();
  const { offsetY } = useHomeAnimation();

  // Show chevron only during pull-down (negative y). Height mirrors abs drag
  // so the icon sits centered in the revealed gap. Opacity ramps from 0→1 until trigger.
  const rContainerStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        offsetY.value,
        [0, TRIGGER_DRAG_DISTANCE],
        [0, Math.abs(TRIGGER_DRAG_DISTANCE)],
        Extrapolation.CLAMP
      ),
      // Clamp to avoid overshooting when pulled beyond trigger distance
      opacity: interpolate(
        offsetY.value,
        [0, TRIGGER_DRAG_DISTANCE],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          top: grossHeight,
          zIndex: 50, // Above blur view (which is z: 1)
        },
        rContainerStyle,
      ]}
    >
      <View style={{ transform: [{ scaleX: 2 }] }}>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          color="#a3a3a3"
          strokeWidth={2}
        />
      </View>
    </Animated.View>
  );
};
