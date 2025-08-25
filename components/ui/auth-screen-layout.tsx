import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useContext, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface AuthScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onAnimationComplete?: () => void;
  animateOnMount?: boolean;
}

const AuthScreenLayout = ({
  title,
  children,
  showBackButton = true,
  onAnimationComplete,
  animateOnMount = true,
}: AuthScreenLayoutProps) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  // Animation values
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(50);

  // Enter animation (fade in from right)
  const enterAnimation = () => {
    opacity.value = withTiming(1, { duration: 400 });
    translateX.value = withTiming(0, { duration: 400 }, (finished) => {
      if (finished && onAnimationComplete) {
        runOnJS(onAnimationComplete)();
      }
    });
  };

  // Exit animation (fade out to left)
  const exitAnimation = (callback?: () => void) => {
    opacity.value = withTiming(0, { duration: 300 });
    translateX.value = withTiming(-50, { duration: 300 }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  };

  // Trigger enter animation on mount
  useEffect(() => {
    if (animateOnMount) {
      enterAnimation();
    } else {
      opacity.value = 1;
      translateX.value = 0;
    }
  }, [animateOnMount]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  // Expose exit animation for parent components
  useEffect(() => {
    if (onAnimationComplete) {
      // Store reference to exit function for external use
      (global as any).exitAuthScreen = exitAnimation;
    }
  }, [onAnimationComplete]);

  return (
    <View style={styles.mainContainer}>
      <Svg
        width="150%"
        height="100%"
        viewBox="0 0 500 550"
        style={styles.spotlightSvg}
      >
        <Defs>
          <Filter
            id="filter0_f_2_34"
            x="-167.2"
            y="-262.2"
            width="700.02"
            height="850.854"
            filterUnits="userSpaceOnUse"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <FeGaussianBlur
              stdDeviation="61.85"
              result="effect1_foregroundBlur_2_34"
            />
          </Filter>
        </Defs>
        <Path
          d="M-43.5 -81.5L7.5 -138.5L420.12 380.955L280.62 480.954L-43.5 -81.5Z"
          fill="#D4D4D4"
          fillOpacity="0.1"
          filter="url(#filter0_f_2_34)"
        />
      </Svg>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? -150 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} strokeWidth={3} color={theme.text} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

// Hook for handling animated navigation
export const useAnimatedNavigation = () => {
  const triggerExitAnimation = (callback: () => void) => {
    const exitFunction = (global as any).exitAuthScreen;
    if (exitFunction) {
      exitFunction(callback);
    } else {
      // Fallback if animation function is not available
      callback();
    }
  };

  return { triggerExitAnimation };
};

export default AuthScreenLayout;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  animatedContainer: {
    flex: 1,
    position: "relative",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 80,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
  title: {
    fontSize: 32,
    paddingHorizontal: 12,
    marginBottom: 24,
    fontFamily: fontFamily.tanker.regular,
  },
  backButton: {
    position: "absolute",
    top: (Platform.OS === "ios" ? 52 : 40) + 52,
    left: 28,
    zIndex: 1000,
  },
});
