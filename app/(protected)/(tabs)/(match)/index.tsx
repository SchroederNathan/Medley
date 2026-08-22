import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../../components/ui/button";
import SegmentedPicker from "../../../../components/ui/segmented-picker";
import { ThemedText } from "../../../../components/ui/themed-text";
import { motion, radius, shadows, spacing } from "../../../../constants/theme";
import { ThemeContext } from "../../../../contexts/theme-context";

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
      translateYSideImages.value = withDelay(motion.fast, withSpring(28));
      rotateLeftImage.value = withDelay(motion.fast, withSpring(-10));
      rotateRightImage.value = withDelay(motion.fast, withSpring(10));
      titleOpacity.value = withDelay(500, withSpring(1));
      titleTranslateYTitle.value = withDelay(500, withSpring(0));
      subtitleOpacity.value = withDelay(550, withSpring(1));
      subtitleTranslateYSubtitle.value = withDelay(550, withSpring(0));
      buttonOpacity.value = withDelay(motion.slow, withSpring(1));
      buttonTranslateY.value = withDelay(motion.slow, withSpring(0));
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
    <View style={styles.container}>
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
            <ThemedText variant="displaySm" style={styles.text}>
              Find your next obsession
            </ThemedText>
          </Animated.View>
          <Animated.View style={subtitleAnimatedStyle}>
            <ThemedText color="secondary" style={styles.subtitle}>
              Swipe through to mark what hits and what doesn&apos;t. We&apos;ll
              handle the digging.
            </ThemedText>
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
          colors={
            theme.mode === "dark"
              ? ["rgba(10, 10, 10, 0)", "rgba(10, 10, 10, 1)"]
              : ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"]
          }
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
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
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
    marginHorizontal: -spacing.xxxl,
    boxShadow: "rgba(0,0,0,0.5) 0px 0px 20px 12px",
  },
  imageLeftContainer: { zIndex: 4, width: 112.5, height: 150 },
  imageRightContainer: { zIndex: 4, width: 112.5, height: 150 },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: radius.xs,
    boxShadow: shadows.insetHighlight,
  },
  textContainer: {
    gap: spacing.xs,
    alignItems: "center",
    marginTop: spacing.xxxl,
    maxWidth: 400,
    paddingHorizontal: spacing.xl,
  },
  text: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  button: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
