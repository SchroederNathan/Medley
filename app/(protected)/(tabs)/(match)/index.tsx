import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import Button from "../../../../components/ui/button";
import SegmentedPicker from "../../../../components/ui/segmented-picker";
import { ThemeContext } from "../../../../contexts/theme-context";
import { fontFamily } from "../../../../lib/fonts";

const MatchScreen = () => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = React.useState("Movies");
  const imageOpacity = useSharedValue(0);
  const translateY = useSharedValue(252);
  const translateYSideImages = useSharedValue(300);
  const rotateLeftImage = useSharedValue(0);
  const rotateRightImage = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateYTitle = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateYSubtitle = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    setTimeout(() => {
      imageOpacity.value = withSpring(1);
      translateY.value = withSpring(0);
      translateYSideImages.value = withDelay(100, withSpring(28));
      rotateLeftImage.value = withDelay(100, withSpring(-10));
      rotateRightImage.value = withDelay(100, withSpring(10));
      titleOpacity.value = withDelay(500, withSpring(1));
      titleTranslateYTitle.value = withDelay(500, withSpring(0));
      subtitleOpacity.value = withDelay(550, withSpring(1));
      subtitleTranslateYSubtitle.value = withDelay(550, withSpring(0));
      buttonOpacity.value = withDelay(600, withSpring(1));
      buttonTranslateY.value = withDelay(600, withSpring(0));
    }, 100);
  }, [
    translateY,
    imageOpacity,
    translateYSideImages,
    rotateLeftImage,
    rotateRightImage,
    titleOpacity,
    titleTranslateYTitle,
    subtitleOpacity,
    subtitleTranslateYSubtitle,
    buttonOpacity,
    buttonTranslateY,
  ]);

  const imageLeftContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [
        // delay the animation by 100ms
        { translateY: translateYSideImages.value },
        { rotate: `${rotateLeftImage.value}deg` },
      ],
    };
  });
  const imageRightContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [
        { translateY: translateYSideImages.value },
        { rotate: `${rotateRightImage.value}deg` },
      ],
    };
  });
  const imageMiddleContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateYTitle.value }],
    };
  });
  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateYSubtitle.value }],
    };
  });
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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

      {/*  */}
      <View
        style={[styles.contentContainer, { paddingBottom: insets.bottom + 72 }]}
      >
        <SegmentedPicker
          items={["All", "Movies", "Shows", "Games", "Books"]}
          value={selectedCategory}
          style={StyleSheet.flatten([
            styles.segmentedPickerContainer,
            { marginTop: insets.top + 32 },
          ])}
          onChange={(value) => {
            setSelectedCategory(value);
          }}
        />
        <View style={[styles.imageContainer]}>
          <Animated.View
            style={[imageLeftContainerStyle, styles.imageLeftContainer]}
          >
            <Image
              source={require("../../../../assets/images/onboarding/cyberpunk.jpg")}
              style={styles.image}
            />
          </Animated.View>
          <Animated.View
            style={[imageMiddleContainerStyle, styles.imageMiddleContainer]}
          >
            <Image
              source={require("../../../../assets/images/onboarding/batman.jpg")}
              style={styles.image}
            />
          </Animated.View>
          <Animated.View
            style={[imageRightContainerStyle, styles.imageRightContainer]}
          >
            <Image
              source={require("../../../../assets/images/onboarding/hobbit.jpg")}
              style={styles.image}
            />
          </Animated.View>
        </View>
        <View style={styles.textContainer}>
          <Animated.View style={titleAnimatedStyle}>
            <Text style={[styles.text, { color: theme.text }]}>
              Find your next obsession
            </Text>
          </Animated.View>
          <Animated.View style={subtitleAnimatedStyle}>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Swipe through to mark what hits and what doesn&apos;t. We&apos;ll
              handle the digging.
            </Text>
          </Animated.View>
        </View>
        <LinearGradient
          style={{
            position: "absolute",
            bottom: insets.bottom + 72 + 52,
            left: 0,
            right: 0,
            height: 100,
            zIndex: 10,
          }}
          colors={["rgba(10, 10, 10, 0)", "rgba(10, 10, 10, 1)"]}
          locations={[0, 1]}
        />
        <Animated.View
          style={[
            buttonAnimatedStyle,
            styles.button,
            { bottom: insets.bottom + 72, zIndex: 10 },
          ]}
        >
          <Button
            title="Start swiping"
            onPress={() => {}}
            variant="secondary"
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default MatchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
  segmentedPickerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    width: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imageContainer: {
    flexDirection: "row",
  },
  imageMiddleContainer: {
    width: 150,
    height: 200,
    zIndex: 5,
    marginHorizontal: -32,
    boxShadow: "rgba(0,0,0,0.5) 0px 0px 20px 12px",
  },
  imageLeftContainer: { zIndex: 4, width: 112.5, height: 150 },
  imageRightContainer: { zIndex: 4, width: 112.5, height: 150 },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    boxShadow: "rgba(204, 219, 232, 0.3) 0 1px 4px 0.5px inset",
  },
  textContainer: {
    gap: 4,
    alignItems: "center",
    marginTop: 32,
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 32,
    fontFamily: fontFamily.tanker.regular,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
  },
  button: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
