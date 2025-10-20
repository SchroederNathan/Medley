import * as Haptics from "expo-haptics";
import { Share2, Star } from "lucide-react-native";
import React, { FC, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { themes } from "../../constants/colors";

const BUTTON_RADIUS = 28; // 56px diameter
const RADIUS = 96; // distance from press point to button center
const ANGLE_SPREAD_DEG = 40; // spread between buttons around the base angle

type ButtonItemProps = {
  button: { id: RadialAction; icon: any; pos: { x: number; y: number } };
  hoveredId: SharedValue<RadialAction | null>;
  isTracking: boolean;
};

const ButtonItem: FC<ButtonItemProps> = ({ button, hoveredId, isTracking }) => {
  const rStyle = useAnimatedStyle(() => {
    const isActive = hoveredId.value === button.id;
    return {
      backgroundColor: isActive
        ? themes.light.background
        : themes.dark.background,
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
      style={[
        styles.button,
        rStyle,
        {
          left: button.pos.x - BUTTON_RADIUS,
          top: button.pos.y - BUTTON_RADIUS,
        },
      ]}
      pointerEvents={isTracking ? "auto" : "none"}
    >
      <Animated.View style={activeIconStyle}>
        <Icon size={22} color="#000000" />
      </Animated.View>
      <Animated.View style={inactiveIconStyle}>
        <Icon size={22} color="#FFFFFF" />
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
    [anglesDeg[0], anglesDeg[1], pressX, pressY],
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

  const checkButtonHover = (x: number, y: number) => {
    "worklet";
    let active: RadialAction | null = null;
    for (const b of buttonCenters) {
      const dx = x - b.x;
      const dy = y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= BUTTON_RADIUS * 1.2) {
        active = b.id;
        break;
      }
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
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.1)",
    width: BUTTON_RADIUS * 2,
    height: BUTTON_RADIUS * 2,
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
});
