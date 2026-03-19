import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { useHomeAnimation } from "../../contexts/home-animation-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { Media } from "../../types/media";

interface HomeBackdropProps {
  media: Media[];
  currentIndex: number;
}

const HomeBackdrop: React.FC<HomeBackdropProps> = ({ media, currentIndex }) => {
  const { offsetY } = useHomeAnimation();
  const { grossHeight } = useHeaderHeight();
  const { theme } = useContext(ThemeContext);
  const [displayedIndex, setDisplayedIndex] = useState(currentIndex);
  const [previousIndex, setPreviousIndex] = useState(currentIndex);
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    if (currentIndex !== displayedIndex) {
      setPreviousIndex(displayedIndex);
      setDisplayedIndex(currentIndex);
      fadeAnim.value = 0;
      fadeAnim.value = withTiming(1, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(setPreviousIndex)(currentIndex);
        }
      });
    }
  }, [currentIndex]);

  // Prefetch adjacent images
  useEffect(() => {
    const urls = [
      media[currentIndex - 1]?.backdrop_url,
      media[currentIndex + 1]?.backdrop_url,
    ].filter(Boolean);
    urls.forEach((url) => Image.prefetch(url));
  }, [currentIndex, media]);

  const foregroundStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -Math.max(0, offsetY.value) }],
    };
  });

  if (media.length === 0) return null;

  const maskHeight = grossHeight + 20 + 400;

  return (
    <Animated.View style={[styles.container, rStyle]} pointerEvents="none">
      <MaskedView
        style={[styles.mask, { height: maskHeight }]}
        maskElement={
          <LinearGradient
            locations={[0, 0.7, 1]}
            colors={["black", "black", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        {/* Background layer: previous image (always visible) */}
        <Image
          cachePolicy="memory-disk"
          source={{ uri: media[previousIndex]?.backdrop_url }}
          style={styles.image}
          contentFit="cover"
        />
        {/* Foreground layer: current image (fades in) */}
        <Animated.View style={[StyleSheet.absoluteFill, foregroundStyle]}>
          <Image
            cachePolicy="memory-disk"
            source={{ uri: media[displayedIndex]?.backdrop_url }}
            style={styles.image}
            contentFit="cover"
          />
        </Animated.View>
      </MaskedView>
      {/* BlurView OUTSIDE MaskedView — always applies */}
      <View
        style={[styles.blurOverlay, { height: maskHeight }]}
        pointerEvents="none"
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={100}
          tint="dark"
        />
      </View>
      {/* Bottom gradient fade to background */}
      <LinearGradient
        locations={[0, 0.7, 1]}
        colors={["transparent", "transparent", theme.background]}
        style={[styles.blurOverlay, { height: maskHeight }]}
        pointerEvents="none"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  mask: {
    width: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  blurOverlay: {
    position: "absolute",
    zIndex: 10,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default HomeBackdrop;
