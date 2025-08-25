import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useContext, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface AuthScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
}

export type AuthScreenLayoutHandle = {
  animateOut: (onDone?: () => void) => void;
};

const AuthScreenLayout = forwardRef<AuthScreenLayoutHandle, AuthScreenLayoutProps>(function AuthScreenLayout(
  { title, children, showBackButton = true }: AuthScreenLayoutProps,
  ref,
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
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
      );
      translateX.value = withDelay(
        delayMs,
        withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }),
      );
    }, [opacity, translateX]),
  );

  const animateOut = (onDone?: () => void) => {
    opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
    translateX.value = withTiming(-24, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished && onDone) {
        runOnJS(onDone)();
      }
    });
  };

  useImperativeHandle(ref, () => ({ animateOut }), [opacity, translateX]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

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
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {children}
          </Animated.View>
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
    </View>
  );
});

export default AuthScreenLayout;

const styles = StyleSheet.create({
  mainContainer: {
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
