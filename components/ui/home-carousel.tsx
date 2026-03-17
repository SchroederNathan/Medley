import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Platform, Share, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useRadialOverlay } from "../../hooks/use-radial-overlay";
import { Media } from "../../types/media";
import GradientSweepOverlay from "./gradient-sweep-overlay";
import { BookmarkIcon, ShareIcon, StarIcon } from "./svg-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH * 0.55;
const ITEM_HEIGHT = Math.round(ITEM_WIDTH * 1.5);
const ITEM_SPACING = 12;
const LEFT_MARGIN = 20;
const VISIBLE_STACK_COUNT = 6;
const STACK_OFFSET =
  (SCREEN_WIDTH - LEFT_MARGIN - ITEM_WIDTH) / (VISIBLE_STACK_COUNT - 1);
const DOT_SIZE = 6;
const DOT_GAP = 4;
const DOT_CONTAINER_WIDTH = DOT_SIZE + DOT_GAP;

interface HomeCarouselProps {
  media: Media[];
  onIndexChange?: (index: number) => void;
}

interface GalleryCardProps {
  item: Media;
  index: number;
  activeIndex: SharedValue<number>;
  totalItems: number;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
  item,
  index,
  activeIndex,
  totalItems,
}) => {
  const router = useRouter();
  const pressScale = useSharedValue(1);
  const cardRef = useRef<View>(null);

  const actions = useMemo(
    () => [
      { id: "star", icon: StarIcon, title: "Favorite" },
      { id: "bookmark", icon: BookmarkIcon, title: "Save" },
      { id: "share", icon: ShareIcon, title: "Share" },
    ],
    []
  );

  const { longPressGesture, panGesture, isLongPressed, overlayOpen } =
    useRadialOverlay({
      actions,
      onSelect: async (actionId) => {
        if (actionId === "share") {
          try {
            await Share.share({ message: item.title || "Share" });
          } catch {}
        } else if (actionId === "bookmark") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/save-media?id=${item.id}`);
        }
        runOnUI(() => {
          "worklet";
          pressScale.value = withSpring(1);
        })();
      },
      onCancel: () => {
        runOnUI(() => {
          "worklet";
          pressScale.value = withSpring(1);
        })();
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
            style={[styles.cardInner, { width: cardWidth, height: cardHeight }]}
          >
            <Image
              cachePolicy="memory-disk"
              source={{ uri: item.poster_url }}
              style={styles.image}
              contentFit="cover"
            />
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
      pressScale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      "worklet";
      if (overlayOpen.value === 0) {
        pressScale.value = withSpring(1);
      }
    });

  const pan = panGesture.onFinalize(() => {
    "worklet";
    if (overlayOpen.value === 0) {
      pressScale.value = withSpring(1);
    }
  });

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      "worklet";
      pressScale.value = withSpring(0.95);
    })
    .onEnd(() => {
      "worklet";
      pressScale.value = withSpring(1);
      if (!isLongPressed.value) {
        runOnJS(router.push)(`/media-detail?id=${item.id}`);
      }
    })
    .onFinalize(() => {
      "worklet";
      pressScale.value = withSpring(1);
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(longPressWithScale, tapGesture),
    pan
  );

  const animatedStyle = useAnimatedStyle(() => {
    const active = activeIndex.value;
    const diff = index - active;

    // Gallery influence: strongest when activeIndex near 0
    const galleryFactor = interpolate(
      active,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    );

    // Centered carousel position
    const centeredX =
      SCREEN_WIDTH / 2 - ITEM_WIDTH / 2 + diff * (ITEM_WIDTH + ITEM_SPACING);
    const centeredScale = interpolate(
      Math.abs(diff),
      [0, 1],
      [1, 0.85],
      Extrapolation.CLAMP
    );

    // Gallery stack position — continuous scale decay per card
    const stackX = LEFT_MARGIN + index * STACK_OFFSET;
    const stackScale = Math.max(0.6, 1 - index * 0.06);

    // Blend between the two layouts
    const translateX = galleryFactor * stackX + (1 - galleryFactor) * centeredX;
    const scale =
      (galleryFactor * stackScale + (1 - galleryFactor) * centeredScale) *
      pressScale.value;

    // Static z-index: card 0 always on top, descending order
    const zIndex = totalItems - index;

    // Fade cards based on distance from focused index
    const absDiff = Math.abs(diff);
    const carouselOpacity = interpolate(
      absDiff,
      [0, 1, 2, 3],
      [1, 0.6, 0.3, 0],
      Extrapolation.CLAMP
    );
    // In stack mode (index 0), show all cards at full opacity
    const finalOpacity = interpolate(
      galleryFactor,
      [0, 1],
      [carouselOpacity, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
      zIndex,
      opacity: finalOpacity,
    };
  });

  return (
    <Animated.View style={[styles.cardPositioner, animatedStyle]}>
      <GestureDetector gesture={composedGesture}>
        <View ref={cardRef} style={styles.cardInner}>
          <Image
            cachePolicy="memory-disk"
            source={{ uri: item.poster_url }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
      </GestureDetector>
    </Animated.View>
  );
};

interface CarouselDotProps {
  index: number;
  activeIndex: SharedValue<number>;
  isActive: boolean;
  totalImages: number;
  defaultDotColor?: string;
  activeDotColor?: string;
}

// const CarouselDot: React.FC<CarouselDotProps> = ({
//   index,
//   activeIndex,
//   isActive,
//   totalImages,
//   defaultDotColor = "#525252",
//   activeDotColor = "#3b82f6",
// }) => {
//   const rDotStyle = useAnimatedStyle(() => {
//     if (totalImages < 6) {
//       return {
//         opacity: 1,
//         transform: [{ scale: 1 }],
//       };
//     }

//     // For many dots, scale based on distance from active
//     const dist = Math.abs(index - activeIndex.value);
//     const scale = interpolate(
//       dist,
//       [0, 1, 2, 3],
//       [1, 1, 0.7, 0.3],
//       Extrapolation.CLAMP
//     );

//     return {
//       opacity: 1,
//       transform: [{ scale }],
//     };
//   });

//   return (
//     <View style={styles.dotContainer}>
//       <Animated.View
//         style={[
//           styles.dot,
//           rDotStyle,
//           { backgroundColor: isActive ? activeDotColor : defaultDotColor },
//         ]}
//       />
//     </View>
//   );
// };

const HomeCarousel: React.FC<HomeCarouselProps> = ({
  media,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeIndex = useSharedValue(0);
  const startIndex = useSharedValue(0);

  // Notify parent of index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const updateIndex = (index: number) => {
    setCurrentIndex(index);
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      startIndex.value = activeIndex.value;
    })
    .onUpdate((e) => {
      const newIndex =
        startIndex.value - e.translationX / (ITEM_WIDTH + ITEM_SPACING);
      activeIndex.value = Math.max(0, Math.min(media.length - 1, newIndex));
    })
    .onEnd((e) => {
      const projected = activeIndex.value - e.velocityX / 1000;
      const target = Math.max(
        0,
        Math.min(media.length - 1, Math.round(projected))
      );
      activeIndex.value = withSpring(target);
      runOnJS(updateIndex)(target);
    });

  if (media.length === 0) return null;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.carouselArea}>
          {media.map((item, index) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={index}
              activeIndex={activeIndex}
              totalItems={media.length}
            />
          ))}
        </View>
      </GestureDetector>
      {/* {media.length > 1 && (
        <View style={styles.paginationContainer}>
          <View
            style={[
              styles.dotsContainer,
              {
                width: DOT_CONTAINER_WIDTH * Math.min(media.length, 7),
              },
            ]}
          >
            {media.map((_, index) => (
              <CarouselDot
                key={index}
                index={index}
                activeIndex={activeIndex}
                defaultDotColor={theme.secondaryText}
                activeDotColor={theme.text}
                isActive={index === currentIndex}
                totalImages={media.length}
              />
            ))}
          </View>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: -20,
  },
  carouselArea: {
    height: ITEM_HEIGHT,
    width: SCREEN_WIDTH,
  },
  cardPositioner: {
    position: "absolute",
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
  },
  cardInner: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: "rgba(204, 219, 232, 0.3) 0 1px 4px -0.5px inset",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  image: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
  },
  paginationContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 20,
  },
  dotContainer: {
    width: DOT_CONTAINER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});

export default HomeCarousel;
