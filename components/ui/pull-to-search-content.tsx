import React, { FC } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FULL_DRAG_DISTANCE,
  TRIGGER_DRAG_DISTANCE,
  useHomeAnimation,
} from "../../contexts/home-animation-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { SharedSearchResults } from "./shared-search-results";
import { TopGradient } from "./top-gradient";

type PullToSearchContentProps = {
  children: React.ReactNode;
  searchResults?: any[];
  searchQuery?: string;
  isSearchLoading?: boolean;
  isSearchError?: boolean;
  onSearch?: (query: string) => void;
};

export const PullToSearchContent: FC<PullToSearchContentProps> = ({
  children,
  searchResults = [],
  searchQuery = "",
  isSearchLoading = false,
  isSearchError = false,
}) => {
  const insets = useSafeAreaInsets();
  const { grossHeight } = useHeaderHeight();

  const { screenView, offsetY, isListDragging, blurIntensity, onGoToCommands } =
    useHomeAnimation();

  // Top gradient animation for main content (shows behind header)
  const rMainTopGradientStyle = useAnimatedStyle(() => {
    return {
      // Keep top gradient on during main content (non-negative offset) for depth
      // withTiming smooths appearance/disappearance when toggling views
      opacity:
        offsetY.value < 0
          ? 0
          : screenView.value === "favorites"
            ? withTiming(1)
            : 0,
    };
  });

  // Top gradient animation for search results (shows when search is open and pulled past trigger)
  const rSearchTopGradientStyle = useAnimatedStyle(() => {
    return {
      opacity:
        screenView.value === "commands" && offsetY.value > TRIGGER_DRAG_DISTANCE
          ? withTiming(1, { duration: 1000 })
          : 0,
    };
  });

  // Central scroll handler drives shared values used across components
  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      // eslint-disable-next-line react-compiler/react-compiler
      isListDragging.value = true;
    },
    onScroll: (event) => {
      const offsetYValue = event.contentOffset.y;
      offsetY.value = offsetYValue;

      if (screenView.value === "favorites") {
        // Map pull distance to blur intensity; clamp to 0..100 to avoid spikes
        blurIntensity.value = interpolate(
          offsetYValue,
          [0, FULL_DRAG_DISTANCE],
          [0, 100],
          Extrapolation.CLAMP
        );
      }
    },
    onEndDrag: (event) => {
      isListDragging.value = false;
      const scrollY = event.contentOffset.y;
      // Switch to commands when pulled beyond trigger
      if (scrollY < TRIGGER_DRAG_DISTANCE) {
        runOnJS(onGoToCommands)();
      }
    },
  });

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: screenView.value === "commands" ? "none" : "auto",
    };
  });

  // Search results overlay
  const rSearchResultsStyle = useAnimatedStyle(() => {
    return {
      opacity:
        screenView.value === "commands"
          ? 1
          : interpolate(
              offsetY.value,
              [FULL_DRAG_DISTANCE * 0.2, FULL_DRAG_DISTANCE],
              [0, 1],
              Extrapolation.CLAMP
            ),
      transform: [{ translateY: -offsetY.value }],
      pointerEvents: screenView.value === "commands" ? "auto" : "none",
    };
  });

  return (
    <View style={styles.container}>
      {/* Main content with pull gesture */}
      <Animated.View style={[styles.mainContent, rContainerStyle]}>
        <Animated.ScrollView
          style={[
            styles.scrollView,
            {
              paddingBottom: insets.bottom + 8,
              paddingTop: grossHeight + 20,
            },
          ]}
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {children}
        </Animated.ScrollView>
      </Animated.View>

      {/* Search results overlay */}
      <Animated.View style={[styles.searchResults, rSearchResultsStyle]}>
        <SharedSearchResults
          searchResults={[]}
          flatResults={searchResults}
          searchQuery={searchQuery}
          isLoading={isSearchLoading}
          isError={isSearchError}
        />
      </Animated.View>

      {/* Top gradient for main content */}
      <Animated.View
        style={[
          rMainTopGradientStyle,
          StyleSheet.absoluteFillObject,
          { height: grossHeight, zIndex: 0 },
        ]}
      >
        <TopGradient />
      </Animated.View>

      {/* Top gradient for search results - positioned between FlashList and header */}
      <Animated.View
        style={[
          rSearchTopGradientStyle,
          StyleSheet.absoluteFillObject,
          { height: grossHeight, zIndex: 50 },
        ]}
      >
        <TopGradient />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  searchResults: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10, // Higher z-index to appear above blur
  },
});
