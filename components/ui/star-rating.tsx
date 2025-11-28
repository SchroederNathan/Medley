import * as Haptics from "expo-haptics";
import React, { useContext, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { StarOutlineIcon, StarSolidIcon } from "./svg-icons";

// Star rating geometry
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STAR_SIZE_BASE = Math.min(SCREEN_WIDTH * 0.12, 52); // 12% of screen width, max 52
const STAR_SIZE_MAX = 72;
const STAR_GAP = 6;
const PROXIMITY_RADIUS = 72;

interface StarContentProps {
  size: number;
  fillPercentage: number;
  filledColor: string;
  emptyColor: string;
}

const StarContent: React.FC<StarContentProps> = ({
  size,
  fillPercentage,
  filledColor,
  emptyColor,
}) => {
  if (fillPercentage <= 0) {
    return (
      <StarOutlineIcon
        size={size + 2}
        color={emptyColor}
        strokeWidth={1}
        style={{ marginBottom: 1 }}
      />
    );
  }

  if (fillPercentage >= 1) {
    return <StarSolidIcon size={size} color={filledColor} />;
  }

  // Half star: overlay solid star with clip
  return (
    <View style={{ width: size, height: size }}>
      <StarOutlineIcon
        size={size + 2}
        color={emptyColor}
        strokeWidth={1}
        style={{ position: "absolute", bottom: 1 }}
      />
      <View
        style={{
          position: "absolute",
          width: size * fillPercentage,
          height: size,
          overflow: "hidden",
        }}
      >
        <StarSolidIcon size={size} color={filledColor} />
      </View>
    </View>
  );
};

interface AnimatedStarProps {
  index: number;
  fillPercentage: number;
  filledColor: string;
  emptyColor: string;
  cursorX: SharedValue<number>;
  isSliding: SharedValue<boolean>;
}

const AnimatedStar: React.FC<AnimatedStarProps> = ({
  index,
  fillPercentage,
  filledColor,
  emptyColor,
  cursorX,
  isSliding,
}) => {
  // Calculate center X of this star (accounting for dynamic sizing)
  const getStarCenterX = () => {
    "worklet";
    // Approximate center based on base size
    return index * (STAR_SIZE_BASE + STAR_GAP) + STAR_SIZE_BASE / 2;
  };

  // Derive animated size based on proximity to cursor
  const animatedSize = useDerivedValue(() => {
    if (!isSliding.value) {
      return withSpring(STAR_SIZE_BASE);
    }

    const starCenterX = getStarCenterX();
    const distance = Math.abs(cursorX.value - starCenterX);
    const normalized = Math.max(0, 1 - distance / PROXIMITY_RADIUS);
    // Ease the proximity for smoother falloff
    const eased = normalized * normalized;
    const targetSize =
      STAR_SIZE_BASE + (STAR_SIZE_MAX - STAR_SIZE_BASE) * eased;

    return withSpring(targetSize);
  });

  // Animated container style - only width adjusts, height stays fixed
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      width: animatedSize.value,
    };
  });

  // Sync animated size to React state for rendering
  const [currentSize, setCurrentSize] = useState(STAR_SIZE_BASE);

  useAnimatedReaction(
    () => animatedSize.value,
    (size) => {
      runOnJS(setCurrentSize)(size);
    }
  );

  return (
    <Animated.View
      style={[
        {
          height: STAR_SIZE_MAX,
          alignItems: "center",
          justifyContent: "center",
        },
        animatedContainerStyle,
      ]}
    >
      <StarContent
        size={currentSize}
        fillPercentage={fillPercentage}
        filledColor={filledColor}
        emptyColor={emptyColor}
      />
    </Animated.View>
  );
};

export interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  starCount?: number;
  filledColor?: string;
  emptyColor?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  starCount = 5,
  filledColor,
  emptyColor,
  style,
  size = STAR_SIZE_BASE,
}) => {
  const { theme } = useContext(ThemeContext);
  const resolvedFilledColor = filledColor ?? theme.text;
  const resolvedEmptyColor = emptyColor ?? theme.secondaryText;

  const lastSlideRating = useRef(0);
  const cursorX = useSharedValue(0);
  const isSliding = useSharedValue(false);

  const handleStarPress = (starIndex: number) => {
    Haptics.selectionAsync();
    // Toggle: if already at this value, clear; otherwise set to full star
    onRatingChange(rating === starIndex + 1 ? 0 : starIndex + 1);
  };

  const handleSlideRating = (newRating: number) => {
    // Round to nearest 0.5
    const roundedRating = Math.round(newRating * 2) / 2;
    const clampedRating = Math.min(starCount, Math.max(0, roundedRating));

    // Only update when rating actually changes
    if (clampedRating !== lastSlideRating.current) {
      lastSlideRating.current = clampedRating;
      Haptics.selectionAsync();
      onRatingChange(clampedRating);
    }
  };

  const calculateRatingFromX = (x: number) => {
    "worklet";
    // Each star takes up STAR_SIZE_BASE width + STAR_GAP (except last star)
    const starWithGap = STAR_SIZE_BASE + STAR_GAP;
    const starIndex = Math.floor(x / starWithGap);
    const withinStar = x - starIndex * starWithGap;

    // Calculate fill within the current star (0-1)
    const starFill = Math.min(1, Math.max(0, withinStar / STAR_SIZE_BASE));

    return Math.min(starCount, Math.max(0, starIndex + starFill));
  };

  const initSlideRating = () => {
    lastSlideRating.current = rating;
  };

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      isSliding.value = true;
      cursorX.value = e.x;
      runOnJS(initSlideRating)();
      const newRating = calculateRatingFromX(e.x);
      runOnJS(handleSlideRating)(newRating);
    })
    .onUpdate((e) => {
      cursorX.value = e.x;
      const newRating = calculateRatingFromX(e.x);
      runOnJS(handleSlideRating)(newRating);
    })
    .onEnd(() => {
      isSliding.value = false;
    })
    .onFinalize(() => {
      isSliding.value = false;
    });

  const stars = Array.from({ length: starCount }, (_, i) => i);

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <View style={[styles.container, style]}>
          {stars.map((i) => {
            const fillPercentage = Math.min(1, Math.max(0, rating - i));
            return (
              <Pressable key={i} onPress={() => handleStarPress(i)}>
                <AnimatedStar
                  index={i}
                  fillPercentage={fillPercentage}
                  filledColor={resolvedFilledColor}
                  emptyColor={resolvedEmptyColor}
                  cursorX={cursorX}
                  isSliding={isSliding}
                />
              </Pressable>
            );
          })}
        </View>
      </GestureDetector>
      <Text style={[styles.ratingText, { color: theme.secondaryText }]}>
        {rating ? `Thank you for rating.` : "Tap to rate."}
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    marginTop: -8,
    fontFamily: fontFamily.plusJakarta.regular,
  },
});

export default StarRating;
