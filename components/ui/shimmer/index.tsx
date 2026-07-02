import React, { createContext, useContext, useCallback } from "react";
import { View, type LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  useDerivedValue,
  useSharedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import MaskedView from "@react-native-masked-view/masked-view";
import type {
  ShimmerContextValue,
  ShimmerProps,
  ShimmerOverlayProps,
  ShimmerMaskProps,
} from "./types";
import { styles } from "./styles";
import { useShimmerAnimation } from "./use-shimmer-animation";
import { useTrackDistance } from "./use-track-distance";

export const ShimmerContext = createContext<ShimmerContextValue | null>(null);

// ------------------------------------------

const useShimmer = (): ShimmerContextValue => {
  const context = useContext(ShimmerContext);
  if (!context) {
    throw new Error("useShimmer must be used within Shimmer component");
  }
  return context;
};

// ------------------------------------------

/** Root component. Measures its own dimensions and provides context to children. */
const ShimmerRoot = React.forwardRef<View, ShimmerProps>(
  ({ debug = false, children, style, onLayout, ...props }, ref) => {
    const containerWidth = useSharedValue(0);
    const containerHeight = useSharedValue(0);

    const containerDiagonal = useDerivedValue(() => {
      const width = containerWidth.get();
      const height = containerHeight.get();
      if (width > 0 && height > 0) {
        return Math.sqrt(width * width + height * height);
      }
      return 0;
    });

    const handleContainerLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        containerWidth.set(width);
        containerHeight.set(height);
        onLayout?.(event);
      },
      [containerWidth, containerHeight, onLayout]
    );

    const contextValue: ShimmerContextValue = {
      containerWidth,
      containerHeight,
      containerDiagonal,
      debug,
    };

    return (
      <ShimmerContext value={contextValue}>
        <View
          ref={ref}
          style={[styles.container, style, debug && styles.containerDebug]}
          onLayout={handleContainerLayout}
          {...props}
        >
          {children}
        </View>
      </ShimmerContext>
    );
  }
);

ShimmerRoot.displayName = "Shimmer";

// ------------------------------------------

/** Animated overlay that sweeps across the Shimmer container. */
const ShimmerOverlay = React.forwardRef<Animated.View, ShimmerOverlayProps>(
  (
    {
      children,
      width,
      trackAngle = 0,
      overlayAngle = 0,
      duration,
      initialDelay,
      repeatDelay,
      animation,
      progress: externalProgress,
      onProgress,
    },
    ref
  ) => {
    const { containerWidth, containerHeight, debug } = useShimmer();

    // Resolve width prop to pixels (handles both absolute and percentage values)
    const overlayWidth = useDerivedValue(() => {
      if (typeof width === "number") {
        return width;
      }
      const percentage = parseFloat(width);
      return (containerWidth.get() * percentage) / 100;
    });

    const internalProgress = useSharedValue(0);
    const activeProgress = externalProgress ?? internalProgress;
    const autoPlay = externalProgress === undefined;

    const trackDistance = useTrackDistance({
      containerWidth,
      containerHeight,
      trackAngle,
    });

    const { animatedStyle, rotateContainerHeight } = useShimmerAnimation({
      trackAngle,
      overlayAngle,
      containerWidth,
      containerHeight,
      overlayWidth,
      trackDistance,
      progress: activeProgress,
      duration,
      initialDelay,
      repeatDelay,
      animation,
      autoPlay,
    });

    // Mirror progress to onProgress SharedValue (UI thread only)
    useAnimatedReaction(
      () => activeProgress.get(),
      (currentProgress) => {
        if (onProgress) {
          onProgress.set(currentProgress);
        }
      }
    );

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: `${trackAngle}deg` }],
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[{ width: trackDistance }, debug && styles.trackDebug]}
        >
          <Animated.View
            ref={ref}
            style={[
              styles.translateContainer,
              animatedStyle,
              debug && styles.overlayDebug,
            ]}
          >
            <Animated.View
              style={[
                styles.rotateContainer,
                { width: overlayWidth, height: rotateContainerHeight },
                { transform: [{ rotate: `${overlayAngle}deg` }] },
              ]}
            >
              {children}
            </Animated.View>
          </Animated.View>
        </Animated.View>
        {/* Debug: direction arrow */}
        {debug && (
          <View
            style={{
              position: "absolute",
              backgroundColor: "transparent",
              borderStyle: "solid",
              borderLeftWidth: 18,
              borderTopWidth: 8,
              borderBottomWidth: 8,
              borderLeftColor: "green",
              borderTopColor: "transparent",
              borderBottomColor: "transparent",
            }}
          />
        )}
      </View>
    );
  }
);

ShimmerOverlay.displayName = "Shimmer.Overlay";

// ------------------------------------------

/**
 * Clips the overlay to children's alpha channel via MaskedView.
 * Children must use opaque colors (e.g. text-black) for the mask to work.
 */
const ShimmerMask = ({ children, overlay, background }: ShimmerMaskProps) => {
  const { debug } = useShimmer();

  return (
    <>
      <MaskedView maskElement={<>{children}</>}>
        {/* Hidden duplicate for layout sizing — MaskedView sizes from children, not maskElement */}
        <View
          style={styles.maskSizer}
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          {children}
        </View>
        {background !== undefined && (
          <View style={StyleSheet.absoluteFill}>{background}</View>
        )}
        {!debug && overlay}
      </MaskedView>
      {debug && overlay}
    </>
  );
};

ShimmerMask.displayName = "Shimmer.Mask";

// ------------------------------------------

const Shimmer = Object.assign(ShimmerRoot, {
  Overlay: ShimmerOverlay,
  Mask: ShimmerMask,
});

export default Shimmer;
