import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { X as ClearIcon, Search as SearchIcon } from "lucide-react-native";
import React, { FC, useContext } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SEARCHBAR_COMMANDS_WIDTH,
  SEARCHBAR_FAVORITES_WIDTH,
  SEARCHBAR_HEIGHT,
  TRIGGER_DRAG_DISTANCE,
  useHomeAnimation,
} from "../../contexts/home-animation-context";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

type AnimatedSearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
};

export const AnimatedSearchBar: FC<AnimatedSearchBarProps> = ({
  value = "",
  onChangeText,
  onClear,
  placeholder = "Search for media...",
}) => {
  const { screenView, offsetY, isListDragging, inputRef, onGoToCommands } =
    useHomeAnimation();
  const { theme } = useContext(ThemeContext);
  const isHapticTriggered = useSharedValue(false);

  // Raycast-style haptic feedback: trigger once when crossing trigger threshold during pull
  const handleHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    isHapticTriggered.value = true;
  };

  // Reset haptic trigger when dragging stops
  useAnimatedReaction(
    () => isListDragging.value,
    (dragging) => {
      if (!dragging) {
        isHapticTriggered.value = false;
      }
    },
  );

  // Trigger haptic when pulling past trigger distance
  useAnimatedReaction(
    () => offsetY.value,
    (currentOffset) => {
      if (
        isListDragging.value &&
        currentOffset < 0 &&
        currentOffset < TRIGGER_DRAG_DISTANCE &&
        !isHapticTriggered.value
      ) {
        runOnJS(handleHaptics)();
      }
    },
  );

  // Search width animates between two target widths based on view
  // Spring config gives quick but non-bouncy settle matching Raycast feel
  // During active pull beyond trigger, add a small scale bump for tactile feedback
  const rContainerStyle = useAnimatedStyle(() => {
    if (
      isListDragging.value &&
      offsetY.value < 0 &&
      offsetY.value < TRIGGER_DRAG_DISTANCE
    ) {
      return {
        transformOrigin: "center",
        transform: [{ scale: withTiming(1.05) }],
      };
    }

    return {
      width: withSpring(
        screenView.value === "favorites"
          ? SEARCHBAR_FAVORITES_WIDTH
          : SEARCHBAR_COMMANDS_WIDTH,
      ),
      transform: [{ scale: withTiming(1) }],
      // While dragging center the origin to avoid noticeable skew
      // Otherwise anchor to the right so width change feels like Cancel button appears
      transformOrigin: isListDragging.value ? "center" : "right",
    };
  });

  const handleClear = () => {
    onChangeText && onChangeText("");
    onClear && onClear();
  };

  return (
    <Animated.View style={[styles.container, rContainerStyle]}>
      <TouchableOpacity
        onPress={onGoToCommands}
        activeOpacity={1}
        style={styles.touchableContent}
      >
        <BlurView
          intensity={20}
          tint="default"
          style={[
            styles.blurView,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <SearchIcon size={18} color={theme.inputPlaceholderText} />
          <TextInput
            ref={inputRef}
            style={[
              styles.inputText,
              {
                color: theme.inputText,
                fontFamily: fontFamily.plusJakarta.regular,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.inputPlaceholderText}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => {
              // Ensure search mode is activated when input is focused
              onGoToCommands();
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
            selectionColor={theme.text}
          />
          {Boolean(value && value.length > 0) && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ClearIcon size={16} color={theme.inputPlaceholderText} />
            </TouchableOpacity>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    marginRight: 0,
    zIndex: 101, // Higher than search results but part of header
  },
  touchableContent: {
    width: "98%",
    height: SEARCHBAR_HEIGHT,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
});
