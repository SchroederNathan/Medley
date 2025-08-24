import { Image } from "expo-image";
import React, { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import AuthModal from "../components/ui/modals/auth-modal";
import { ThemeContext } from "../contexts/theme-context";
import { fontFamily } from "../lib/fonts";

const GetStarted = () => {
  const { theme } = useContext(ThemeContext);

  const posters = [
    require("../assets/images/onboarding/tlou.jpg"),
    require("../assets/images/onboarding/batman.jpg"),
    require("../assets/images/onboarding/hobbit.jpg"),
    require("../assets/images/onboarding/creator.jpg"),
    require("../assets/images/onboarding/cyberpunk.jpg"),
    require("../assets/images/onboarding/frankenstein.jpg"),
    require("../assets/images/onboarding/tkamb.jpg"),
  ];

  const [showModal, setShowModal] = useState(false);

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
        <Button
          title="Get Started"
          styles={styles.button}
          onPress={() => setShowModal(true)}
        />
        <Text style={[styles.info, { color: theme.text }]}>
          By proceeding to use Medley, you agree to the terms of service and
          privacy policy.
        </Text>
      </Animated.View>
      <AuthModal visible={showModal} onClose={() => setShowModal(false)} />
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
    paddingBottom: 120
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
