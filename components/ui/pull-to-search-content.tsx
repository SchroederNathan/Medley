import React, { FC, useCallback, useMemo } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../constants/theme";
import { useAuroraScroll } from "../../contexts/aurora-scroll-context";
import {
  FULL_DRAG_DISTANCE,
  TRIGGER_DRAG_DISTANCE,
  useHomeAnimation,
} from "../../contexts/home-animation-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { SharedSearchResults } from "./shared-search-results";
import { TopGradient } from "./top-gradient";

const IS_ANDROID = Platform.OS === "android";

// Matches the resistance UIScrollView applies past its top edge, so the same
// finger travel lands on the same TRIGGER/FULL_DRAG thresholds on both
// platforms. Android's ScrollView clamps contentOffset at 0 and shows a
// stretch instead, so the pull has to be produced here.
const RUBBER_BAND_C = 0.55;

const rubberBand = (distance: number, dimension: number) => {
  "worklet";
  return (1 - 1 / ((distance * RUBBER_BAND_C) / dimension + 1)) * dimension;
};

/**
 * Plain-JS scroll props handed to `renderList`. A list component (FlashList)
 * intercepts `onScroll` and re-invokes it as a normal function, so a
 * Reanimated worklet handler can't be attached there — these callbacks write
 * the same shared values from the JS thread instead.
 */
export type PullToSearchScrollProps = {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
  /**
   * Android only. The list must scroll through this component: a scroller
   * Gesture Handler does not know about takes the touch lock through
   * `requestDisallowInterceptTouchEvent`, RNGH cancels every handler, and the
   * pull-to-search pan below dies before it can open search. Undefined on iOS,
   * where the list keeps its own scroller and bounces natively.
   */
  renderScrollComponent?: React.ComponentType<ScrollViewProps>;
};

type PullToSearchContentProps = {
  children?: React.ReactNode;
  searchResults?: any[];
  searchQuery?: string;
  isSearchLoading?: boolean;
  isSearchError?: boolean;
  onSearch?: (query: string) => void;
  /**
   * Render an own-scrolling list (e.g. FlashList) instead of the default
   * ScrollView. The list must spread the given scroll props so pull-to-search
   * and the aurora keep following the scroll.
   */
  renderList?: (scrollProps: PullToSearchScrollProps) => React.ReactNode;
};

export const PullToSearchContent: FC<PullToSearchContentProps> = ({
  children,
  searchResults = [],
  searchQuery = "",
  isSearchLoading = false,
  isSearchError = false,
  renderList,
}) => {
  const insets = useSafeAreaInsets();
  const { grossHeight } = useHeaderHeight();
  const { height: windowHeight } = useWindowDimensions();

  const { screenView, offsetY, isListDragging, blurIntensity, onGoToCommands } =
    useHomeAnimation();

  // Lets the aurora background follow an overscroll drag.
  const auroraScroll = useAuroraScroll();

  // Android-only pull tracking. `nativeScrollY` is the real, never-negative
  // scroll position; the pan below only takes over once it sits at the top.
  const nativeScrollY = useSharedValue(0);
  const pullStartY = useSharedValue(0);
  const canPull = useSharedValue(false);
  const isPulling = useSharedValue(false);

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
      nativeScrollY.value = offsetYValue;
      // A pull in progress owns offsetY; the native scroll is pinned at 0 and
      // would otherwise fight it back to zero on every frame.
      if (isPulling.value) return;
      offsetY.value = offsetYValue;
      auroraScroll?.set(offsetYValue);

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

  // JS-thread twins of the worklet handler above, for renderList consumers.
  // Writing `.value` from JS is supported; the dependent animations still run
  // on the UI thread via their useAnimatedStyle hooks.
  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetYValue = event.nativeEvent.contentOffset.y;
      nativeScrollY.value = offsetYValue;
      if (isPulling.value) return;
      offsetY.value = offsetYValue;
      auroraScroll?.set(offsetYValue);

      if (screenView.value === "favorites") {
        blurIntensity.value = interpolate(
          offsetYValue,
          [0, FULL_DRAG_DISTANCE],
          [0, 100],
          Extrapolation.CLAMP
        );
      }
    },
    [auroraScroll, blurIntensity, isPulling, nativeScrollY, offsetY, screenView]
  );

  const handleListScrollBeginDrag = useCallback(() => {
    isListDragging.value = true;
  }, [isListDragging]);

  const handleListScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isListDragging.value = false;
      if (event.nativeEvent.contentOffset.y < TRIGGER_DRAG_DISTANCE) {
        onGoToCommands();
      }
    },
    [isListDragging, onGoToCommands]
  );

  // Keeps the aurora and the blur following offsetY while the pull is driven
  // by the pan gesture (and while it springs back), since the scroll handler
  // stops writing them for the duration.
  useAnimatedReaction(
    () => offsetY.value,
    (value) => {
      if (!IS_ANDROID) return;
      if (value >= 0) return;
      auroraScroll?.set(value);
      if (screenView.value === "favorites") {
        blurIntensity.value = interpolate(
          value,
          [0, FULL_DRAG_DISTANCE],
          [0, 100],
          Extrapolation.CLAMP
        );
      }
    }
  );

  // The pan never activates — it only reads touches. An activated pan would
  // take the gesture away from the native scroll and break normal scrolling.
  const pullGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(IS_ANDROID)
        .manualActivation(true)
        .onTouchesDown((event) => {
          const touch = event.allTouches[0];
          if (!touch) return;
          pullStartY.value = touch.absoluteY;
          canPull.value = nativeScrollY.value <= 0;
        })
        .onTouchesMove((event) => {
          if (!canPull.value) return;
          const touch = event.allTouches[0];
          if (!touch) return;
          const dragged = touch.absoluteY - pullStartY.value;
          if (dragged <= 0) {
            if (isPulling.value) {
              isPulling.value = false;
              offsetY.value = 0;
            }
            return;
          }
          isPulling.value = true;
          offsetY.value = -rubberBand(dragged, windowHeight);
        })
        .onTouchesUp(() => {
          if (!isPulling.value) return;
          isPulling.value = false;
          canPull.value = false;
          const released = offsetY.value;
          offsetY.value = withSpring(0, { damping: 20, stiffness: 200 });
          isListDragging.value = false;
          if (released < TRIGGER_DRAG_DISTANCE) {
            runOnJS(onGoToCommands)();
          }
        })
        .onTouchesCancelled(() => {
          if (!isPulling.value) return;
          isPulling.value = false;
          canPull.value = false;
          offsetY.value = withSpring(0, { damping: 20, stiffness: 200 });
          isListDragging.value = false;
        }),
    [
      canPull,
      isListDragging,
      isPulling,
      nativeScrollY,
      offsetY,
      onGoToCommands,
      pullStartY,
      windowHeight,
    ]
  );

  // The scroll view has to be a gesture RNGH knows about. Otherwise it takes
  // the touch lock through requestDisallowInterceptTouchEvent, which cancels
  // every handler and kills the pull one frame after it starts.
  const composedGesture = useMemo(
    () => Gesture.Simultaneous(Gesture.Native(), pullGesture),
    [pullGesture]
  );

  // Same trick for the list path: the pull pan sits on the pane, so the
  // list's own scroller has to be wrapped here to become a known gesture.
  const PullAwareScroller = useMemo(() => {
    if (!IS_ANDROID) return undefined;
    const Scroller = (props: ScrollViewProps) => {
      return (
        <GestureDetector gesture={composedGesture}>
          <ScrollView {...props} />
        </GestureDetector>
      );
    };
    Scroller.displayName = "PullAwareScroller";
    return Scroller;
  }, [composedGesture]);

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: screenView.value === "commands" ? "none" : "auto",
      // Stands in for the iOS bounce: the list itself cannot move past its top
      // edge on Android, so the whole pane follows the pull instead.
      transform: [{ translateY: IS_ANDROID ? Math.max(0, -offsetY.value) : 0 }],
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
        {renderList ? (
          <View style={styles.mainContent}>
            {/* Same paddings the ScrollView path applies to its own style. */}
            <View
              style={[
                styles.scrollView,
                {
                  flex: 1,
                  paddingBottom: insets.bottom + spacing.sm,
                  paddingTop: grossHeight + spacing.xl,
                },
              ]}
            >
              {renderList({
                onScroll: handleListScroll,
                onScrollBeginDrag: handleListScrollBeginDrag,
                onScrollEndDrag: handleListScrollEndDrag,
                scrollEventThrottle: 16,
                renderScrollComponent: PullAwareScroller,
              })}
            </View>
          </View>
        ) : (
          <GestureDetector gesture={composedGesture}>
            <Animated.ScrollView
              style={styles.scrollView}
              contentContainerStyle={{
                paddingBottom: insets.bottom + spacing.sm,
                paddingTop: grossHeight + spacing.xl,
              }}
              scrollEventThrottle={16}
              onScroll={scrollHandler}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
            >
              {children}
            </Animated.ScrollView>
          </GestureDetector>
        )}
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
          StyleSheet.absoluteFill,
          { height: grossHeight, zIndex: 0 },
        ]}
      >
        <TopGradient />
      </Animated.View>

      {/* Top gradient for search results - positioned between FlashList and header */}
      <Animated.View
        style={[
          rSearchTopGradientStyle,
          StyleSheet.absoluteFill,
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
    paddingHorizontal: spacing.xl,
  },
  searchResults: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10, // Higher z-index to appear above blur
  },
});
