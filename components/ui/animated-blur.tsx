import { BlurView } from "expo-blur";
import { useContext } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useHomeAnimation } from "../../contexts/home-animation-context";
import { ThemeContext } from "../../contexts/theme-context";

// BlurView wrapped with createAnimatedComponent for UI thread animations
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// At the intensity this backdrop reaches, the iOS blur is almost opaque
// anyway, so the wash lands very close to it.
const ANDROID_WASH_OPACITY = 0.94;

export const AnimatedBlur = () => {
  const { blurIntensity } = useHomeAnimation();
  const { theme } = useContext(ThemeContext);

  // Use animatedProps to update intensity without re-rendering React tree
  const backdropAnimatedProps = useAnimatedProps(() => {
    return {
      intensity: blurIntensity.value,
    };
  });

  // In light mode the blur alone doesn't frost busy artwork enough for dark
  // text to stay readable, so fade in a white wash alongside the blur.
  const washAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: blurIntensity.value / 100,
    };
  });

  const androidWashStyle = useAnimatedStyle(() => {
    return {
      opacity: (blurIntensity.value / 100) * ANDROID_WASH_OPACITY,
    };
  });

  // expo-blur only blurs on Android when the content sits inside a
  // `BlurTargetView` whose ref is handed to the BlurView. That target would
  // have to wrap the backdrop and the scroll pane but not the search results,
  // and the results live inside the same subtree — so the blur is drawn as a
  // solid wash here instead, the way `top-gradient.tsx` already does it. It
  // keeps search results readable, which is the whole job of this layer.
  if (Platform.OS === "android") {
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          { backgroundColor: theme.background },
          androidWashStyle,
        ]}
      />
    );
  }

  return (
    <AnimatedBlurView
      tint={theme.mode}
      style={[StyleSheet.absoluteFill, styles.container]}
      animatedProps={backdropAnimatedProps}
    >
      {theme.mode === "light" && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.lightWash, washAnimatedStyle]}
        />
      )}
    </AnimatedBlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    // Blur is purely visual background; block interactions
    pointerEvents: "none",
    zIndex: 2, // Above main content, below search results and gradients
  },
  lightWash: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
});
