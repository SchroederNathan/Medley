import { SlidersHorizontal } from "lucide-react-native";
import React, { FC, useContext } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useHomeAnimation } from "../../contexts/home-animation-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { fontFamily } from "../../lib/fonts";
import { AnimatedSearchBar } from "./animated-search-bar";

type SharedHeaderProps = {
  leftButton?: React.ReactNode;
  rightButton?: React.ReactNode;
  showCancelButton?: boolean;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
};

export const SharedHeader: FC<SharedHeaderProps> = ({
  leftButton,
  rightButton,
  showCancelButton = true,
  showFilterButton = true,
  onFilterPress,
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
}) => {
  const { insetTop, netHeight } = useHeaderHeight();
  const { offsetY, screenView, onGoToFavorites } = useHomeAnimation();
  const { theme } = useContext(ThemeContext);

  // Side buttons stay visible but become untappable during pull-down and in commands view
  const rSideButtonsContainerStyle = useAnimatedStyle(() => {
    if (offsetY.value < 0 || screenView.value === "commands") {
      return {
        opacity: 1, // Always visible, never fade out
        pointerEvents: "none", // Untappable during pull and search
      };
    }

    return {
      opacity: 1, // Always visible
      pointerEvents: "auto", // Tappable when not pulling
    };
  });

  // Cancel button appears only in commands view
  const rCancelButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: screenView.value === "commands" ? withTiming(1) : withTiming(0),
      pointerEvents: screenView.value === "commands" ? "auto" : "none",
    };
  });

  return (
    <>
      {/* Buttons positioned behind blur view */}
      <View
        style={[
          styles.behindBlurContainer,
          {
            paddingTop: insetTop,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.sideButtonsContainer,
            rSideButtonsContainerStyle,
            { height: netHeight, top: insetTop },
          ]}
        >
          <View style={styles.leftButton}>
            {leftButton ||
              (showFilterButton && (
                <SlidersHorizontal onPress={onFilterPress} color={theme.text} />
              ))}
          </View>
          <View style={styles.flex} />
          <View style={styles.rightButton}>{rightButton}</View>
        </Animated.View>
      </View>

      {/* Search bar and cancel button in front of blur view */}
      <View
        style={[
          styles.inFrontOfBlurContainer,
          {
            paddingTop: insetTop,
          },
        ]}
      >
        <AnimatedSearchBar
          value={searchValue}
          onChangeText={onSearchChange}
          onClear={onSearchClear}
          placeholder={searchPlaceholder}
        />

        {showCancelButton && (
          <Animated.View style={[styles.cancelButton, rCancelButtonStyle]}>
            <Pressable
              onPress={() => {
                onSearchClear && onSearchClear();
                Keyboard.dismiss(); // Explicitly dismiss keyboard
                onGoToFavorites();
              }}
              style={styles.cancelPressable}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.cancelText,
                  {
                    color: theme.text,
                    fontFamily: fontFamily.plusJakarta.medium,
                  },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  behindBlurContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 1, // Behind blur view but above main content gradients
    pointerEvents: "box-none",
  },
  inFrontOfBlurContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 100, // In front of blur view
    pointerEvents: "box-none",
  },
  sideButtonsContainer: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftButton: {
    width: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  rightButton: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
  cancelButton: {
    width: 75,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelPressable: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
  },
});
