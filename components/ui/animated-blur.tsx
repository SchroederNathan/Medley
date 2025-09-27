import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { useHomeAnimation } from "../../contexts/home-animation-context";

// BlurView wrapped with createAnimatedComponent for UI thread animations
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const AnimatedBlur = () => {
  const { blurIntensity } = useHomeAnimation();

  // Use animatedProps to update intensity without re-rendering React tree
  const backdropAnimatedProps = useAnimatedProps(() => {
    return {
      intensity: blurIntensity.value,
    };
  });

  return (
    <AnimatedBlurView
      tint="dark"
      style={[StyleSheet.absoluteFill, styles.container]}
      animatedProps={backdropAnimatedProps}
      experimentalBlurMethod="dimezisBlurView"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    // Blur is purely visual background; block interactions
    pointerEvents: "none",
    zIndex: 2, // Above main content, below search results and gradients
  },
});
