import React, { FC, useContext } from "react";
import { StyleSheet, Pressable, Text, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useZoomAnimation } from "../../contexts/zoom-animation-context";
import { Image } from "expo-image";
import { useUserProfile } from "../../hooks/use-user-profile";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DefaultProfileImage: FC = () => {
  const { theme } = useContext(ThemeContext);
  const { data: profile } = useUserProfile();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const defaultProfileImageSize = 100;

  const {
    targetRef,
    onTargetLayout,
    handleMeasurement,
    zoomState: imageState,
    open,
  } = useZoomAnimation();

  const handleOpen = () => {
    // Ensure we have the latest measurement before opening
    handleMeasurement();
    // Small delay to ensure measurement completes
    requestAnimationFrame(() => {
      open({
        targetWidth: screenWidth * 0.65,
        aspectRatio: 1,
      });
    });
  };

  // This style controls visibility of the original image during animation
  const rImagePlaceholderStyle = useAnimatedStyle(() => {
    return {
      opacity: imageState.value === "open" ? 0 : 1,
    };
  });

  return (
    <Animated.View>
      <AnimatedPressable
        ref={targetRef}
        onLayout={onTargetLayout}
        style={[
          styles.container,
          rImagePlaceholderStyle,
          {
            marginTop: insets.top,
            width: defaultProfileImageSize,
            height: defaultProfileImageSize,
            backgroundColor: theme.buttonBackground,
            borderColor: theme.buttonBorder,
          },
        ]}
        onPress={handleOpen}
      >
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Text style={[styles.placeholderText, { color: theme.text }]}>
            {profile?.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    textTransform: "uppercase",
    fontFamily: fontFamily.plusJakarta.medium,
    fontSize: 40,
  },
});
