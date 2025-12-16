import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
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
import { AuthContext } from "../../contexts/auth-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useSubmitReview } from "../../hooks/mutations";
import { fontFamily } from "../../lib/fonts";
import { queryKeys } from "../../lib/query-keys";
import { UserMediaService } from "../../services/userMediaService";
import { Media } from "../../types/media";
import { BottomGradient } from "./bottom-gradient";
import MediaCard from "./media-card";
import { StarRating } from "./star-rating";
import { BookmarkIcon, ArrowUpIcon } from "./svg-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// Base geometry
const MIN_HEIGHT = 56;
const BOOKMARK_BTN_SIZE = MIN_HEIGHT;
const INPUT_GAP = 10;
const KEYBOARD_APPROX = 336; // Approx keyboard height to start with

interface ReviewInputProps {
  item: Media;
  style?: StyleProp<ViewStyle>;
}

const SubmitButton = ({
  handleSubmit,
  disabled,
}: {
  handleSubmit: () => void;
  disabled?: boolean;
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <Pressable
      style={[
        styles.submitBtn,
        { backgroundColor: theme.secondaryButtonBackground },
        disabled && { opacity: 0.5 },
      ]}
      onPress={() => handleSubmit()}
      disabled={disabled}
    >
      <ArrowUpIcon size={24} color={theme.background} />
    </Pressable>
  );
};

const ReviewInput: React.FC<ReviewInputProps> = ({ item, style }) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [value, setValue] = useState("");
  const [rating, setRating] = useState(0);
  const [isHeightMaxed, setIsHeightMaxed] = useState(false);
  const router = useRouter();
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Mutation hook for submitting reviews
  const submitReviewMutation = useSubmitReview();
  const isSubmitting = submitReviewMutation.isPending;

  // Fetch existing review data
  const { data: existingReview } = useQuery({
    queryKey: queryKeys.userMediaItem.detail(user?.id ?? "", item.id),
    queryFn: async () => {
      if (!user?.id) return null;
      return await UserMediaService.getUserMediaItem(user.id, item.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Check if user has already reviewed (has rating or review text)
  const hasExistingReview =
    existingReview?.user_rating || existingReview?.review;

  // Track the last media ID we loaded data for
  const lastLoadedMediaId = useRef<string | null>(null);

  // Load existing review data when it's fetched or when item changes
  useEffect(() => {
    // Only load if this is a new media item or if we haven't loaded yet
    if (item.id !== lastLoadedMediaId.current) {
      if (existingReview) {
        if (existingReview.user_rating) {
          setRating(existingReview.user_rating);
        }
        if (existingReview.review) {
          setValue(existingReview.review);
        }
      } else {
        // Reset form for new media item with no review
        setRating(0);
        setValue("");
      }
      lastLoadedMediaId.current = item.id;
    }
  }, [existingReview, item.id]);

  // Calculate max available height (Screen - Insets - Keyboard - Margins)
  const maxAvailableHeight = SCREEN_HEIGHT - insets.top - KEYBOARD_APPROX - 20;

  // Focus progress: 0 = collapsed, 1 = expanded
  const focusProgress = useSharedValue(0);
  const maxWidth = useSharedValue(0);
  const contentHeight = useSharedValue(300); // Default expanded height before measure

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

    // Target height is content height clamped to available space
    const targetHeight = Math.min(contentHeight.value, maxAvailableHeight);

    const height = interpolate(
      focusProgress.get(),
      [0, 1],
      [MIN_HEIGHT, targetHeight]
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

  // Modal background opacity animation
  const rModalBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.get(), [0, 1], [0.5, 1]);
    return {
      opacity,
    };
  });

  const handleFocus = () => {
    focusProgress.set(withSpring(1));
    textInputRef.current?.focus();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBlur = () => {
    focusProgress.set(withSpring(0));
  };

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
    handleBlur();
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      console.error("User not logged in");
      return;
    }

    if (rating === 0) {
      // Optionally show an error message or just return
      return;
    }

    Haptics.selectionAsync();

    // Convert rating to integer (round to nearest whole number)
    // StarRating can return decimals like 1.5, 2.5, etc., but DB expects integer
    // Clamp to valid range (1-5) as per database constraint
    const integerRating = Math.max(1, Math.min(5, Math.round(rating)));

    submitReviewMutation.mutate(
      {
        mediaId: item.id,
        rating: integerRating,
        review: value,
      },
      {
        onSuccess: () => {
          // Reset the loaded media ID so the form reloads fresh data
          lastLoadedMediaId.current = null;
          // Close the form
          textInputRef.current?.blur();
          handleBlur();
        },
        onError: (error) => {
          console.error("Error submitting review:", error);
          // Optionally show an error toast here
        },
      }
    );
  };

  return (
    <View style={[styles.container, style]}>
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
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: theme.modalBackground },
                  rModalBackgroundStyle,
                ]}
              />
              <BlurView intensity={30} tint="dark" style={[styles.blur]} />

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
                    {hasExistingReview ? "Edit review..." : "Write a review..."}
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Expanded state: header + input + button */}
              <Animated.View style={[styles.expanded, rExpandedStyle]}>
                <ScrollView
                  ref={scrollViewRef}
                  bounces={isHeightMaxed}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View
                    style={styles.contentContainer}
                    onLayout={(e) => {
                      // Update content height + padding
                      const newContentHeight = e.nativeEvent.layout.height + 32; // 16 top + 16 bottom padding
                      contentHeight.value = newContentHeight;
                      // Only disable bounces when content exceeds max available height
                      setIsHeightMaxed(newContentHeight >= maxAvailableHeight);
                    }}
                  >
                    {/* Header */}
                    <View style={styles.header}>
                      <View style={styles.titleContainer}>
                        <MediaCard
                          media={item}
                          width={50}
                          height={75}
                          isTouchable={false}
                        />
                        <Text
                          style={[styles.title, { color: theme.text }]}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                      </View>
                      <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        style={{ justifyContent: "center" }}
                      />
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
                      scrollEnabled={false} // Allow it to grow
                      onBlur={handleBlur}
                    />
                  </View>
                </ScrollView>
                <SubmitButton
                  handleSubmit={handleSubmit}
                  disabled={isSubmitting || rating === 0}
                />
              </Animated.View>
            </Animated.View>

            {/* Bookmark button */}
            <AnimatedPressable
              style={[
                styles.bookmark,
                { borderColor: theme.inputBorder },
                rBookmarkStyle,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/save-media?id=${item.id}`);
              }}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: theme.modalBackground, opacity: 0.5 },
                ]}
              />
              <BlurView intensity={30} tint="dark" style={[styles.blur]} />
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
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "column",
  },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
    lineHeight: 16,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  // Expanded state
  expanded: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    maxWidth: 300,
    gap: 8,
  },
  titleImage: {
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  input: {
    minHeight: 100, // Ensure minimum height for input
    paddingBottom: 68,
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
    position: "absolute",
    right: 12,
    bottom: 12,
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
  contentContainer: {
    gap: 20,
  },
});
