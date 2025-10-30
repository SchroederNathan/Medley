import { createContext, FC, PropsWithChildren, useContext } from "react";
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

  const { targetRef, onTargetLayout, measurement } = useTargetMeasurement();

  // Shared values coordinate animation state across components without re-renders
  const imageState = useSharedValue<"open" | "close">("close");
  const imageXCoord = useSharedValue(screenCenterX);
  const imageYCoord = useSharedValue(screenCenterY);
  const imageSize = useSharedValue(defaultProfileImageSize);
  const blurIntensity = useSharedValue(0);
  const closeBtnOpacity = useSharedValue(0);
  const changeImageRowOpacity = useSharedValue(0);

  // Track profile image position as user scrolls to ensure animation starts from current position
  useAnimatedReaction(
    () => measurement.value,
    (measurementValue) => {
      if (measurementValue === null) return;

      // Update coordinates to maintain visual connection
      imageXCoord.value = measurementValue.pageX;
      imageYCoord.value = measurementValue.pageY;
    },
  );

  const open = () => {
    "worklet";

    // Immediate state change ensures proper rendering order
    imageState.value = "open";
    // Blur intensity 100 matches iOS system blur intensity
    blurIntensity.value = withTiming(100, _timingConfig);
    // Animate size, x, and y coordinates simultaneously for cohesive motion
    imageSize.value = withTiming(expandedProfileImageSize, _timingConfig);
    // Center horizontally by offsetting by half the expanded size
    imageXCoord.value = withTiming(
      screenCenterX - expandedProfileImageSize / 2,
      _timingConfig,
    );
    // Center vertically using same calculation for visual balance
    imageYCoord.value = withTiming(
      screenCenterY - expandedProfileImageSize / 2,
      _timingConfig,
    );
    // Delay close button appearance until main animation completes for sequential focus
    closeBtnOpacity.value = withDelay(_duration, withTiming(1));
    // Change image row fades in with close button
    changeImageRowOpacity.value = withDelay(_duration, withTiming(1));
  };

  const close = () => {
    "worklet";

    // Get the current position of the original profile image
    const x = measurement.value?.pageX ?? 0;
    const y = measurement.value?.pageY ?? 0;

    // Delay state change until animation completes to prevent flickering
    imageState.value = withDelay(
      _duration,
      withTiming("close", { duration: 0 }),
    );
    // Animate blur away first for visual hierarchy
    blurIntensity.value = withTiming(0, _timingConfig);
    // Return to original size simultaneously with position for cohesive motion
    imageSize.value = withTiming(defaultProfileImageSize, _timingConfig);
    // Return to original horizontal position
    imageXCoord.value = withTiming(x, _timingConfig);
    // Return to original vertical position
    imageYCoord.value = withTiming(y, _timingConfig);
    // Hide close button immediately as animation begins
    closeBtnOpacity.value = withTiming(0, { duration: _duration });
    // Change image row fades out faster for better UX (100ms vs 250ms)
    changeImageRowOpacity.value = withTiming(0, { duration: 75 });
  };

  return (
    <ProfileImageAnimationContext.Provider
      value={{
        defaultProfileImageSize,
        expandedProfileImageSize,
        targetRef,
        onTargetLayout,
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
