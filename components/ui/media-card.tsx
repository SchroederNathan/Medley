import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DimensionValue,
  Share,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useOverlay } from "../../contexts/overlay-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useRadialOverlay } from "../../hooks/use-radial-overlay";
import { Media } from "../../types/media";
import GradientSweepOverlay from "./gradient-sweep-overlay";
import { BookmarkIcon, ShareIcon, StarIcon } from "./svg-icons";

// Gradient overlay moved to shared component

const MediaCard = ({
  media,
  width = 150,
  height = 200,
  style,
  isTouchable = true,
}: {
  media: Media;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
  isTouchable?: boolean;
}) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const pulse = useSharedValue(0.6);
  const scale = useSharedValue(1);
  const cardRef = useRef<View>(null);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const actions = useMemo(
    () => [
      { id: "star", icon: StarIcon, title: "Favorite" },
      { id: "bookmark", icon: BookmarkIcon, title: "Save" },
      { id: "share", icon: ShareIcon, title: "Share" },
    ],
    [],
  );

  const { longPressGesture, panGesture, isLongPressed } = useRadialOverlay({
    actions,
    onSelect: async (actionId) => {
      if (actionId === "share") {
        try {
          await Share.share({ message: media.title || "Share" });
        } catch {}
      } else if (actionId === "bookmark") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/save-media?id=${media.id}`);
      } else if (actionId === "star") {
        // no-op for now
      }
    },
    targetRef: cardRef as React.RefObject<View>,
    renderClone: ({ x, y, width: cardWidth, height: cardHeight }) => (
      <View
        style={{
          position: "absolute",
          top: y,
          left: x,
          width: cardWidth,
          height: cardHeight,
        }}
      >
        <View
          style={[
            styles.container,
            {
              width: cardWidth,
              height: cardHeight,
              backgroundColor: theme.buttonBackground,
            },
          ]}
        >
          {cardContent}
          <GradientSweepOverlay
            width={cardWidth}
            height={cardHeight}
            isAnimating
          />
        </View>
      </View>
    ),
  });

  const longPressWithScale = longPressGesture
    .onBegin(() => {
      "worklet";
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      "worklet";
      scale.value = withSpring(1);
    });

  // Pan gesture to track finger movement during and after long press
  // Only activates after long press duration, so it doesn't interfere with scrolling
  const pan = panGesture;

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      // Scale down on press
      "worklet";
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      // Scale back up
      "worklet";
      scale.value = withSpring(1);
      if (!isLongPressed.value) {
        runOnJS(router.push)(`/media-detail?id=${media.id}`);
      }
    })
    .onFinalize(() => {
      // Ensure scale is reset
      "worklet";
      scale.value = withSpring(1);
    });

  // Simultaneous allows pan to track alongside tap/long-press without blocking
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(longPressWithScale, tapGesture),
    pan,
  );

  useEffect(() => {
    if (!isLoading) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [isLoading, pulse]);
  const cardContent = (
    <>
      {isLoading && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.buttonBackground },
            skeletonStyle,
          ]}
        />
      )}
      <Image
        source={{ uri: media.poster_url }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoadEnd={() => {
          setIsLoading(false);
          pulse.value = 0;
        }}
        transition={300}
      />
    </>
  );

  if (isTouchable) {
    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          ref={cardRef}
          style={[
            styles.container,
            {
              height: height,
              width: width,
              backgroundColor: theme.buttonBackground,
            },
            scaleStyle,
            style,
          ]}
        >
          {cardContent}
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height: height,
          width: width,
          backgroundColor: theme.buttonBackground,
        },
        style,
      ]}
    >
      {cardContent}
    </View>
  );
};

export default MediaCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  touchableContent: {
    width: "100%",
    height: "100%",
  },
});
