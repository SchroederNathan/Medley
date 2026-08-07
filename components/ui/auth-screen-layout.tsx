import ArrowLeft02Icon from "@hugeicons-pro/core-stroke-standard/ArrowLeft02Icon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
} from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { AuroraBackground } from "./aurora-background";

interface AuthScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
}

export type AuthScreenLayoutHandle = {
  animateOut: (onDone?: () => void) => void;
};

const AuthScreenLayout = forwardRef<
  AuthScreenLayoutHandle,
  AuthScreenLayoutProps
>(function AuthScreenLayout(
  { title, children, showBackButton = true }: AuthScreenLayoutProps,
  ref
) {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  // Simple enter/exit animation shared by all auth screens
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(24);

  useFocusEffect(
    useCallback(() => {
      const delayMs = 120;
      opacity.value = 0;
      translateX.value = 24;
      opacity.value = withDelay(
        delayMs,
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
      );
      translateX.value = withDelay(
        delayMs,
        withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) })
      );
    }, [opacity, translateX])
  );

  const animateOut = (onDone?: () => void) => {
    opacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });
    translateX.value = withTiming(
      -24,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      }
    );
  };

  useImperativeHandle(ref, () => ({ animateOut }), [opacity, translateX]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.mainContainer}>
      <AuroraBackground />
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {children}
        </Animated.View>
      </KeyboardAwareScrollView>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            size={24}
            strokeWidth={3}
            color={theme.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

export default AuthScreenLayout;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
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
