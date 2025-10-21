import * as Haptics from "expo-haptics";
import { Share2, Star } from "lucide-react-native";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { themes } from "../../constants/colors";

const BUTTON_RADIUS = 28; // 56px diameter
const RADIUS = 96; // distance from press point to button center
const ANGLE_SPREAD_DEG = 40; // spread between buttons around the base angle

// Base icon size that scales dynamically
const BASE_ICON_SIZE = 22;

type ButtonItemProps = {
  button: { id: RadialAction; icon: any; pos: { x: number; y: number } };
  hoveredId: SharedValue<RadialAction | null>;
  isTracking: boolean;
  pressX: number;
  pressY: number;
  animationProgress: SharedValue<number>;
  proximityScale: SharedValue<number>;
};

const ButtonItem: FC<ButtonItemProps> = ({
  button,
  hoveredId,
  isTracking,
  pressX,
  pressY,
  animationProgress,
  proximityScale,
}) => {
  const [iconSize, setIconSize] = useState(BASE_ICON_SIZE);

  // Update icon size based on proximity and progress
  useAnimatedReaction(
    () => ({
      progress: animationProgress.value,
      proximity: proximityScale.value,
    }),
    ({ progress, proximity }) => {
      const newSize = BASE_ICON_SIZE * proximity;
      runOnJS(setIconSize)(newSize);
    },
  );

  const rStyle = useAnimatedStyle(() => {
    const isActive = hoveredId.value === button.id;
    return {
      backgroundColor: isActive
        ? themes.light.background
        : themes.dark.background,
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    const startX = pressX - BUTTON_RADIUS;
    const startY = pressY - BUTTON_RADIUS;
    const endX = button.pos.x - BUTTON_RADIUS;
    const endY = button.pos.y - BUTTON_RADIUS;

    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;
    const proximity = proximityScale.value;
    const scale = progress * proximity; // Combined entrance + proximity scale
    const opacity = progress;

    // Use width/height instead of transform scale for crisp rendering
    const containerSize = BUTTON_RADIUS * 2 * scale;

    return {
      left: currentX - (containerSize - BUTTON_RADIUS * 2) / 2, // Center the scaled container
      top: currentY - (containerSize - BUTTON_RADIUS * 2) / 2,
      width: containerSize,
      height: containerSize,
      opacity,
    };
  });

  const activeIconStyle = useAnimatedStyle(() => {
    const isActive = hoveredId.value === button.id;
    return {
      opacity: isActive ? 1 : 0,
      position: "absolute" as const,
    };
  });

  const inactiveIconStyle = useAnimatedStyle(() => {
    const isActive = hoveredId.value === button.id;
    return {
      opacity: isActive ? 0 : 1,
      position: "absolute" as const,
    };
  });

  const Icon = button.icon;

  return (
    <Animated.View
      style={[styles.button, rStyle, animatedButtonStyle]}
      pointerEvents={isTracking ? "auto" : "none"}
    >
      <Animated.View style={activeIconStyle}>
        <Icon size={iconSize} color="#000000" />
      </Animated.View>
      <Animated.View style={inactiveIconStyle}>
        <Icon size={iconSize} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
};

export type RadialAction = "save" | "share";

type RadialMenuProps = {
  pressX: number;
  pressY: number;
  cursorX?: SharedValue<number>;
  cursorY?: SharedValue<number>;
  releaseSignal?: SharedValue<number>;
  onSelect: (action: RadialAction) => void;
  onCancel: () => void;
};

export const RadialMenu: FC<RadialMenuProps> = ({
  pressX,
  pressY,
  cursorX,
  cursorY,
  releaseSignal,
  onSelect,
  onCancel,
}) => {
  const { width, height } = Dimensions.get("window");

  // Determine base angle based on press quadrant; use angles compatible with RN coords
  const baseAngleDeg = useMemo(() => {
    const cx = width / 2;
    const cy = height / 2;
    const inMiddle =
      Math.abs(pressX - cx) < width * 0.2 &&
      Math.abs(pressY - cy) < height * 0.2;
    if (inMiddle) return 225; // up-left
    const right = pressX > cx;
    const bottom = pressY > cy;
    if (right && bottom) return 225; // up-left
    if (!right && !bottom) return 45; // down-right
    if (right && !bottom) return 135; // down-left
    return 315; // up-right
  }, [pressX, pressY, width, height]);

  const anglesDeg = useMemo(() => {
    return [
      baseAngleDeg - ANGLE_SPREAD_DEG / 2,
      baseAngleDeg + ANGLE_SPREAD_DEG / 2,
    ];
  }, [baseAngleDeg]);

  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: pressX + RADIUS * Math.cos(rad),
      y: pressY + RADIUS * Math.sin(rad),
    };
  };

  const buttons = useMemo(
    () => [
      { id: "save" as const, icon: Star, pos: toXY(anglesDeg[0]) },
      { id: "share" as const, icon: Share2, pos: toXY(anglesDeg[1]) },
    ],
    [anglesDeg, toXY, pressX, pressY],
  );

  // Centers used inside worklets (simple serializable objects only)
  const buttonCenters = useMemo(
    () => [
      { id: "save" as const, x: buttons[0].pos.x, y: buttons[0].pos.y },
      { id: "share" as const, x: buttons[1].pos.x, y: buttons[1].pos.y },
    ],
    [buttons],
  );

  const hoveredId = useSharedValue<RadialAction | null>(null);
  const lastHapticId = useSharedValue<RadialAction | null>(null);
  const animationProgress = useSharedValue(0);
  const hasAnimatedIn = useRef(false);
  const proximityScales = {
    save: useSharedValue(1),
    share: useSharedValue(1),
  };

  // Animate buttons in when component mounts
  useEffect(() => {
    if (!hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      runOnUI(() => {
        animationProgress.value = withTiming(1, { duration: 300 });
      })();
    }
  }, [animationProgress]);

  const checkButtonHover = (x: number, y: number) => {
    "worklet";
    let active: RadialAction | null = null;
    let nearestId: RadialAction | null = null;
    let nearestDist = Number.POSITIVE_INFINITY;
    const maxProximityDistance = BUTTON_RADIUS * 2;

    for (const b of buttonCenters) {
      const dx = x - b.x;
      const dy = y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Track nearest for hover state
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = b.id;
      }

      // Compute proximity scale between 1.0 and 1.4 (upscaling for emphasis)
      const normalized = Math.max(
        0,
        Math.min(1, 1 - dist / maxProximityDistance),
      );
      const proximity = 1 + normalized * 0.4; // 1.0 to 1.4
      if (b.id === "save") {
        proximityScales.save.value = proximity;
      } else {
        proximityScales.share.value = proximity;
      }
    }

    if (nearestId && nearestDist <= BUTTON_RADIUS * 1.4) {
      active = nearestId;
    }
    if (hoveredId.value !== active) {
      hoveredId.value = active;
      if (active && lastHapticId.value !== active) {
        lastHapticId.value = active;
        runOnJS(Haptics.selectionAsync)();
      }
    }
  };

  // React to external cursor shared values if provided
  useAnimatedReaction(
    () => (cursorX && cursorY ? { x: cursorX.value, y: cursorY.value } : null),
    (pos) => {
      if (!pos) return;
      checkButtonHover(pos.x, pos.y);
    },
  );

  // React to release signal from parent
  useAnimatedReaction(
    () => (releaseSignal ? releaseSignal.value : -1),
    (val, prev) => {
      if (val === -1) return; // not provided
      if (prev == null) return; // skip first frame
      if (val === prev) return; // no change
      if (hoveredId.value) {
        runOnJS(Haptics.selectionAsync)();
        runOnJS(onSelect)(hoveredId.value);
      } else {
        runOnJS(onCancel)();
      }
      hoveredId.value = null;
      lastHapticId.value = null;
    },
  );

  // Determine if we're actively tracking a gesture
  const isTracking = cursorX !== undefined && cursorY !== undefined;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {buttons.map((b) => (
        <ButtonItem
          key={b.id}
          button={b}
          hoveredId={hoveredId}
          isTracking={isTracking}
          pressX={pressX}
          pressY={pressY}
          animationProgress={animationProgress}
          proximityScale={
            b.id === "save" ? proximityScales.save : proximityScales.share
          }
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.1)",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
