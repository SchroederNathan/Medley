import { BlurView } from "expo-blur";
import { useContext } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useHomeAnimation } from "../../contexts/home-animation-context";
import { ThemeContext } from "../../contexts/theme-context";

// BlurView wrapped with createAnimatedComponent for UI thread animations
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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

  return (
    <AnimatedBlurView
      tint={theme.mode}
      style={[StyleSheet.absoluteFill, styles.container]}
      animatedProps={backdropAnimatedProps}
      experimentalBlurMethod="dimezisBlurView"
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
