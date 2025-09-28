import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { fontFamily } from "../../lib/fonts";
import { Media } from "../../types/media";
import { BottomGradient } from "./bottom-gradient";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH;
const ITEM_SPACING = 0;
const DOT_SIZE = 6;
const DOT_GAP = 4;
const DOT_CONTAINER_WIDTH = DOT_SIZE + DOT_GAP;

interface HomeCarouselProps {
  media: Media[];
}

interface CarouselDotProps {
  index: number;
  listOffsetX: SharedValue<number>;
  isActive: boolean;
  totalImages: number;
  defaultDotColor?: string;
  activeDotColor?: string;
}

const CarouselDot: React.FC<CarouselDotProps> = ({
  index,
  listOffsetX,
  isActive,
  totalImages,
  defaultDotColor = "#525252",
  activeDotColor = "#3b82f6",
}) => {
  const rDotStyle = useAnimatedStyle(() => {
    if (totalImages < 6) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }],
      };
    }

    const hideDot =
      index === 0 ||
      index === 1 ||
      index === totalImages + 2 ||
      index === totalImages + 3;

    const scale = interpolate(
      DOT_CONTAINER_WIDTH * index - listOffsetX.value,
      [
        0,
        DOT_CONTAINER_WIDTH,
        DOT_CONTAINER_WIDTH * 2,
        DOT_CONTAINER_WIDTH * 3,
        DOT_CONTAINER_WIDTH * 4,
        DOT_CONTAINER_WIDTH * 5,
        DOT_CONTAINER_WIDTH * 6,
      ],
      [0.3, 0.7, 1, 1, 1, 0.7, 0.3],
      Extrapolation.CLAMP,
    );

    return {
      opacity: hideDot ? 0 : 1,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.dotContainer}>
      <Animated.View
        style={[
          styles.dot,
          rDotStyle,
          { backgroundColor: isActive ? activeDotColor : defaultDotColor },
        ]}
      />
    </View>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

const HomeCarousel: React.FC<HomeCarouselProps> = ({ media }) => {
  const { theme } = useContext(ThemeContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDotsPressed, setIsDotsPressed] = useState(false);
  const carouselRef = useRef<FlatList>(null);
  const dotsListRef = useRef<FlatList>(null);
  const listOffsetX = useSharedValue(0);
  const translateXStep = media.length > 10 ? 12 : 15;
  const prevTranslateX = useSharedValue(0);
  const refIndex = useRef(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      listOffsetX.value = event.contentOffset.x;
    },
  });

  const handleImageIndexChange = (action: "increase" | "decrease") => {
    const index = action === "increase" ? currentIndex + 1 : currentIndex - 1;

    if (index < 0 || index >= media.length) return;

    setCurrentIndex(index);

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    carouselRef.current?.scrollToIndex({
      animated: false,
      index,
    });
  };

  const handleFinalize = () => {
    if (!isDotsPressed) return;
    setIsDotsPressed(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      prevTranslateX.value = 0;
    })
    .onUpdate((event) => {
      if (!isDotsPressed) return;

      const translateX = event.translationX;

      if (translateX - prevTranslateX.value > translateXStep) {
        runOnJS(handleImageIndexChange)("increase");
        prevTranslateX.value = translateX;
      }

      if (translateX - prevTranslateX.value < -translateXStep) {
        runOnJS(handleImageIndexChange)("decrease");
        prevTranslateX.value = translateX;
      }
    })
    .onFinalize(() => {
      runOnJS(handleFinalize)();
    });

  // Smart dots list scrolling: keep current dot within visible viewport
  // When user scrolls beyond 2 dots ahead, shift dots list to maintain visibility
  useEffect(() => {
    if (media.length <= 5) return; // No scrolling needed for small lists

    const targetIndex = media.length > 5 ? currentIndex + 2 : currentIndex;

    // When user scrolls beyond 2 dots ahead, shift dots list to maintain visibility
    if (currentIndex - refIndex.current > 2) {
      refIndex.current = currentIndex - 2; // Keep 2 dots before current visible
      dotsListRef.current?.scrollToIndex({
        animated: true,
        index: Math.max(0, currentIndex - 2),
      });
    }

    // When scrolling backwards, ensure current dot stays visible
    if (currentIndex - refIndex.current < 0) {
      refIndex.current = currentIndex;
      dotsListRef.current?.scrollToIndex({
        animated: true,
        index: Math.max(0, currentIndex),
      });
    }
  }, [currentIndex, media.length]);

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isDotsPressed ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0)",
        { duration: 150 },
      ),
    };
  });

  const renderItem = ({ item }: { item: Media }) => (
    <View style={styles.carouselItem}>
      <LinearGradient
        style={[styles.bottomGradient, { height: 100 }]}
        colors={[
          "rgba(10, 10, 10, 0)",
          "rgba(10, 10, 10, 0.6)",
          "rgba(10, 10, 10, 0.9)",
        ]}
        locations={[0, 0.4, 0.9]}
      />
      <Image
        source={{ uri: item.backdrop_url }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </View>
  );

  if (media.length === 0) return null;

  return (
    <View style={[styles.container]}>
      <FlatList
        ref={carouselRef}
        data={media}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (ITEM_WIDTH + ITEM_SPACING),
          );
          setCurrentIndex(index);
        }}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContainer}
      />
      {media.length > 1 && (
        <View style={styles.paginationContainer}>
          <GestureDetector gesture={gesture}>
            <AnimatedPressable
              style={[styles.dotsContainer, rContainerStyle]}
              onLongPress={() => {
                setIsDotsPressed(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              delayLongPress={200}
            >
              <View
                style={{
                  width:
                    DOT_CONTAINER_WIDTH * (media.length > 5 ? 7 : media.length),
                }}
              >
                <Animated.FlatList
                  ref={dotsListRef}
                  data={Array.from({
                    length: media.length > 5 ? media.length + 4 : media.length,
                  }).map((_, index) => index)}
                  renderItem={({ item }) => (
                    <CarouselDot
                      index={item}
                      listOffsetX={listOffsetX}
                      defaultDotColor={theme.secondaryText}
                      activeDotColor={theme.text}
                      isActive={
                        media.length > 5
                          ? item === currentIndex + 2
                          : item === currentIndex
                      }
                      totalImages={media.length}
                    />
                  )}
                  horizontal
                  scrollEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}
                />
              </View>
            </AnimatedPressable>
          </GestureDetector>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: -20,
  },
  carouselContainer: {},
  carouselItem: {
    width: ITEM_WIDTH,
    height: 250,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: "white",
    fontFamily: fontFamily.plusJakarta.bold,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    zIndex: 10,
  },
  paginationContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  dotsContainer: {
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
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default HomeCarousel;
