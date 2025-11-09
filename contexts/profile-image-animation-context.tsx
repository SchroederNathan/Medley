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
} from "react-native-reanimated";
import { useTargetMeasurement } from "../hooks/use-target-measurement";

// Animation timing configuration
// 250ms matches system animation durations for natural feel
const _duration = 250;
export const _timingConfig = {
  duration: _duration,
  easing: Easing.out(Easing.quad),
};

type ContextValue = {
  defaultProfileImageSize: number;
  expandedProfileImageSize: number;
  targetRef: ReturnType<typeof useTargetMeasurement>["targetRef"];
  onTargetLayout: () => void;
  handleMeasurement: ReturnType<
    typeof useTargetMeasurement
  >["handleMeasurement"];
  imageState: ReturnType<typeof useSharedValue<"open" | "close">>;
  imageXCoord: ReturnType<typeof useSharedValue<number>>;
  imageYCoord: ReturnType<typeof useSharedValue<number>>;
  imageSize: ReturnType<typeof useSharedValue<number>>;
  blurIntensity: ReturnType<typeof useSharedValue<number>>;
  closeBtnOpacity: ReturnType<typeof useSharedValue<number>>;
  changeImageRowOpacity: ReturnType<typeof useSharedValue<number>>;
  open: () => void;
  close: () => void;
};

const ProfileImageAnimationContext = createContext<ContextValue>(
  {} as ContextValue,
);

export const ProfileImageAnimationProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Screen center coordinates for positioning expanded image precisely in viewport center
  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;
  const defaultProfileImageSize = 100; // Match your profile image size
  // 65% of screen width balances image visibility with background context
  const expandedProfileImageSize = screenWidth * 0.65;

  const { targetRef, onTargetLayout, measurement, handleMeasurement } =
    useTargetMeasurement();

  // Shared values coordinate animation state across components without re-renders
  const imageState = useSharedValue<"open" | "close">("close");
  const isAnimating = useSharedValue(0); // 0 = false, 1 = true (for animation compatibility)
  const imageXCoord = useSharedValue(screenCenterX);
  const imageYCoord = useSharedValue(screenCenterY);
  const imageSize = useSharedValue(defaultProfileImageSize);
  const blurIntensity = useSharedValue(0);
  const closeBtnOpacity = useSharedValue(0);
  const changeImageRowOpacity = useSharedValue(0);
  // Store screen dimensions as shared values for use in worklets
  const screenCenterXValue = useSharedValue(screenCenterX);
  const screenCenterYValue = useSharedValue(screenCenterY);
  const expandedSizeValue = useSharedValue(expandedProfileImageSize);

  // Sync shared values when screen dimensions change
  useEffect(() => {
    screenCenterXValue.value = screenCenterX;
    screenCenterYValue.value = screenCenterY;
    expandedSizeValue.value = expandedProfileImageSize;
  }, [
    screenCenterX,
    screenCenterY,
    expandedProfileImageSize,
    screenCenterXValue,
    screenCenterYValue,
    expandedSizeValue,
  ]);

  // Track profile image position as user scrolls to ensure animation starts from current position
  // Only update when closed and not animating to avoid interfering with animations
  useAnimatedReaction(
    () => measurement.value,
    (measurementValue) => {
      if (measurementValue === null) return;
      if (imageState.value === "open") return; // Don't update during open state
      if (isAnimating.value === 1) return; // Don't update during animations

      // Update coordinates to maintain visual connection when closed
      imageXCoord.value = measurementValue.pageX;
      imageYCoord.value = measurementValue.pageY;
    },
  );

  const open = () => {
    "worklet";

    // Mark that we're animating to prevent reaction from interfering
    isAnimating.value = 1;

    // Get the current exact position of the profile image
    const currentMeasurement = measurement.value;
    if (currentMeasurement === null) {
      // Fallback if measurement not available
      const centerX = screenCenterXValue.value;
      const centerY = screenCenterYValue.value;
      const expandedSize = expandedSizeValue.value;
      const halfSize = expandedSize / 2;

      imageState.value = "open";
      imageXCoord.value = centerX - halfSize;
      imageYCoord.value = centerY - halfSize;
      imageSize.value = expandedSize;
      blurIntensity.value = withTiming(100, _timingConfig);
      closeBtnOpacity.value = withDelay(_duration, withTiming(1));
      changeImageRowOpacity.value = withDelay(_duration, withTiming(1));
      isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
      return;
    }

    const centerX = screenCenterXValue.value;
    const centerY = screenCenterYValue.value;
    const expandedSize = expandedSizeValue.value;
    const halfSize = expandedSize / 2;

    // Set initial position to EXACT current position of profile image
    const startX = currentMeasurement.pageX;
    const startY = currentMeasurement.pageY;
    const startSize = defaultProfileImageSize;

    // Set initial values immediately (no animation) so image appears at exact position
    imageXCoord.value = startX;
    imageYCoord.value = startY;
    imageSize.value = startSize;

    // Immediate state change ensures proper rendering order
    imageState.value = "open";

    // Now animate from exact position to center
    blurIntensity.value = withTiming(100, _timingConfig);
    imageSize.value = withTiming(expandedSize, _timingConfig);
    imageXCoord.value = withTiming(centerX - halfSize, _timingConfig);
    imageYCoord.value = withTiming(centerY - halfSize, _timingConfig);
    // Delay close button appearance until main animation completes for sequential focus
    closeBtnOpacity.value = withDelay(_duration, withTiming(1));
    // Change image row fades in with close button
    changeImageRowOpacity.value = withDelay(_duration, withTiming(1));
    // Clear animating flag after animation completes
    isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
  };

  const close = () => {
    "worklet";

    // Mark that we're animating to prevent reaction from interfering
    isAnimating.value = 1;

    // Get the current EXACT position of the original profile image
    const currentMeasurement = measurement.value;
    if (currentMeasurement === null) {
      // Fallback if measurement not available
      blurIntensity.value = withTiming(0, _timingConfig);
      imageSize.value = withTiming(defaultProfileImageSize, _timingConfig);
      imageState.value = withDelay(
        _duration,
        withTiming("close", { duration: 0 }),
      );
      closeBtnOpacity.value = withTiming(0, { duration: _duration });
      changeImageRowOpacity.value = withTiming(0, { duration: 75 });
      isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
      return;
    }

    const targetX = currentMeasurement.pageX;
    const targetY = currentMeasurement.pageY;

    // Delay state change until animation completes to prevent flickering
    imageState.value = withDelay(
      _duration,
      withTiming("close", { duration: 0 }),
    );
    // Animate blur away first for visual hierarchy
    blurIntensity.value = withTiming(0, _timingConfig);
    // Return to original size simultaneously with position for cohesive motion
    imageSize.value = withTiming(defaultProfileImageSize, _timingConfig);
    // Return to EXACT original horizontal position
    imageXCoord.value = withTiming(targetX, _timingConfig);
    // Return to EXACT original vertical position
    imageYCoord.value = withTiming(targetY, _timingConfig);
    // Hide close button immediately as animation begins
    closeBtnOpacity.value = withTiming(0, { duration: _duration });
    // Change image row fades out faster for better UX (100ms vs 250ms)
    changeImageRowOpacity.value = withTiming(0, { duration: 75 });
    // Clear animating flag after animation completes
    isAnimating.value = withDelay(_duration, withTiming(0, { duration: 0 }));
  };

  return (
    <ProfileImageAnimationContext.Provider
      value={{
        defaultProfileImageSize,
        expandedProfileImageSize,
        targetRef,
        onTargetLayout,
        handleMeasurement,
        imageState,
        imageXCoord,
        imageYCoord,
        imageSize,
        blurIntensity,
        closeBtnOpacity,
        changeImageRowOpacity,
        open,
        close,
      }}
    >
      {children}
    </ProfileImageAnimationContext.Provider>
  );
};

export const useProfileImageAnimation = () => {
  const context = useContext(ProfileImageAnimationContext);

  if (!context) {
    throw new Error(
      "useProfileImageAnimation must be used within an ProfileImageAnimationProvider",
    );
  }

  return context;
};
