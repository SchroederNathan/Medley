import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { X } from "lucide-react-native";
import { FC, useContext, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
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
import {
  useUploadProfileImage,
  useUserProfile,
} from "../../hooks/use-user-profile";
import { fontFamily } from "../../lib/fonts";
import { AddImageIcon } from "./svg-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const AnimatedProfileImage: FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { data: profile } = useUserProfile();
  const { theme } = useContext(ThemeContext);
  const uploadMutation = useUploadProfileImage();
  const [isPickingImage, setIsPickingImage] = useState(false);
  const {
    expandedProfileImageSize,
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
  } = useProfileImageAnimation();

  const handleClose = () => {
    // Ensure we have the latest measurement before closing
    handleMeasurement();
    // Small delay to ensure measurement completes
    requestAnimationFrame(() => {
      close();
    });
  };

  const imageScale = useSharedValue(1);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const rImageContainerStyle = useAnimatedStyle(() => ({
    pointerEvents: imageState.value === "open" ? "auto" : "none",
  }));

  const rImageStyle = useAnimatedStyle(() => ({
    left: imageXCoord.value,
    top: imageYCoord.value,
    width: imageSize.value,
    height: imageSize.value,
    opacity: imageState.value === "open" ? 1 : 0,
    transform: [{ scale: imageScale.value }],
  }));

  const backdropAnimatedProps = useAnimatedProps(() => ({
    intensity: blurIntensity.value,
  }));

  const rCloseBtnStyle = useAnimatedStyle(() => ({
    opacity: closeBtnOpacity.value,
  }));

  const rChangeImageRowStyle = useAnimatedStyle(() => {
    const imageBottom = imageYCoord.value + imageSize.value;
    const rowTop = imageBottom + 32;

    return {
      opacity: imageState.value === "open" ? changeImageRowOpacity.value : 0,
      top: rowTop,
      left: 0,
      right: 0,
      width: "100%",
    };
  });

  const pan = Gesture.Pan()
    .onStart(() => {
      panStartX.value = imageXCoord.value;
      panStartY.value = imageYCoord.value;
      closeBtnOpacity.value = withTiming(0, { duration: 200 });
      changeImageRowOpacity.value = withTiming(0, { duration: 100 });
    })
    .onChange((event) => {
      if (imageState.value === "close") return;

      imageXCoord.value += event.changeX / 2;
      imageYCoord.value += event.changeY / 2;

      const deltaX = imageXCoord.value - panStartX.value;
      const deltaY = imageYCoord.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const scale = interpolate(distance, [0, screenWidth / 2], [1, 0.9], {
        extrapolateRight: "clamp",
      });

      const blur = interpolate(distance, [0, screenWidth / 2], [100, 0], {
        extrapolateRight: "clamp",
      });

      imageScale.value = scale;
      blurIntensity.value = blur;
    })
    .onFinalize(() => {
      const deltaX = imageXCoord.value - panStartX.value;
      const deltaY = imageYCoord.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      imageScale.value = withTiming(1, _timingConfig);

      if (distance > expandedProfileImageSize / 2) {
        close();
      } else {
        open();
      }
    });

  const handleChangeImage = async () => {
    setIsPickingImage(true);

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to upload images!");
        setIsPickingImage(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsPickingImage(false);
        return;
      }

      await uploadMutation.mutateAsync(result.assets[0].uri);
      setIsPickingImage(false);
    } catch (error) {
      console.error("Error picking/uploading image:", error);
      alert("Failed to upload image. Please try again.");
      setIsPickingImage(false);
    }
  };

  return (
    <GestureDetector gesture={pan}>
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, rImageContainerStyle]}
        onPress={handleClose}
      >
        <AnimatedBlurView
          tint="dark"
          style={StyleSheet.absoluteFill}
          animatedProps={backdropAnimatedProps}
        />
        <Animated.View
          style={[styles.closeButton, rCloseBtnStyle, { top: insets.top + 16 }]}
        >
          <X size={22} color="white" />
        </Animated.View>
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
            />
          )}
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.changeImageRow, rChangeImageRowStyle]}
          onPress={(e) => {
            e.stopPropagation();
            handleChangeImage();
          }}
          disabled={isPickingImage || uploadMutation.isPending}
        >
          {isPickingImage || uploadMutation.isPending ? (
            <>
              <ActivityIndicator size="small" color={theme.text} />
              <Text style={[styles.changeImageText, { color: theme.text }]}>
                {uploadMutation.isPending ? "Uploading..." : "Picking..."}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.changeImageText, { color: theme.text }]}>
                Change Image
              </Text>
              <AddImageIcon size={20} color={theme.text} />
            </>
          )}
        </AnimatedPressable>
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
