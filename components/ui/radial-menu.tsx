import * as Haptics from "expo-haptics";
import { Share2, Star, Bookmark } from "lucide-react-native";
import React, {
  FC,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";

const BUTTON_RADIUS = 28; // 56px diameter
const RADIUS = 96; // distance from press point to button center
const ANGLE_SPREAD_DEG = 40; // spread offset around the base angle

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
  const { theme } = useContext(ThemeContext);

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
      backgroundColor: isActive ? theme.secondaryButtonBackground : "#1C1C1C",
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

    // Nudge button slightly away from initial press when finger nears center
    const vx = endX - startX;
    const vy = endY - startY;
    const vlen = Math.max(1, Math.sqrt(vx * vx + vy * vy));
    const ux = vx / vlen;
    const uy = vy / vlen;
    const closeness = Math.max(0, Math.min(1, (proximity - 1) / 0.4));
    const eased = closeness * closeness;
    const offsetMax = 14;
    const offset = offsetMax * eased * progress;
    const adjX = currentX + ux * offset;
    const adjY = currentY + uy * offset;

    return {
      left: adjX - (containerSize - BUTTON_RADIUS * 2) / 2, 
      top: adjY - (containerSize - BUTTON_RADIUS * 2) / 2,
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

export type RadialAction = "star" | "bookmark" | "share";

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

  // Determine base angle from long-press point per thumb-position rules.
  // User provides angles with 0° at top, increasing counterclockwise.
  // Convert to RN coords used by toXY(): 0°=right, 90°=down, 180°=left, 270°=up.
  const baseAngleDeg = useMemo(() => {
    const cx = width / 2;
    const x = pressX;
    const y = pressY;

    const isTopSixth = y < height / 4;
    const isCenterBand = Math.abs(x - cx) < width * 0.1; // middle fifth ~ 20%

    // Helper to angle-lerp in user space (0°=up, CCW+i)
    const lerpAngle = (a: number, b: number, t: number) => {
      const delta = ((b - a + 540) % 360) - 180;
      return (a + delta * t + 360) % 360;
    };

    // Center target: 0° (up) or 180° (down) in user space
    const centerAngle = isTopSixth ? 180 : 0;

    // Side far targets in user space
    const leftFar = isTopSixth ? 230 : 310;
    const rightFar = isTopSixth ? 120 : 60;

    // Horizontal proximity to center (0 at center, 1 near edges)
    const dxNorm = Math.min(1, Math.abs(x - cx) / (width / 2));

    let userAngleDeg: number;
    if (isCenterBand) {
      userAngleDeg = centerAngle;
    } else if (x < cx) {
      userAngleDeg = lerpAngle(centerAngle, leftFar, dxNorm);
    } else {
      userAngleDeg = lerpAngle(centerAngle, rightFar, dxNorm);
    }

    // Map user's convention to RN toXY convention
    // Mapping: A_rn = (270 - A_user) mod 360
    const rnAngle = (270 - userAngleDeg + 360) % 360;
    return rnAngle;
  }, [pressX, pressY, width, height]);

  const anglesDeg = useMemo(() => {
    // Three buttons: left, center, right around the base angle
    return [
      baseAngleDeg - ANGLE_SPREAD_DEG,
      baseAngleDeg,
      baseAngleDeg + ANGLE_SPREAD_DEG,
    ];
  }, [baseAngleDeg]);

  const toXY = useCallback(
    (deg: number) => {
      const rad = (deg * Math.PI) / 180;
      return {
        x: pressX + RADIUS * Math.cos(rad),
        y: pressY + RADIUS * Math.sin(rad),
      };
    },
    [pressX, pressY],
  );

  const buttons = useMemo(
    () => [
      { id: "star" as const, icon: Star, pos: toXY(anglesDeg[0]) },
      { id: "bookmark" as const, icon: Bookmark, pos: toXY(anglesDeg[1]) },
      { id: "share" as const, icon: Share2, pos: toXY(anglesDeg[2]) },
    ],
    [anglesDeg, toXY],
  );

  // Centers used inside worklets (simple serializable objects only)
  const buttonCenters = useMemo(
    () => [
      { id: "star" as const, x: buttons[0].pos.x, y: buttons[0].pos.y },
      { id: "bookmark" as const, x: buttons[1].pos.x, y: buttons[1].pos.y },
      { id: "share" as const, x: buttons[2].pos.x, y: buttons[2].pos.y },
    ],
    [buttons],
  );

  const hoveredId = useSharedValue<RadialAction | null>(null);
  const lastHapticId = useSharedValue<RadialAction | null>(null);
  const animationProgress = useSharedValue(0);
  const hasAnimatedIn = useRef(false);
  const proximityScales = {
    star: useSharedValue(1),
    bookmark: useSharedValue(1),
    share: useSharedValue(1),
  };

  // Animate buttons in when component mounts
  useEffect(() => {
    if (!hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      runOnUI(() => {
        animationProgress.value = withSpring(1, {
          damping: 80,
        });
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
      if (b.id === "star") {
        proximityScales.star.value = proximity;
      } else if (b.id === "bookmark") {
        proximityScales.bookmark.value = proximity;
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
            b.id === "star"
              ? proximityScales.star
              : b.id === "bookmark"
                ? proximityScales.bookmark
                : proximityScales.share
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
