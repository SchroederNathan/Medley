import AllBookmarkIcon from "@hugeicons-pro/core-stroke-standard/AllBookmarkIcon";
import Share08Icon from "@hugeicons-pro/core-stroke-standard/Share08Icon";
import StarIcon from "@hugeicons-pro/core-stroke-standard/StarIcon";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Share, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { shadows, spacing } from "../../constants/theme";
import { useRadialOverlay } from "../../hooks/use-radial-overlay";
import { Media } from "../../types/media";
import GradientSweepOverlay from "./gradient-sweep-overlay";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH * 0.55;
const ITEM_HEIGHT = Math.round(ITEM_WIDTH * 1.5);
const ITEM_SPACING = 12;
const LEFT_MARGIN = 20;
const VISIBLE_STACK_COUNT = 6;
const STACK_OFFSET =
  (SCREEN_WIDTH - LEFT_MARGIN - ITEM_WIDTH) / (VISIBLE_STACK_COUNT - 1);

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

const GalleryCard = function GalleryCard({
  item,
  index,
  activeIndex,
  totalItems,
}: GalleryCardProps) {
  const router = useRouter();
  const pressScale = useSharedValue(1);
  const cardRef = useRef<View>(null);

  const actions = useMemo(
    () => [
      { id: "star", icon: StarIcon, title: "Favorite" },
      { id: "bookmark", icon: AllBookmarkIcon, title: "Save" },
      { id: "share", icon: Share08Icon, title: "Share" },
    ],
    []
  );

  const navigateToMediaDetail = useCallback(() => {
    router.push(`/media-detail?id=${item.id}`);
  }, [router, item.id]);

  const resetPressScale = useCallback(() => {
    pressScale.set(withSpring(1));
  }, [pressScale]);

  const { longPressGesture, panGesture, isLongPressed, overlayOpen } =
    useRadialOverlay({
      actions,
      onSelect: async (actionId) => {
        if (actionId === "share") {
          const shareMessage = item.title || "Share";
          try {
            await Share.share({ message: shareMessage });
          } catch {
            // Share sheet dismissed or unavailable — ignore
          }
        } else if (actionId === "bookmark") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/save-media?id=${item.id}`);
        }
        scheduleOnUI(resetPressScale);
      },
      onCancel: () => {
        scheduleOnUI(resetPressScale);
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
      pressScale.set(withSpring(0.95));
    })
    .onFinalize(() => {
      "worklet";
      if (overlayOpen.get() === 0) {
        pressScale.set(withSpring(1));
      }
    });

  const pan = panGesture.onFinalize(() => {
    "worklet";
    if (overlayOpen.get() === 0) {
      pressScale.set(withSpring(1));
    }
  });

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      "worklet";
      pressScale.set(withSpring(0.95));
    })
    .onEnd(() => {
      "worklet";
      pressScale.set(withSpring(1));
      if (!isLongPressed.get()) {
        scheduleOnRN(navigateToMediaDetail);
      }
    })
    .onFinalize(() => {
      "worklet";
      pressScale.set(withSpring(1));
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(longPressWithScale, tapGesture),
    pan
  );

  const animatedStyle = useAnimatedStyle(() => {
    const active = activeIndex.get();
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
      pressScale.get();

    // Static z-index: card 0 always on top, descending order
    const zIndex = totalItems - index;

    return {
      transform: [{ translateX }, { scale }],
      zIndex,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const active = activeIndex.get();
    const diff = index - active;
    const absDiff = Math.abs(diff);

    const galleryFactor = interpolate(
      active,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    );

    // Dark overlay intensity based on distance from focused card
    const carouselDarkness = interpolate(
      absDiff,
      [0, 1, 2, 3],
      [0, 0.5, 0.7, 0.85],
      Extrapolation.CLAMP
    );
    // In stack mode (index 0), darken all cards except the front one
    const stackDarkness = index === 0 ? 0 : 0.5;
    const finalDarkness = interpolate(
      galleryFactor,
      [0, 1],
      [carouselDarkness, stackDarkness],
      Extrapolation.CLAMP
    );

    return {
      opacity: finalDarkness,
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
          <Animated.View
            style={[styles.darkOverlay, overlayStyle]}
            pointerEvents="none"
          />
        </View>
      </GestureDetector>
    </Animated.View>
  );
};

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

  const updateIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startIndex.set(activeIndex.get());
    })
    .onUpdate((e) => {
      const newIndex =
        startIndex.get() - e.translationX / (ITEM_WIDTH + ITEM_SPACING);
      activeIndex.set(Math.max(0, Math.min(media.length - 1, newIndex)));
    })
    .onEnd((e) => {
      const projected = activeIndex.get() - e.velocityX / 1000;
      const target = Math.max(
        0,
        Math.min(media.length - 1, Math.round(projected))
      );
      activeIndex.set(withSpring(target));
      scheduleOnRN(updateIndex, target);
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.xl,
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
    borderRadius: 6,

    overflow: "hidden",
    boxShadow: shadows.insetHighlightDeep,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  image: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "black",
  },
});

export default HomeCarousel;
