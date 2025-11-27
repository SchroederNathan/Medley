import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useContext, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { BookmarkIcon, SentIcon } from "./svg-icons";
import { BottomGradient } from "./bottom-gradient";
import { StarRating } from "./star-rating";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// Base geometry
const MIN_HEIGHT = 56;
const EXPANDED_HEIGHT = 280;
const BOOKMARK_BTN_SIZE = MIN_HEIGHT;
const INPUT_GAP = 10;

interface ReviewInputProps {
  mediaTitle: string;
  onSubmit?: (review: string, rating: number) => void;
  style?: StyleProp<ViewStyle>;
}

const SubmitButton = ({ handleSubmit }: { handleSubmit: () => void }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <Pressable
      style={[
        styles.submitBtn,
        { backgroundColor: theme.secondaryButtonBackground },
      ]}
      onPress={() => handleSubmit()}
    >
      <SentIcon size={24} color={theme.background} />
    </Pressable>
  );
};

const ReviewInput: React.FC<ReviewInputProps> = ({
  mediaTitle,
  onSubmit,
  style,
}) => {
  const { theme } = useContext(ThemeContext);
  const [value, setValue] = useState("");
  const [rating, setRating] = useState(0);

  const textInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // Focus progress: 0 = collapsed, 1 = expanded
  const focusProgress = useSharedValue(0);
  const maxWidth = useSharedValue(0);

  // Backdrop animation
  const rBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.get(), [0, 0.5], [0, 1]);
    return {
      opacity,
      pointerEvents: focusProgress.get() > 0.3 ? "auto" : "none",
    };
  });

  // Root container padding animation
  const rRootStyle = useAnimatedStyle(() => {
    const paddingBottom = interpolate(
      focusProgress.get(),
      [0, 1],
      [insets.bottom + 12, 12]
    );
    return { paddingBottom };
  });

  // Main card transforms from pill to full card
  const rCardStyle = useAnimatedStyle(() => {
    if (maxWidth.get() === 0) {
      return { height: MIN_HEIGHT };
    }

    const width = interpolate(
      focusProgress.get(),
      [0, 1],
      [maxWidth.get() - BOOKMARK_BTN_SIZE - INPUT_GAP, maxWidth.get()]
    );
    const height = interpolate(
      focusProgress.get(),
      [0, 1],
      [MIN_HEIGHT, EXPANDED_HEIGHT]
    );
    const borderRadius = interpolate(
      focusProgress.get(),
      [0, 1],
      [MIN_HEIGHT / 2, 20]
    );

    return { width, height, borderRadius };
  });

  // Bookmark button collapses and fades out
  const rBookmarkStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.get(), [0, 0.3], [1, 0]);
    const width = interpolate(
      focusProgress.get(),
      [0, 0.5, 1],
      [BOOKMARK_BTN_SIZE, BOOKMARK_BTN_SIZE / 2, 0]
    );
    const marginLeft = interpolate(
      focusProgress.get(),
      [0, 0.5, 1],
      [INPUT_GAP, INPUT_GAP / 2, 0]
    );
    return {
      opacity,
      width,
      marginLeft,
    };
  });

  // Placeholder fades out
  const rPlaceholderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.get(), [0, 0.2], [1, 0]);
    return {
      opacity,
      pointerEvents: focusProgress.get() < 0.2 ? "auto" : "none",
    };
  });

  // Expanded content fades in
  const rExpandedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.get(), [0.3, 0.6], [0, 1]);
    return {
      opacity,
      pointerEvents: focusProgress.get() > 0.5 ? "auto" : "none",
    };
  });

  const handleFocus = () => {
    focusProgress.set(withSpring(1));
    textInputRef.current?.focus();
  };

  const handleBlur = () => {
    focusProgress.set(withSpring(0));
  };

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
    handleBlur();
  };

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit(value, rating);
      setValue("");
      setRating(0);
      textInputRef.current?.blur();
    }
  };

  return (
    <View style={[style]}>
      {/* Bottom gradient (behind input) */}
      <BottomGradient />

      {/* Backdrop overlay */}
      <Animated.View style={[styles.backdrop, rBackdropStyle]}>
        <AnimatedBlurView
          intensity={8}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Input component */}
      <KeyboardStickyView
        offset={{ opened: Platform.OS === "android" ? 36 : 0 }}
      >
        <Animated.View style={[styles.root, rRootStyle]}>
          <View
            style={styles.row}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (maxWidth.get() === 0 && w > 0) {
                maxWidth.set(w);
              }
            }}
          >
            {/* Main transforming card */}
            <Animated.View
              style={[
                styles.card,
                { borderColor: theme.inputBorder },
                rCardStyle,
              ]}
            >
              <BlurView
                intensity={30}
                tint="dark"
                style={[
                  styles.blur,
                  { backgroundColor: theme.inputBackground },
                ]}
              />

              {/* Collapsed state: placeholder trigger */}
              <Animated.View
                style={[styles.placeholderWrap, rPlaceholderStyle]}
              >
                <Pressable
                  style={styles.placeholderPress}
                  onPress={handleFocus}
                >
                  <Text
                    style={[
                      styles.placeholderText,
                      { color: theme.inputPlaceholderText },
                    ]}
                  >
                    Write a review...
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Expanded state: header + input + button */}
              <Animated.View style={[styles.expanded, rExpandedStyle]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text
                    style={[styles.title, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    Write a review
                  </Text>
                  <StarRating rating={rating} onRatingChange={setRating} />
                </View>

                {/* Text Input */}
                <TextInput
                  ref={textInputRef}
                  value={value}
                  onChangeText={setValue}
                  placeholder="What did you think?"
                  placeholderTextColor={theme.inputPlaceholderText}
                  selectionColor={theme.text}
                  style={[styles.input, { color: theme.inputText }]}
                  multiline
                  numberOfLines={4}
                  onBlur={handleBlur}
                />

                {/* Submit button */}
                <View style={styles.submitRow}>
                  <SubmitButton handleSubmit={handleSubmit} />
                </View>
              </Animated.View>
            </Animated.View>

            {/* Bookmark button */}
            <AnimatedPressable
              style={[
                styles.bookmark,
                { borderColor: theme.inputBorder },
                rBookmarkStyle,
              ]}
              onPress={() => Haptics.selectionAsync()}
            >
              <BlurView
                intensity={20}
                tint="dark"
                style={[
                  styles.blur,
                  { backgroundColor: theme.inputBackground },
                ]}
              />
              <BookmarkIcon size={20} color={theme.text} />
            </AnimatedPressable>
          </View>
        </Animated.View>
      </KeyboardStickyView>
    </View>
  );
};

export default ReviewInput;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 0,
  },
  root: {
    marginHorizontal: 12,
    zIndex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  card: {
    borderWidth: 1,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  blur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Collapsed state
  placeholderWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderPress: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  // Expanded state
  expanded: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlignVertical: "top",
    paddingTop: Platform.OS === "ios" ? 0 : 8,
  },
  submitRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  submitBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bookmark
  bookmark: {
    height: BOOKMARK_BTN_SIZE,
    borderRadius: BOOKMARK_BTN_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
