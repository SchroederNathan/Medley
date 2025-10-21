import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
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
import { Media } from "../../types/media";
import * as Haptics from "expo-haptics";
import { RadialMenu } from "./radial-menu";

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
  // Track finger for menu hover detection
  const cursorX = useSharedValue(0);
  const cursorY = useSharedValue(0);
  const releaseSignal = useSharedValue(0);
  const overlayOpen = useSharedValue(0);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleShowOverlay = (pressX: number, pressY: number) => {
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
      const content = (
        <View style={[StyleSheet.absoluteFill, { zIndex: 10000 }]}>
          {cardClone}
          <RadialMenu
            pressX={pressX}
            pressY={pressY}
            cursorX={cursorX}
            cursorY={cursorY}
            releaseSignal={releaseSignal}
            onSelect={async (action) => {
              if (action === "share") {
                try {
                  await Share.share({ message: media.title || "Share" });
                } catch {}
              } else if (action === "save") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/save-media");
              }
              overlayOpen.value = 0;
              hideOverlay();
            }}
            onCancel={() => {
              overlayOpen.value = 0;
              hideOverlay();
            }}
          />
        </View>
      );
      showOverlay(content);
      overlayOpen.value = 1;
    });
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(25)
    .onBegin(() => {
      // Scale down on press
      scale.value = withSpring(0.95);
    })
    .onStart((event) => {
      runOnJS(Haptics.selectionAsync)();
      isLongPressed.value = true;
      const ax = (event as any).absoluteX ?? (event as any).x ?? 0;
      const ay = (event as any).absoluteY ?? (event as any).y ?? 0;
      cursorX.value = ax;
      cursorY.value = ay;
      runOnJS(handleShowOverlay)(ax, ay);
    })
    .onFinalize(() => {
      isLongPressed.value = false;
      // Scale back up
      scale.value = withSpring(1);
    });

  // Pan on the card to ensure we track the same finger as long-press
  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .minDistance(0)
    .onTouchesDown((e, stateManager) => {
      if (overlayOpen.value === 1) {
        stateManager.activate();
        cursorX.value = e.allTouches[0].absoluteX;
        cursorY.value = e.allTouches[0].absoluteY;
      }
    })
    .onTouchesMove((e, stateManager) => {
      if (overlayOpen.value === 1) {
        stateManager.activate();
      }
    })
    .onChange((e) => {
      if (overlayOpen.value === 1) {
        cursorX.value = e.absoluteX;
        cursorY.value = e.absoluteY;
      }
    })
    .onEnd(() => {
      if (overlayOpen.value === 1) {
        releaseSignal.value = releaseSignal.value + 1;
      }
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

  const composedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(longPressGesture, tapGesture),
    panGesture,
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
