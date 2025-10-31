import React, { FC, useContext } from "react";
import { StyleSheet, Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useProfileImageAnimation } from "../../contexts/profile-image-animation-context";
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
  const {
    targetRef,
    onTargetLayout,
    defaultProfileImageSize,
    imageState,
    open,
  } = useProfileImageAnimation();

  // This style controls visibility of the original image during animation
  const rImagePlaceholderStyle = useAnimatedStyle(() => {
    return {
      opacity: imageState.value === "open" ? 0 : 1,
    };
  });

  return (
    <Animated.View ref={targetRef} onLayout={onTargetLayout}>
      <AnimatedPressable
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
        onPress={open}
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
