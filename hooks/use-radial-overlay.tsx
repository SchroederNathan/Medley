import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue } from "react-native-reanimated";
import { useOverlay } from "../contexts/overlay-context";
import { RadialMenu } from "../components/ui/radial-menu";

export type RadialActionDef = { id: string; icon: any; title: string };

type UseRadialOverlayParams = {
  actions: RadialActionDef[];
  onSelect: (id: string) => void | Promise<void>;
  onCancel?: () => void;
  targetRef: React.RefObject<View | null>;
  renderClone: (dims: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => React.ReactNode;
  longPressMs?: number;
  maxDistance?: number;
};

export function useRadialOverlay({
  actions,
  onSelect,
  onCancel,
  targetRef,
  renderClone,
  longPressMs = 500,
  maxDistance = 25,
}: UseRadialOverlayParams) {
  const { showOverlay, hideOverlay } = useOverlay();

  const cursorX = useSharedValue(0);
  const cursorY = useSharedValue(0);
  const releaseSignal = useSharedValue(0);
  const overlayOpen = useSharedValue(0);
  const isLongPressed = useSharedValue(false);

  const openOverlayAt = useCallback(
    (pressX: number, pressY: number) => {
      targetRef.current?.measureInWindow((x, y, width, height) => {
        const clone = renderClone({ x, y, width, height });
        const content = (
          <View style={[StyleSheet.absoluteFill, { zIndex: 10000 }]}>
            {clone}
            <RadialMenu
              pressX={pressX}
              pressY={pressY}
              cursorX={cursorX}
              cursorY={cursorY}
              releaseSignal={releaseSignal}
              actions={actions}
              onSelect={async (id: string) => {
                try {
                  await onSelect(id);
                } finally {
                  overlayOpen.value = 0;
                  isLongPressed.value = false;
                  hideOverlay();
                }
              }}
              onCancel={() => {
                overlayOpen.value = 0;
                isLongPressed.value = false;
                hideOverlay();
                if (onCancel) onCancel();
              }}
            />
          </View>
        );
        showOverlay(content);
        overlayOpen.value = 1;
      });
    },
    [
      actions,
      hideOverlay,
      onCancel,
      onSelect,
      overlayOpen,
      releaseSignal,
      showOverlay,
      targetRef,
      cursorX,
      cursorY,
      renderClone,
    ]
  );

  const longPressGesture = Gesture.LongPress()
    .minDuration(longPressMs)
    .maxDistance(maxDistance)
    .onStart((event) => {
      "worklet";
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      isLongPressed.value = true;
      const ax = (event as any).absoluteX ?? (event as any).x ?? 0;
      const ay = (event as any).absoluteY ?? (event as any).y ?? 0;
      cursorX.value = ax;
      cursorY.value = ay;
      runOnJS(openOverlayAt)(ax, ay);
    })
    .onFinalize(() => {
      "worklet";
      isLongPressed.value = false;
    });

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .activateAfterLongPress(longPressMs)
    .onBegin((e) => {
      "worklet";
      cursorX.value = e.absoluteX;
      cursorY.value = e.absoluteY;
    })
    .onUpdate((e) => {
      "worklet";
      cursorX.value = e.absoluteX;
      cursorY.value = e.absoluteY;
    })
    .onEnd(() => {
      "worklet";
      if (overlayOpen.value === 1) {
        releaseSignal.value = releaseSignal.value + 1;
      }
    });

  return {
    longPressGesture,
    panGesture,
    isLongPressed,
    overlayOpen,
  } as const;
}
