import {
  useAnimatedStyle,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  type WithTimingConfig,
  type WithSpringConfig,
  useDerivedValue,
} from "react-native-reanimated";
import type { UseShimmerAnimationConfig } from "./types";

/**
 * Drives shimmer animation: builds the repeat/delay sequence,
 * computes geometry for angled overlays, and returns an animated style.
 */
export const useShimmerAnimation = (config: UseShimmerAnimationConfig) => {
  const {
    trackAngle,
    overlayAngle,
    containerWidth,
    containerHeight,
    overlayWidth,
    trackDistance,
    progress,
    duration,
    initialDelay = 500,
    repeatDelay = 0,
    animation,
    autoPlay = true,
  } = config;

  // Resolve animation params — animation.config takes precedence over duration shorthand
  const animationType = animation?.type ?? "timing";
  const defaultDuration = duration ?? 2000;
  const animationConfig =
    animation?.config ?? ({ duration: defaultDuration } as WithTimingConfig);
  const numberOfReps = animation?.numberOfReps ?? -1;
  const reverse = animation?.reverse ?? false;

  // Start/restart animation once both container and overlay widths are measured
  useAnimatedReaction(
    () => ({
      containerW: containerWidth.get(),
      highlightW: overlayWidth.get(),
    }),
    (current) => {
      if (!autoPlay) return;

      const isReady = current.containerW > 0 && current.highlightW > 0;
      if (!isReady) return;

      progress.set(0);

      const animateToEnd =
        animationType === "spring"
          ? withSpring(1, animationConfig as WithSpringConfig)
          : withTiming(1, animationConfig as WithTimingConfig);

      let repeatedAnimation;

      if (reverse) {
        // Ping-pong: 0→1→0. Manual round-trip because withRepeat's built-in
        // reverse doesn't compose correctly with withSequence.
        const animateBack =
          animationType === "spring"
            ? withSpring(0, animationConfig as WithSpringConfig)
            : withTiming(0, animationConfig as WithTimingConfig);

        const fullCycle =
          repeatDelay > 0
            ? withSequence(
                animateToEnd,
                animateBack,
                withDelay(repeatDelay, withTiming(0, { duration: 0 }))
              )
            : withSequence(animateToEnd, animateBack);

        repeatedAnimation = withRepeat(fullCycle, numberOfReps, false);
      } else {
        // Default: 0→1, snap to 0, repeat
        const animationSequence =
          repeatDelay > 0
            ? withSequence(
                animateToEnd,
                withDelay(repeatDelay, withTiming(0, { duration: 0 }))
              )
            : withSequence(animateToEnd, withTiming(0, { duration: 0 }));

        repeatedAnimation = withRepeat(animationSequence, numberOfReps, false);
      }

      progress.set(
        initialDelay > 0
          ? withDelay(initialDelay, repeatedAnimation)
          : repeatedAnimation
      );
    }
  );

  // ── Geometry ──────────────────────────────────────────────────────────
  // Three derived values compute the overlay's bounding dimensions so that
  // a rotated overlay fully covers the container at any track/overlay angle.

  const trackAngleRad = (trackAngle * Math.PI) / 180;
  const overlayAngleRad = (overlayAngle * Math.PI) / 180;
  const cosOverlay = Math.abs(Math.cos(overlayAngleRad));
  const sinOverlay = Math.abs(Math.sin(overlayAngleRad));

  // Perpendicular span of the container at trackAngle: W·|sin α| + H·|cos α|
  const translateContainerHeight = useDerivedValue(() => {
    const containerW = containerWidth.get();
    const containerH = containerHeight.get();
    const sinTrack = Math.abs(Math.sin(trackAngleRad));
    const cosTrack = Math.abs(Math.cos(trackAngleRad));
    return containerW * sinTrack + containerH * cosTrack;
  });

  // Rotate container height (pre-rotation by overlayAngle β).
  // Must fully cover the translate container after rotation:
  //   h ≥ (translateHeight + overlayW · |sin β|) / |cos β|
  const rotateContainerHeight = useDerivedValue(() => {
    const tch = translateContainerHeight.get();
    const highlightW = overlayWidth.get();
    if (tch <= 0) return 0;
    if (cosOverlay <= 0.001) return tch;
    return (tch + highlightW * sinOverlay) / cosOverlay;
  });

  // AABB width of the rotated overlay: w·|cos β| + h·|sin β|.
  // Used as the start offset so the overlay begins fully off-screen.
  const translateContainerWidth = useDerivedValue(() => {
    const highlightW = overlayWidth.get();
    const rch = rotateContainerHeight.get();
    return highlightW * cosOverlay + rch * sinOverlay;
  });

  // ── Animated style ────────────────────────────────────────────────────

  const animatedStyle = useAnimatedStyle(() => {
    const containerW = containerWidth.get();
    const highlightW = overlayWidth.get();
    const isReady = containerW > 0 && highlightW > 0;

    if (!isReady) {
      return { opacity: 0, transform: [{ translateX: 0 }] };
    }

    const effectiveWidth = translateContainerWidth.get();
    const startPosition = -effectiveWidth;
    const endPosition = trackDistance.get();
    const translateXValue =
      startPosition + progress.get() * (endPosition - startPosition);

    return {
      opacity: 1,
      width: translateContainerWidth.get(),
      height: translateContainerHeight.get(),
      transform: [{ translateX: translateXValue }, { translateY: "-50%" }],
    };
  });

  return { animatedStyle, rotateContainerHeight };
};
