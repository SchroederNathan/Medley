import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import React, { FC, useContext } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  _timingConfig,
  useProfileImageAnimation,
} from "../../contexts/profile-image-animation-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useUserProfile } from "../../hooks/use-user-profile";
import { fontFamily } from "../../lib/fonts";
import { AddImageIcon } from "./svg-icons";

// createAnimatedComponent wraps regular components to make their props directly animatable
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const AnimatedProfileImage: FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { data: profile } = useUserProfile();
  const { theme } = useContext(ThemeContext);
  const {
    expandedProfileImageSize,
    imageState,
    imageXCoord,
    imageYCoord,
    imageSize,
    blurIntensity,
    closeBtnOpacity,
    changeImageRowOpacity,
    open,
    close,
  } = useProfileImageAnimation();

  // Used for pinch/drag gesture feedback - starts at normal scale
  const imageScale = useSharedValue(1);
  // Track starting position for gesture movement calculations
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  // Dynamically control touch handling based on animation state
  const rImageContainerStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: imageState.value === "open" ? "auto" : "none",
    };
  });

  // Main animated style controlling position, size, and visibility of profile image
  const rImageStyle = useAnimatedStyle(() => {
    return {
      left: imageXCoord.value,
      top: imageYCoord.value,
      width: imageSize.value,
      height: imageSize.value,
      opacity: imageState.value === "open" ? 1 : 0,
      transform: [{ scale: imageScale.value }],
    };
  });

  // Animate only blur intensity prop instead of entire component for performance
  const backdropAnimatedProps = useAnimatedProps(() => {
    return {
      intensity: blurIntensity.value,
    };
  });

  // Close button fades in after main animation completes
  const rCloseBtnStyle = useAnimatedStyle(() => {
    return {
      opacity: closeBtnOpacity.value,
    };
  });

  // Change Image row positioned below the profile image
  // Uses separate opacity that fades out faster when closing
  const rChangeImageRowStyle = useAnimatedStyle(() => {
    const imageBottom = imageYCoord.value + imageSize.value;
    const rowTop = imageBottom + 32; // 32px spacing below image

    return {
      opacity: imageState.value === "open" ? changeImageRowOpacity.value : 0,
      top: rowTop,
      left: 0,
      right: 0,
      width: "100%",
    };
  });

  // Pan gesture handler for dismiss-by-drag interaction pattern
  const pan = Gesture.Pan()
    .onStart(() => {
      // Store initial position to calculate distance moved
      panStartX.value = imageXCoord.value;
      panStartY.value = imageYCoord.value;
      // Hide close button immediately for cleaner gesture UX
      closeBtnOpacity.value = withTiming(0, { duration: 200 });
      // Hide change image row faster when dragging starts
      changeImageRowOpacity.value = withTiming(0, { duration: 100 });
    })
    .onChange((event) => {
      // Safety check to prevent gesture handling during closing animation
      if (imageState.value === "close") return;

      // Divide movement by 2 for resistance effect - makes gesture feel more weighted
      imageXCoord.value += event.changeX / 2;
      imageYCoord.value += event.changeY / 2;

      // Calculate total distance moved using Pythagorean theorem
      const deltaX = imageXCoord.value - panStartX.value;
      const deltaY = imageYCoord.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Scale decreases as user drags further - provides visual dismissal feedback
      const scale = interpolate(distance, [0, screenWidth / 2], [1, 0.9], {
        extrapolateRight: "clamp",
      });

      // Blur fades out proportionally with distance
      const blur = interpolate(distance, [0, screenWidth / 2], [100, 0], {
        extrapolateRight: "clamp",
      });

      imageScale.value = scale;
      blurIntensity.value = blur;
    })
    .onFinalize(() => {
      // Calculate final distance to determine if dismiss threshold was reached
      const deltaX = imageXCoord.value - panStartX.value;
      const deltaY = imageYCoord.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Always reset scale with animation for clean transition
      imageScale.value = withTiming(1, _timingConfig);

      // Dismiss threshold is half of expanded image size
      if (distance > expandedProfileImageSize / 2) {
        close();
      } else {
        open(); // Re-center if threshold not met
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, rImageContainerStyle]}
        onPress={close}
      >
        <AnimatedBlurView
          tint="dark"
          style={StyleSheet.absoluteFill}
          animatedProps={backdropAnimatedProps}
        />
        {/* Close button positioned safely within safe area */}
        <Animated.View
          style={[styles.closeButton, rCloseBtnStyle, { top: insets.top + 16 }]}
        >
          <X size={22} color="white" />
        </Animated.View>
        {/* Center transform origin ensures scaling happens from center point */}
        <AnimatedPressable
          style={[
            rImageStyle,
            styles.imageContainer,
            { transformOrigin: "center" },
          ]}
        >
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.placeholder]}
            >
              {/* Placeholder content if needed */}
            </Animated.View>
          )}
        </AnimatedPressable>
        {/* Change Image row below the profile image */}
        <Animated.View style={[styles.changeImageRow, rChangeImageRowStyle]}>
          <Text style={[styles.changeImageText, { color: theme.text }]}>
            Change Image
          </Text>
          <AddImageIcon size={20} color={theme.text} />
        </Animated.View>
      </AnimatedPressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 4,
    borderRadius: 20,
  },
  imageContainer: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
  placeholder: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  changeImageRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  changeImageText: {
    fontFamily: fontFamily.plusJakarta.medium,
    fontSize: 20,
  },
});
