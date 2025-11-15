import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
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
import { ThemeContext } from "../../../../contexts/theme-context";

const MatchScreen = () => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(252);
  const translateYSideImages = useSharedValue(300);
  const rotateLeftImage = useSharedValue(0);
  const rotateRightImage = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0);
    translateYSideImages.value = withDelay(100, withSpring(28));
    rotateLeftImage.value = withSpring(-20);
    rotateRightImage.value = withSpring(20);
  }, [translateY, translateYSideImages, rotateLeftImage, rotateRightImage]);

  const imageLeftContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        // delay the animation by 100ms
        { translateY: translateYSideImages.value },
        { rotate: `${rotateLeftImage.value}deg` },
      ],
    };
  });
  const imageRightContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateYSideImages.value },
        { rotate: `${rotateRightImage.value}deg` },
      ],
    };
  });
  const imageMiddleContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
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
      <View style={styles.contentContainer}>
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
        <Button
          title="redo animation"
          onPress={() => {
            translateY.value = withTiming(252);
            translateYSideImages.value = withTiming(300);
            rotateLeftImage.value = withTiming(0);
            rotateRightImage.value = withTiming(0);
            setTimeout(() => {
              translateY.value = withSpring(0);
              translateYSideImages.value = withDelay(20, withSpring(28));
              rotateLeftImage.value = withSpring(-20);
              rotateRightImage.value = withSpring(20);
            }, 500);
          }}
          variant="secondary"
          styles={StyleSheet.flatten([
            styles.button,
            { bottom: insets.bottom + 72, zIndex: 10 },
          ])}
        />
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
    boxShadow: "rgba(204, 219, 232, 0.3) 0 1px 4px -0.5px inset",
  },
  button: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
