import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { FC, Ref } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
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
  useZoomAnimation,
} from "../../contexts/zoom-animation-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export const MediaZoomOverlay: FC<{ imageUri?: string }> = ({ imageUri }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const {
    zoomState,
    x,
    y,
    width,
    height,
    blurIntensity,
    dimOpacity,
    close,
    snapToCenter,
    activeConfig,
  } = useZoomAnimation();

  const imageScale = useSharedValue(1);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const rImageContainerStyle = useAnimatedStyle(() => ({
    pointerEvents: zoomState.value === "open" ? "auto" : "none",
    zIndex: 1000,
  }));

  const rImageStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    width: width.value,
    height: height.value,
    opacity: zoomState.value === "open" ? 1 : 0,
    transform: [{ scale: imageScale.value }],
    position: "absolute",
  }));

  const backdropAnimatedProps = useAnimatedProps(() => ({
    intensity: blurIntensity.value,
  }));

  const rCloseBtnStyle = useAnimatedStyle(() => ({
    opacity: dimOpacity.value,
  }));

  const pan = Gesture.Pan()
    .onStart(() => {
      panStartX.value = x.value;
      panStartY.value = y.value;
      dimOpacity.value = withTiming(0, { duration: 200 });
    })
    .onChange((event) => {
      if (zoomState.value === "close") return;

      x.value += event.changeX / 2;
      y.value += event.changeY / 2;

      const deltaX = x.value - panStartX.value;
      const deltaY = y.value - panStartY.value;
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
      const deltaX = x.value - panStartX.value;
      const deltaY = y.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      imageScale.value = withTiming(1, _timingConfig);

      // Threshold to close: dragged more than 1/4 of target width
      // We need to access the target width from activeConfig or current width
      const threshold = (activeConfig.value?.targetWidth || width.value) / 4;

      if (distance > threshold) {
        close();
      } else {
        snapToCenter();
      }
    });

  if (!imageUri) return null;

  return (
    <GestureDetector gesture={pan}>
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, rImageContainerStyle]}
        onPress={() => close()}
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

        <AnimatedImage
          source={{ uri: imageUri }}
          contentFit="cover"
          style={[rImageStyle, styles.zoomedImage]}
        />
      </AnimatedPressable>
    </GestureDetector>
  );
};

export const ZoomablePoster: FC<{
  imageUri: string;
  style?: ViewStyle | ViewStyle[];
  width?: number;
  height?: number;
}> = ({ imageUri, style, width: sourceWidth, height: sourceHeight }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { targetRef, onTargetLayout, handleMeasurement, zoomState, open } =
    useZoomAnimation();

  const handleOpen = () => {
    handleMeasurement();
    requestAnimationFrame(() => {
      // Calculate target dimensions
      // Try to fill most of the screen width, maintaining aspect ratio
      const maxWidth = screenWidth * 0.9;
      const maxHeight = screenHeight * 0.8;

      let targetWidth = maxWidth;
      let targetHeight = targetWidth * 1.5; // Default 2:3 aspect ratio

      // If we know source aspect ratio, use it
      if (sourceWidth && sourceHeight) {
        const ratio = sourceWidth / sourceHeight;
        targetHeight = targetWidth / ratio;

        // If height is too big, constrain by height
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = targetHeight * ratio;
        }
      } else {
        // Default 2:3 constraint check
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = targetHeight * (2 / 3);
        }
      }

      open({
        targetWidth,
        targetHeight,
      });
    });
  };

  const rStyle = useAnimatedStyle(() => ({
    opacity: zoomState.value === "open" ? 0 : 1,
  }));

  return (
    <AnimatedPressable
      ref={targetRef as Ref<View>}
      onLayout={onTargetLayout}
      onPress={handleOpen}
      style={[style, rStyle]}
    >
      <Image
        source={{ uri: imageUri }}
        contentFit="cover"
        style={[StyleSheet.absoluteFill, styles.image]}
        cachePolicy="memory-disk"
        transition={200}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 4,
    borderRadius: 20,
    zIndex: 1001,
  },

  image: {
    borderRadius: 4,
  },
  zoomedImage: {
    borderRadius: 4,
    boxShadow: "rgba(204, 219, 232, 0.3) 0 1px 4px -0.5px inset",
  },
});
