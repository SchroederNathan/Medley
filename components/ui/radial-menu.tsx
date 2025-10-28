import * as Haptics from "expo-haptics";
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
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

const BUTTON_RADIUS = 28; // 56px diameter
const DEFAULT_RADIUS = 96; // distance from press point to button center
const DEFAULT_ANGLE_STEP_DEG = 40; // per-step spread offset around the base angle

// Base icon size that scales dynamically
const BASE_ICON_SIZE = 22;

type ButtonItemProps = {
  button: { id: string; icon: any; pos: { x: number; y: number } };
  hoveredId: SharedValue<string | null>;
  isTracking: boolean;
  pressX: number;
  pressY: number;
  animationProgress: SharedValue<number>;
  cursorX?: SharedValue<number>;
  cursorY?: SharedValue<number>;
};

const ButtonItem: FC<ButtonItemProps> = ({
  button,
  hoveredId,
  isTracking,
  pressX,
  pressY,
  animationProgress,
  cursorX,
  cursorY,
}) => {
  const { theme } = useContext(ThemeContext);
  const secondaryBackgroundColor = theme.secondaryButtonBackground;

  const rStyle = useAnimatedStyle(() => {
    const isActive = hoveredId.value === button.id;
    return {
      backgroundColor: isActive ? secondaryBackgroundColor : "#1C1C1C",
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
    const cx = cursorX?.value ?? pressX;
    const cy = cursorY?.value ?? pressY;
    const dx = cx - button.pos.x;
    const dy = cy - button.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxProximityDistance = BUTTON_RADIUS * 2;
    const normalized = Math.max(
      0,
      Math.min(1, 1 - dist / maxProximityDistance),
    );
    const proximity = 1 + normalized * 0.4; // 1.0 to 1.4
    const scale = progress * proximity; // Combined entrance + proximity scale
    const opacity = progress;

    // Nudge button slightly away from initial press when finger nears center
    const vx = endX - startX;
    const vy = endY - startY;
    const vlen = Math.max(1, Math.sqrt(vx * vx + vy * vy));
    const ux = vx / vlen;
    const uy = vy / vlen;
    const closeness = Math.max(0, Math.min(1, (proximity - 1) / 0.4));
    const eased = closeness * closeness;
    const offsetMax = 32;
    const offset = offsetMax * eased * progress;
    const adjX = currentX + ux * offset;
    const adjY = currentY + uy * offset;

    return {
      left: adjX,
      top: adjY,
      opacity,
      transform: [{ scale }],
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
        <Icon size={BASE_ICON_SIZE} color="#000000" />
      </Animated.View>
      <Animated.View style={inactiveIconStyle}>
        <Icon size={BASE_ICON_SIZE} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
};

export type RadialActionDef = { id: string; icon: any; title: string };

type RadialMenuProps = {
  pressX: number;
  pressY: number;
  cursorX?: SharedValue<number>;
  cursorY?: SharedValue<number>;
  releaseSignal?: SharedValue<number>;
  actions: RadialActionDef[];
  radius?: number;
  angleStepDeg?: number;
  onSelect: (actionId: string) => void;
  onCancel: () => void;
};

export const RadialMenu: FC<RadialMenuProps> = ({
  pressX,
  pressY,
  cursorX,
  cursorY,
  releaseSignal,
  actions,
  radius = DEFAULT_RADIUS,
  angleStepDeg = DEFAULT_ANGLE_STEP_DEG,
  onSelect,
  onCancel,
}) => {
  const { width, height } = Dimensions.get("window");
  const { theme } = useContext(ThemeContext);

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
    const count = Math.max(1, actions.length);
    if (count === 1) return [baseAngleDeg];
    const half = (count - 1) / 2;
    return new Array(count).fill(0).map((_, i) => {
      const offsetIndex = i - half;
      return baseAngleDeg + offsetIndex * angleStepDeg;
    });
  }, [baseAngleDeg, actions.length, angleStepDeg]);

  const toXY = useCallback(
    (deg: number) => {
      const rad = (deg * Math.PI) / 180;
      return {
        x: pressX + radius * Math.cos(rad),
        y: pressY + radius * Math.sin(rad),
      };
    },
    [pressX, pressY, radius],
  );

  const buttons = useMemo(
    () =>
      actions.map((a, i) => ({
        id: a.id,
        icon: a.icon,
        pos: toXY(anglesDeg[i]),
      })),
    [actions, anglesDeg, toXY],
  );

  // Centers used inside worklets (simple serializable objects only)
  const buttonCenters = useMemo(
    () => buttons.map((b) => ({ id: b.id, x: b.pos.x, y: b.pos.y })),
    [buttons],
  );

  const hoveredId = useSharedValue<string | null>(null);
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);
  const lastHapticId = useSharedValue<string | null>(null);
  const animationProgress = useSharedValue(0);
  const hasAnimatedIn = useRef(false);
  // Removed per-button shared values to avoid hook calls in dynamic loops/callbacks

  // Animate buttons in when component mounts
  useEffect(() => {
    if (!hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      animationProgress.value = withSpring(1, {
        damping: 80,
      });
    }
  }, [animationProgress]);

  const checkButtonHover = (x: number, y: number) => {
    "worklet";
    let active: string | null = null;
    let nearestId: string | null = null;
    let nearestDist2 = Number.POSITIVE_INFINITY;
    const hoverThreshold2 = BUTTON_RADIUS * 1.4 * (BUTTON_RADIUS * 1.4);

    for (let i = 0; i < buttonCenters.length; i++) {
      const b = buttonCenters[i];
      const dx = x - b.x;
      const dy = y - b.y;
      const dist2 = dx * dx + dy * dy;

      if (dist2 < nearestDist2) {
        nearestDist2 = dist2;
        nearestId = b.id;
      }
    }

    if (nearestId && nearestDist2 <= hoverThreshold2) {
      active = nearestId;
    }
    if (hoveredId.value !== active) {
      hoveredId.value = active;
      if (active && lastHapticId.value !== active) {
        lastHapticId.value = active;
        runOnJS(Haptics.selectionAsync)();
      } else if (!active) {
        // Clear lastHapticId when leaving button area
        lastHapticId.value = null;
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

  // Mirror hoveredId into React state to read title string safely
  useAnimatedReaction(
    () => hoveredId.value,
    (val, prev) => {
      if (val === prev) return;
      runOnJS(setHoveredActionId)(val);
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

  // Compute label text from hovered action id
  const hoveredTitle = useMemo(() => {
    if (!hoveredActionId) return "";
    const a = actions.find((x) => x.id === hoveredActionId);
    return a?.title ?? "";
  }, [actions, hoveredActionId]);

  // Compute label position diagonally opposite the initial press quadrant
  const pressIsLeft = pressX < width / 2;
  const labelOnLeft = !pressIsLeft; // keep opposite horizontally for clarity

  // Vertical placement: prefer top 2/3 of screen, inverse-mapped from pressY
  const verticalMargin = 36;
  const allowedTopMin = verticalMargin; // top padding
  const allowedTopMax = height * (2 / 3) - verticalMargin; // bottom of allowed band
  const pressNorm = Math.max(0, Math.min(1, pressY / height));
  const inv = 1 - pressNorm; // higher press -> lower label; lower press -> higher label
  let labelTop = allowedTopMin + inv * (allowedTopMax - allowedTopMin);

  // Keep label reasonably near the press position for readability
  const maxVerticalDelta = Math.min(160, height * 0.2);
  const nearMin = Math.max(allowedTopMin, pressY - maxVerticalDelta);
  const nearMax = Math.min(allowedTopMax, pressY + maxVerticalDelta);
  labelTop = Math.max(nearMin, Math.min(labelTop, nearMax));

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
          cursorX={cursorX}
          cursorY={cursorY}
        />
      ))}
      {!!hoveredTitle && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 10001,
              pointerEvents: "none",
              overflow: "visible",
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={{
              position: "absolute",
              overflow: "visible",
              top: labelTop,
              left: labelOnLeft ? 36 : undefined,
              right: labelOnLeft ? undefined : 36,
              alignItems: labelOnLeft ? "flex-start" : "flex-end",
            }}
          >
            <Animated.Text
              style={{
                color: theme.text,
                overflow: "visible",
                fontSize: 40,
                fontFamily: fontFamily.tanker.regular,
                textShadowColor: "rgba(0,0,0,1)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8
              }}
            >
              {hoveredTitle}
            </Animated.Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    boxShadow: "0 1.5px 0 0 rgba(0, 0, 0, 0.2)",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    width: BUTTON_RADIUS * 2,
    height: BUTTON_RADIUS * 2,
  },
});
