import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeAnimation } from "../../contexts/home-animation-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { Media } from "../../types/media";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface HomeBackdropProps {
  media: Media[];
  currentIndex: number;
}

const HomeBackdrop: React.FC<HomeBackdropProps> = ({ media, currentIndex }) => {
  const { offsetY } = useHomeAnimation();

  const { grossHeight } = useHeaderHeight();

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -Math.max(0, offsetY.value) }],
    };
  });

  if (media.length === 0) return null;

  return (
    <Animated.View style={[styles.container, rStyle]}>
      <MaskedView
        style={[
          styles.mask,
          {
            height: grossHeight + 20 + 400,
            // paddingTop: topPadding,
          },
        ]}
        maskElement={
          <LinearGradient
            locations={[0, 0.7, 1]}
            colors={["black", "black", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <AnimatedImage
          cachePolicy="memory-disk"
          key={`bg-${currentIndex}`}
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
          source={{ uri: media[currentIndex]?.backdrop_url }}
          style={styles.image}
          contentFit="cover"
        />
        {/* Preload adjacent images */}
        {currentIndex > 0 && (
          <Image
            cachePolicy="memory-disk"
            source={{ uri: media[currentIndex - 1]?.backdrop_url }}
            style={[styles.image, { opacity: 0 }]}
            contentFit="cover"
          />
        )}
        {currentIndex < media.length - 1 && (
          <Image
            cachePolicy="memory-disk"
            source={{ uri: media[currentIndex + 1]?.backdrop_url }}
            style={[styles.image, { opacity: 0 }]}
            contentFit="cover"
          />
        )}
        <Animated.View style={styles.blurOverlay} pointerEvents="none">
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={100}
            tint="dark"
          />
        </Animated.View>
      </MaskedView>
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
