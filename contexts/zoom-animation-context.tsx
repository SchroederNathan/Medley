import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
} from "react";
import { useWindowDimensions } from "react-native";
import {
  Easing,
  useSharedValue,
  useAnimatedReaction,
  withDelay,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { useTargetMeasurement } from "../hooks/use-target-measurement";

// Animation timing configuration
// 250ms matches system animation durations for natural feel
const _duration = 250;
export const _timingConfig = {
  duration: _duration,
  easing: Easing.out(Easing.quad),
};

export type ZoomConfig = {
  targetWidth?: number;
  targetHeight?: number;
  aspectRatio?: number;
};

type ContextValue = {
  targetRef: ReturnType<typeof useTargetMeasurement>["targetRef"];
  onTargetLayout: () => void;
  handleMeasurement: ReturnType<
    typeof useTargetMeasurement
  >["handleMeasurement"];

  zoomState: SharedValue<"open" | "close">;

  // Coordinates and Dimensions
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: SharedValue<number>;
  height: SharedValue<number>;

  // Opacities
  blurIntensity: SharedValue<number>;
  dimOpacity: SharedValue<number>; // Previously closeBtnOpacity
  extraContentOpacity: SharedValue<number>; // Previously changeImageRowOpacity

  // Methods
  open: (config?: ZoomConfig) => void;
  close: () => void;
  snapToCenter: () => void;

  // Helper to get active dimensions if needed in JS
  activeConfig: SharedValue<ZoomConfig>;
};

const ZoomAnimationContext = createContext<ContextValue>({} as ContextValue);

export const ZoomAnimationProvider: FC<PropsWithChildren> = ({ children }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;

  const { targetRef, onTargetLayout, measurement, handleMeasurement } =
    useTargetMeasurement();

  // Shared values
  const zoomState = useSharedValue<"open" | "close">("close");
  const isAnimating = useSharedValue(0);
  const x = useSharedValue(screenCenterX);
  const y = useSharedValue(screenCenterY);
  const width = useSharedValue(0);
  const height = useSharedValue(0);

  const blurIntensity = useSharedValue(0);
  const dimOpacity = useSharedValue(0);
  const extraContentOpacity = useSharedValue(0);

  // Store screen dimensions and config as shared values
  const screenCenterXValue = useSharedValue(screenCenterX);
  const screenCenterYValue = useSharedValue(screenCenterY);
  const activeConfig = useSharedValue<ZoomConfig>({});

  // Sync shared values when screen dimensions change
  useEffect(() => {
    screenCenterXValue.value = screenCenterX;
    screenCenterYValue.value = screenCenterY;
  }, [screenCenterX, screenCenterY, screenCenterXValue, screenCenterYValue]);

  // Track target position as user scrolls
  useAnimatedReaction(
    () => measurement.value,
    (measurementValue) => {
      if (measurementValue === null) return;
      if (zoomState.value === "open") return;
      if (isAnimating.value === 1) return;

      x.value = measurementValue.pageX;
      y.value = measurementValue.pageY;
      // We also update width/height to match the source when closed
      // This ensures if layout changes, we have the correct starting size
      width.value = measurementValue.width;
      height.value = measurementValue.height;
    }
  );

  const calculateTargetDimensions = (config: ZoomConfig) => {
    "worklet";
    let targetW = config.targetWidth || 0;
    let targetH = config.targetHeight || 0;

    // Default strategy: fit within 90% of screen width if not specified
    if (!targetW && !targetH) {
      targetW = screenCenterXValue.value * 2 * 0.9;
      if (config.aspectRatio) {
        targetH = targetW / config.aspectRatio;
      } else {
        // Default to square if nothing known? or current ratio?
        // Fallback to source ratio if available from measurement, otherwise square
        const m = measurement.value;
        const ratio = m ? m.width / m.height : 1;
        targetH = targetW / ratio;
      }
    } else if (targetW && !targetH) {
      // Calculate height from aspect ratio
      if (config.aspectRatio) {
        targetH = targetW / config.aspectRatio;
      } else {
        const m = measurement.value;
        const ratio = m ? m.width / m.height : 1;
        targetH = targetW / ratio;
      }
    } else if (!targetW && targetH) {
      // Calculate width from aspect ratio
      if (config.aspectRatio) {
        targetW = targetH * config.aspectRatio;
      } else {
        const m = measurement.value;
        const ratio = m ? m.width / m.height : 1;
        targetW = targetH * ratio;
      }
    }

    // Safety check against NaN
    if (isNaN(targetW)) targetW = 200;
    if (isNaN(targetH)) targetH = 200;

    return { targetW, targetH };
  };

  const open = (config: ZoomConfig = {}) => {
    "worklet";
    isAnimating.value = 1;
    activeConfig.value = config;

    const currentMeasurement = measurement.value;
    const { targetW, targetH } = calculateTargetDimensions(config);

    const centerX = screenCenterXValue.value;
    const centerY = screenCenterYValue.value;

    if (currentMeasurement === null) {
      // Fallback
      zoomState.value = "open";
      width.value = targetW;
      height.value = targetH;
      x.value = centerX - targetW / 2;
      y.value = centerY - targetH / 2;

      blurIntensity.value = withTiming(100, _timingConfig);
      dimOpacity.value = withDelay(_duration, withTiming(1));
      extraContentOpacity.value = withDelay(_duration, withTiming(1));
      isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
      return;
    }

    // Start from exact current position
    x.value = currentMeasurement.pageX;
    y.value = currentMeasurement.pageY;
    width.value = currentMeasurement.width;
    height.value = currentMeasurement.height;

    zoomState.value = "open";

    // Animate to center
    blurIntensity.value = withTiming(100, _timingConfig);
    width.value = withTiming(targetW, _timingConfig);
    height.value = withTiming(targetH, _timingConfig);
    x.value = withTiming(centerX - targetW / 2, _timingConfig);
    y.value = withTiming(centerY - targetH / 2, _timingConfig);

    dimOpacity.value = withDelay(_duration, withTiming(1));
    extraContentOpacity.value = withDelay(_duration, withTiming(1));
    isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
  };

  const snapToCenter = () => {
    "worklet";
    isAnimating.value = 1;

    const config = activeConfig.value;
    const { targetW, targetH } = calculateTargetDimensions(config);

    const centerX = screenCenterXValue.value;
    const centerY = screenCenterYValue.value;

    blurIntensity.value = withTiming(100, _timingConfig);
    width.value = withTiming(targetW, _timingConfig);
    height.value = withTiming(targetH, _timingConfig);
    x.value = withTiming(centerX - targetW / 2, _timingConfig);
    y.value = withTiming(centerY - targetH / 2, _timingConfig);

    dimOpacity.value = withDelay(_duration, withTiming(1));
    extraContentOpacity.value = withDelay(_duration, withTiming(1));
    isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
  };

  const close = () => {
    "worklet";
    isAnimating.value = 1;

    const currentMeasurement = measurement.value;
    if (currentMeasurement === null) {
      // Fallback
      blurIntensity.value = withTiming(0, _timingConfig);
      dimOpacity.value = withTiming(0, { duration: _duration });
      extraContentOpacity.value = withTiming(0, { duration: 75 });
      zoomState.value = withDelay(
        _duration,
        withTiming("close", { duration: 0 })
      );
      isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
      return;
    }

    // Return to original values
    zoomState.value = withDelay(
      _duration,
      withTiming("close", { duration: 0 })
    );

    blurIntensity.value = withTiming(0, _timingConfig);
    width.value = withTiming(currentMeasurement.width, _timingConfig);
    height.value = withTiming(currentMeasurement.height, _timingConfig);
    x.value = withTiming(currentMeasurement.pageX, _timingConfig);
    y.value = withTiming(currentMeasurement.pageY, _timingConfig);

    dimOpacity.value = withTiming(0, { duration: _duration });
    extraContentOpacity.value = withTiming(0, { duration: 75 });
    isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
  };

  return (
    <ZoomAnimationContext.Provider
      value={{
        targetRef,
        onTargetLayout,
        handleMeasurement,
        zoomState,
        x,
        y,
        width,
        height,
        blurIntensity,
        dimOpacity,
        extraContentOpacity,
        open,
        close,
        snapToCenter,
        activeConfig,
      }}
    >
      {children}
    </ZoomAnimationContext.Provider>
  );
};

export const useZoomAnimation = () => {
  const context = useContext(ZoomAnimationContext);

  if (!context) {
    throw new Error(
      "useZoomAnimation must be used within an ZoomAnimationProvider"
    );
  }

  return context;
};
