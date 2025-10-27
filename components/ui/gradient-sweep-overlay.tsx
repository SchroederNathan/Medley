import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const GradientSweepOverlay = ({
  width,
  height,
  isAnimating = true,
}: {
  width: number;
  height: number;
  isAnimating?: boolean;
}) => {
  const sweepProgress = useSharedValue(0);

  useEffect(() => {
    if (isAnimating) {
      sweepProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isAnimating, sweepProgress]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height - sweepProgress.value * (height * 2) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          overflow: "hidden",
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[animatedGradientStyle]}>
        <Canvas style={{ width, height, opacity: 0.5 }}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[
                "rgba(156, 106, 249, 0)",
                "rgba(156, 106, 249, 0.8)",
                "rgba(234, 191, 251, 1)",
                "rgba(156, 106, 249, 0.8)",
                "rgba(156, 106, 249, 0)",
              ]}
            />
          </Rect>
        </Canvas>
      </Animated.View>
    </Animated.View>
  );
};

export default GradientSweepOverlay;
