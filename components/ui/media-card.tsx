import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { DimensionValue, StyleSheet, View, ViewStyle } from "react-native";
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
import { Media } from "../../types/media";
import * as Haptics from "expo-haptics";

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
  const { showOverlay, hideOverlay } = useOverlay();
  const [isLoading, setIsLoading] = useState(true);
  const pulse = useSharedValue(0.6);
  const scale = useSharedValue(1);
  const cardRef = useRef<View>(null);
  const isLongPressed = useSharedValue(false);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleShowOverlay = () => {
    cardRef.current?.measureInWindow((x, y, cardWidth, cardHeight) => {
      const cardClone = (
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
          </View>
        </View>
      );
      showOverlay(cardClone);
    });
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onBegin(() => {
      // Scale down on press
      scale.value = withSpring(0.95);
    })
    .onStart(() => {
      runOnJS(Haptics.selectionAsync)();
      isLongPressed.value = true;
      runOnJS(handleShowOverlay)();
    })
    .onEnd(() => {
      // When user releases the long press, hide the overlay
      runOnJS(hideOverlay)();
      // Scale back up
      scale.value = withSpring(1);
    })
    .onFinalize(() => {
      isLongPressed.value = false;
      // Ensure scale is reset
      scale.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      // Scale down on press
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      // Scale back up
      scale.value = withSpring(1);
      if (!isLongPressed.value) {
        runOnJS(router.push)(`/media-detail?id=${media.id}`);
      }
    })
    .onFinalize(() => {
      // Ensure scale is reset
      scale.value = withSpring(1);
    });

  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

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
