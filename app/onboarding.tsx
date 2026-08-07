import { useAuth, useClerk, useSignIn } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import { useSignInWithGoogle } from "@clerk/expo/google";
import AppleIcon from "@hugeicons-pro/core-solid-standard/AppleIcon";
import GoogleIcon from "@hugeicons-pro/core-solid-standard/GoogleIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Ellipse,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import Button from "../components/ui/button";
import { ThemeContext } from "../contexts/theme-context";
import { useToast } from "../contexts/toast-context";
import { fontFamily } from "../lib/fonts";
import { ProfileService } from "../services/profileService";

// Clerk test account for the dev-only sign-in shortcut. The "+clerk_test"
// suffix puts Clerk in test mode for this address: no real email is sent and
// verification accepts the fixed code below. Development instances only.
const DEV_IDENTIFIER = "dev+clerk_test@example.com";
const DEV_TEST_CODE = "424242";

// User dismissed the native Apple/Google sheet — not an error.
const isCancellation = (error: unknown) => {
  const code = (error as { code?: string | number })?.code;
  const message = (error as { message?: string })?.message ?? "";
  return (
    code === "ERR_REQUEST_CANCELED" ||
    code === "SIGN_IN_CANCELLED" ||
    code === "-5" ||
    code === -5 ||
    /cancel/i.test(message)
  );
};

const GetStarted = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { showToast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Returning users with a finished profile go straight to the app;
  // everyone else continues through onboarding (/name → /media-preferences).
  const routeAfterSignIn = async (userId: string | undefined) => {
    let onboarded = false;
    if (userId) {
      try {
        const profile = await ProfileService.getProfile(userId);
        onboarded = profile?.media_preferences?.onboarding_completed === true;
      } catch (error) {
        console.warn("Failed to fetch profile after sign-in:", error);
      }
    }

    router.replace(onboarded ? "/(tabs)" : "/name");
  };

  const runFlow = async (
    startFlow: () => Promise<{
      createdSessionId: string | null;
      setActive?: (params: { session: string }) => Promise<void>;
    }>
  ) => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      // A signed-in user can land here mid-onboarding (killed the app before
      // finishing); skip the native flow and just resume routing.
      if (isSignedIn) {
        await routeAfterSignIn(clerk.user?.id);
        return;
      }

      const { createdSessionId, setActive } = await startFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        await routeAfterSignIn(clerk.user?.id ?? undefined);
      }
      // No createdSessionId → the user cancelled; do nothing.
    } catch (error) {
      if (!isCancellation(error)) {
        console.error("Sign-in error:", error);
        showToast({
          message: "Sign in failed. Please try again.",
        });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Dev-only shortcut past the native Apple/Google sheets, which need a signed
  // build and a real account. Uses a Clerk test user; the password lives in
  // EXPO_PUBLIC_DEV_PASSWORD (.env.local), so this is a no-op without it.
  const handleDevLogin = async () => {
    if (isAuthenticating) return;
    const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;
    if (!password) {
      console.warn("Dev login: set EXPO_PUBLIC_DEV_PASSWORD in .env.local");
      return;
    }

    setIsAuthenticating(true);
    try {
      const { error } = await signIn.password({
        identifier: DEV_IDENTIFIER,
        password,
      });
      if (error) {
        console.error("Dev login failed:", error);
        return;
      }

      // The dev account has an email-code second factor. A "+clerk_test"
      // address skips the real email and accepts Clerk's fixed test code.
      if (signIn.status === "needs_second_factor") {
        const { error: sendError } = await signIn.emailCode.sendCode();
        if (sendError) {
          console.error("Dev login second factor failed:", sendError);
          return;
        }
        const { error: verifyError } = await signIn.emailCode.verifyCode({
          code: DEV_TEST_CODE,
        });
        if (verifyError) {
          console.error("Dev login second factor failed:", verifyError);
          return;
        }
      }

      if (signIn.status !== "complete") {
        console.warn("Dev login incomplete:", signIn.status);
        return;
      }
      await signIn.finalize();
      await routeAfterSignIn(clerk.user?.id ?? undefined);
    } catch (error) {
      console.error("Dev login error:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const posters = [
    require("../assets/images/onboarding/tlou.jpg"),
    require("../assets/images/onboarding/batman.jpg"),
    require("../assets/images/onboarding/hobbit.jpg"),
    require("../assets/images/onboarding/creator.jpg"),
    require("../assets/images/onboarding/cyberpunk.jpg"),
    require("../assets/images/onboarding/frankenstein.jpg"),
    require("../assets/images/onboarding/tkamb.jpg"),
  ];

  const CARD_WIDTH = 133;
  const CARD_GAP = 20;
  const TRACK_WIDTH = posters.length * (CARD_WIDTH + CARD_GAP);

  const offset = useSharedValue(0);

  // Animation shared values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const spotlightOpacity = useSharedValue(0);
  const spotlightTranslateX = useSharedValue(-20);
  const spotlightTranslateY = useSharedValue(-20);
  const posterOpacity = useSharedValue(0);
  const posterTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const bottomGradientOpacity = useSharedValue(0);

  // Start entrance animations
  React.useEffect(() => {
    // Title animation - fade in up
    titleOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    titleTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    // Subtitle and spotlight animation - fade in together
    subtitleOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    spotlightOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    spotlightTranslateX.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    spotlightTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Poster carousel animation - fade in from bottom
    posterOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    posterTranslateY.value = withDelay(
      1000,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    );

    // Button and text animation - fade in last
    buttonOpacity.value = withDelay(
      1400,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Bottom gradient animation - fade in after button
    bottomGradientOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  // Start infinite horizontal scroll
  React.useEffect(() => {
    offset.value = withRepeat(
      withTiming(TRACK_WIDTH, { duration: 45000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const trackStyle = useAnimatedStyle(() => {
    // Wrap offset in JS to keep translate within [-TRACK_WIDTH, 0]
    const x = -(offset.value % TRACK_WIDTH);
    return { transform: [{ translateX: x }] };
  });

  // Animated styles for entrance animations
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const spotlightAnimatedStyle = useAnimatedStyle(() => ({
    opacity: spotlightOpacity.value,
    transform: [
      { translateX: spotlightTranslateX.value },
      { translateY: spotlightTranslateY.value },
    ],
  }));

  const posterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: posterOpacity.value,
    transform: [{ translateY: posterTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const bottomGradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bottomGradientOpacity.value,
  }));

  // Precompute stable "random" transforms per poster index
  const seeds = React.useMemo(
    () =>
      posters.map((_, i) => {
        const rng = Math.sin(i * 999) * 10000;
        const rand = (v: number) => (Math.sin(rng + v) + 1) / 2;
        const rotate = (rand(1) * 12 - 6).toFixed(2); // -6° to 6°
        const translateY = Math.round(rand(2) * 20 - 10); // -10 to 10
        return { rotate: `${rotate}deg`, translateY };
      }),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[styles.spotlightContainer, spotlightAnimatedStyle]}
      >
        <Svg
          width="150%"
          height="100%"
          viewBox="0 0 500 550"
          style={styles.spotlightSvg}
        >
          <Path
            d="M-43.5 -81.5L7.5 -138.5L420.12 380.955L280.62 480.954L-43.5 -81.5Z"
            fill="#D4D4D4"
            fillOpacity="0.1"
          />
        </Svg>
      </Animated.View>

      {/* Bottom Circular Gradient */}
      <Animated.View
        style={[styles.bottomGradientContainer, bottomGradientAnimatedStyle]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="-200 0 800 200"
          style={styles.bottomGradientSvg}
        >
          <Defs>
            <Filter
              id="bottomGradientBlur"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
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
                stdDeviation="40"
                result="effect1_foregroundBlur"
              />
            </Filter>
            <RadialGradient
              id="bottomRadialGradient"
              cx="50%"
              cy="100%"
              r="100%"
              fx="50%"
              fy="100%"
            >
              <Stop offset="0%" stopColor={theme.text} stopOpacity="1" />
              <Stop offset="50%" stopColor={theme.text} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={theme.text} stopOpacity="0.2" />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx="200"
            cy="450"
            rx="400"
            ry="200"
            fill="url(#bottomRadialGradient)"
            filter="url(#bottomGradientBlur)"
          />
        </Svg>
      </Animated.View>

      <Animated.Text
        style={[styles.title, { color: theme.text }, titleAnimatedStyle]}
      >
        MEDLEY
      </Animated.Text>
      <Animated.Text
        style={[styles.subtitle, { color: theme.text }, subtitleAnimatedStyle]}
      >
        Discover your next favorite thing
      </Animated.Text>
      <Animated.View style={[styles.posterContainer, posterAnimatedStyle]}>
        {/* Two tracks placed back-to-back; as one slides left, the other follows.
            When translateX exceeds one track width, modulo visually wraps. */}
        <Animated.View style={[styles.row, trackStyle]}>
          {posters.map((src, idx) => {
            const seed = seeds[idx % posters.length];
            return (
              <View
                key={`poster-${idx}`}
                style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
              >
                <Animated.View
                  style={{
                    transform: [
                      { rotate: seed.rotate },
                      { translateY: seed.translateY },
                    ],
                  }}
                >
                  <Image
                    source={src}
                    style={[styles.poster, { borderColor: theme.border }]}
                    contentFit="contain"
                  />
                </Animated.View>
              </View>
            );
          })}
          {posters.map((src, idx) => {
            const seed = seeds[idx % posters.length];
            return (
              <View
                key={`poster-dup-${idx}`}
                style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
              >
                <Animated.View
                  style={{
                    transform: [
                      { rotate: seed.rotate },
                      { translateY: seed.translateY },
                    ],
                  }}
                >
                  <Image
                    source={src}
                    style={[styles.poster, { borderColor: theme.border }]}
                    contentFit="contain"
                  />
                </Animated.View>
              </View>
            );
          })}
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.actionContainer, buttonAnimatedStyle]}>
        <View style={styles.buttonGroup}>
          {/* Apple's native flow is iOS-only; Android users sign in with Google. */}
          {Platform.OS === "ios" && (
            <Button
              title="Continue with Apple"
              variant="secondary"
              styles={styles.button}
              disabled={isAuthenticating}
              icon={
                <HugeiconsIcon
                  icon={AppleIcon}
                  size={20}
                  color={theme.secondaryButtonText}
                />
              }
              onPress={() => runFlow(startAppleAuthenticationFlow)}
            />
          )}
          <Button
            title="Continue with Google"
            styles={styles.button}
            disabled={isAuthenticating}
            icon={
              <HugeiconsIcon
                icon={GoogleIcon}
                size={20}
                color={theme.primaryButtonText}
              />
            }
            onPress={() => runFlow(startGoogleAuthenticationFlow)}
          />
          {__DEV__ && (
            <Button
              title="Dev login"
              styles={styles.button}
              disabled={isAuthenticating}
              onPress={handleDevLogin}
            />
          )}
        </View>
        <Text style={[styles.info, { color: theme.text }]}>
          By proceeding to use Medley, you agree to the terms of service and
          privacy policy.
        </Text>
      </Animated.View>
    </View>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  spotlightContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0, // Behind content
    overflow: "hidden",
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "100%",
    height: "100%",
    zIndex: 0, // Behind content
  },
  title: {
    fontSize: 96,
    fontFamily: fontFamily.tanker.regular,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  posterContainer: {
    width: "100%",
    height: 200,

    marginTop: 64, // Neutralize parent's horizontal padding so the track spans edge-to-edge
    marginHorizontal: -20,
  },
  row: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    left: 0,
    right: 0,
  },
  poster: {
    width: 133,
    height: 200,
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
  },
  info: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
    marginTop: 16,
  },
  actionContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "absolute",
    bottom: 52,
  },
  bottomGradientContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "120%",
    height: "60%",
    zIndex: 0, // Behind content
  },
  bottomGradientSvg: {
    position: "absolute",
    bottom: -50,
    opacity: 0.5,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0, // Behind content
  },
});
