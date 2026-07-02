import type React from "react";
import type { ViewProps } from "react-native";
import type {
  SharedValue,
  DerivedValue,
  WithTimingConfig,
  WithSpringConfig,
} from "react-native-reanimated";

/** Shimmer context shared between root and child components. */
export interface ShimmerContextValue {
  /** Container width (auto-measured via onLayout). */
  containerWidth: SharedValue<number>;
  /** Container height (auto-measured via onLayout). */
  containerHeight: SharedValue<number>;
  /** Container diagonal: sqrt(width² + height²). */
  containerDiagonal: DerivedValue<number>;
  /** When true, renders visual debugging aids (borders, track line). */
  debug: boolean;
}

/** Props for the root Shimmer component. Extends ViewProps. */
export interface ShimmerProps extends ViewProps {
  /** Enables visual debugging aids. @default false */
  debug?: boolean;
  children: React.ReactNode;
}

/** Base fields shared by all animation config variants. */
interface ShimmerAnimationConfigBase {
  /** Repeat count. Use `-1` for infinite. @default -1 */
  numberOfReps?: number;
  /** Ping-pong mode: reverses direction each iteration. @default false */
  reverse?: boolean;
}

export type ShimmerAnimationConfig =
  | (ShimmerAnimationConfigBase & { type: "timing"; config?: WithTimingConfig })
  | (ShimmerAnimationConfigBase & {
      type: "spring";
      config?: WithSpringConfig;
    });

/**
 * Overlay width value.
 * - `number` — absolute pixels (e.g. `64`)
 * - `` `${number}%` `` — percentage of container width (e.g. `"50%"`)
 */
export type ShimmerOverlayWidth = number | `${number}%`;

/** Props for the Shimmer.Overlay component. */
export interface ShimmerOverlayProps {
  /** Content rendered inside the animated highlight. */
  children: React.ReactNode;
  /** Width of the overlay highlight — pixels or percentage of container. */
  width: ShimmerOverlayWidth;
  /**
   * Track direction in degrees (0–360).
   * 0° = right, 90° = down, 180° = left, 270° = up.
   * @default 0
   */
  trackAngle?: number;
  /** Rotation applied to the overlay content (degrees). @default 0 */
  overlayAngle?: number;
  /**
   * Shorthand for animation duration (ms).
   * Ignored when `animation.config.duration` is set.
   * @default 2000
   */
  duration?: number;
  /** Delay before the first animation cycle (ms). @default 500 */
  initialDelay?: number;
  /** Delay between repeat cycles (ms). @default 0 */
  repeatDelay?: number;
  /** Full animation config. @default { type: "timing", config: { duration: 2000 } } */
  animation?: ShimmerAnimationConfig;
  /**
   * External progress SharedValue (0–1) for controlled mode.
   * Disables auto-play; overlay position is driven entirely by this value.
   */
  progress?: SharedValue<number>;
  /**
   * SharedValue that mirrors current progress on the UI thread.
   * Useful for deriving synced animations (e.g. opacity from progress).
   */
  onProgress?: SharedValue<number>;
}

/**
 * Props for Shimmer.Mask — clips the overlay to children's alpha channel.
 * Children must use opaque colors (e.g. `text-black`, `bg-black`) for the mask to work.
 */
export interface ShimmerMaskProps {
  /** Mask shape. Must use opaque colors — MaskedView clips via the alpha channel. */
  children: React.ReactNode;
  /** Animated overlay element (typically a Shimmer.Overlay). */
  overlay: React.ReactNode;
  /** Base fill rendered behind the overlay, clipped to the mask shape. */
  background?: React.ReactNode;
}

/**
 * Config for useShimmerAnimation hook.
 * Reuses fields from ShimmerContextValue and ShimmerOverlayProps.
 */
export interface UseShimmerAnimationConfig
  extends
    Pick<ShimmerContextValue, "containerWidth" | "containerHeight">,
    Required<Pick<ShimmerOverlayProps, "trackAngle" | "overlayAngle">>,
    Pick<
      ShimmerOverlayProps,
      "duration" | "initialDelay" | "repeatDelay" | "animation"
    > {
  /** Resolved overlay width (pixels). Derived from the width prop. */
  overlayWidth: DerivedValue<number>;
  /** Total distance the overlay must travel along the track. */
  trackDistance: DerivedValue<number>;
  /** Animation progress (0–1). */
  progress: SharedValue<number>;
  /** Auto-play animation when dimensions are ready. @default true */
  autoPlay?: boolean;
}
