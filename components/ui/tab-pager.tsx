import React, { useContext, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

type TabItem = {
  key: string;
  title: string;
};

type TabPagerProps = {
  tabs: TabItem[];
  selectedKey: string;
  onChange: (key: string, index: number) => void;
  style?: ViewStyle;
  pages: React.ReactNode[];
};

// Reanimated v4-friendly animated underline tab pager with swipeable content
const TabPager = ({
  tabs,
  selectedKey,
  onChange,
  style,
  pages,
}: TabPagerProps) => {
  const { theme } = useContext(ThemeContext);

  // Layout measurements per tab for underline width/position animation
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
  const containerPaddingHorizontal = 0;

  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        tabs.findIndex((t) => t.key === selectedKey)
      ),
    [tabs, selectedKey]
  );

  // Shared values for underline and scroll state
  const underlineX = useSharedValue(0);
  const underlineWidth = useSharedValue(0);
  const tabXs = useSharedValue<number[]>([]);
  const tabWs = useSharedValue<number[]>([]);
  const pageWidth = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const [measuredWidth, setMeasuredWidth] = React.useState(0);
  const scrollRef = useRef<any>(null);

  // Shared values for tab opacity animation
  const tabOpacities = tabs.map(() => useSharedValue(0.5));

  // Function to animate tab opacities
  const animateTabOpacities = (selectedIndex: number) => {
    tabOpacities.forEach((opacity, index) => {
      const targetOpacity = index === selectedIndex ? 1 : 0.5;
      opacity.value = withTiming(targetOpacity, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    });
  };

  // Initialize tab opacities
  React.useEffect(() => {
    tabOpacities.forEach((opacity, index) => {
      opacity.value = index === selectedIndex ? 1 : 0.5;
    });
  }, []); // Only run once on mount

  // Create animated styles for tab text opacity
  const tabTextStyles = tabOpacities.map((opacity) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
    }))
  );

  const animateUnderlineTo = (index: number) => {
    // For tap navigation, we update the fallback position but rely on scroll-based positioning
    const layout = tabLayouts.current[index];
    if (!layout) return;
    const targetX = layout.x + containerPaddingHorizontal;
    underlineX.value = targetX;
    underlineWidth.value = layout.width;
  };

  React.useEffect(() => {
    // Initialize position once we have measurements
    if (tabLayouts.current[selectedIndex]) {
      const layout = tabLayouts.current[selectedIndex];
      const adjustedX = layout.x + containerPaddingHorizontal;
      underlineX.value = adjustedX;
      underlineWidth.value = layout.width;

      // Also update the shared arrays for interpolation
      const nextXs = [...(tabXs.value || [])];
      const nextWs = [...(tabWs.value || [])];
      nextXs[selectedIndex] = adjustedX;
      nextWs[selectedIndex] = layout.width;
      tabXs.value = nextXs;
      tabWs.value = nextWs;
    }

    // Animate tab opacities
    animateTabOpacities(selectedIndex);
  }, [selectedIndex]);

  // Drive underline by scroll position when possible; fallback to measured/index when arrays not ready
  const underlineStyle = useAnimatedStyle(() => {
    const xs = tabXs.value;
    const ws = tabWs.value;
    const pw = pageWidth.value;

    // If we have all tab measurements, use scroll-based smooth positioning
    if (xs.length === tabs.length && ws.length === tabs.length && pw > 0) {
      // Calculate progress between pages (0 to tabs.length - 1)
      const progress = scrollX.value / pw;
      const clampedProgress = Math.max(0, Math.min(progress, tabs.length - 1));

      // Find which segment we're in (between which two tabs)
      const startIndex = Math.floor(clampedProgress);
      const endIndex = Math.min(startIndex + 1, tabs.length - 1);

      // Interpolate between the two tab positions
      const segmentProgress = clampedProgress - startIndex;
      const startX = xs[startIndex] || 0;
      const endX = xs[endIndex] || 0;
      const startW = ws[startIndex] || 0;
      const endW = ws[endIndex] || 0;

      const currentX = startX + (endX - startX) * segmentProgress;
      const currentW = startW + (endW - startW) * segmentProgress;

      return { transform: [{ translateX: currentX }], width: currentW };
    }

    // Fallback to manual positioning
    return {
      transform: [{ translateX: underlineX.value }],
      width: underlineWidth.value,
    };
  });

  const onTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };
    // keep arrays for animated interpolation during scroll
    const nextXs = [...(tabXs.value || [])];
    const nextWs = [...(tabWs.value || [])];
    nextXs[index] = x + containerPaddingHorizontal; // Include padding in stored positions
    nextWs[index] = width;
    tabXs.value = nextXs;
    tabWs.value = nextWs;
    // If this is the initially selected tab, sync position
    if (index === selectedIndex && underlineWidth.value === 0) {
      underlineX.value = x + containerPaddingHorizontal;
      underlineWidth.value = width;
    }
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setMeasuredWidth(width);
    pageWidth.value = width;
    // ensure scroll aligns with selected index on first measure
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: selectedIndex * width, animated: false });
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={[styles.container, style]} onLayout={onContainerLayout}>
      {/* Header section with tabs and borders */}
      <View style={styles.header}>
        <View style={styles.row}>
          {tabs.map((tab, index) => {
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  animateUnderlineTo(index);
                  onChange(tab.key, index);
                  if (measuredWidth && scrollRef.current) {
                    scrollRef.current.scrollTo({
                      x: index * measuredWidth,
                      animated: true,
                    });
                  }
                }}
                onLayout={(e) => onTabLayout(index, e)}
                style={styles.tab}
              >
                <Animated.Text
                  style={[
                    {
                      color: theme.text,
                      fontFamily: fontFamily.plusJakarta.medium,
                      fontSize: 16,
                    },
                    tabTextStyles[index],
                  ]}
                >
                  {tab.title}
                </Animated.Text>
              </Pressable>
            );
          })}
        </View>

        {/* Base bottom border placed under labels */}
        <View
          pointerEvents="none"
          // style={[styles.bottomBorder, { borderColor: theme.border }]}
        />

        {/* Animated selected underline under labels */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.underline,
            { backgroundColor: theme.text },
            underlineStyle,
          ]}
        />
      </View>

      {/* Swipeable pages filling remaining space */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const index = measuredWidth ? Math.round(x / measuredWidth) : 0;
          const key = tabs[index]?.key;
          if (key && key !== selectedKey) {
            onChange(key, index);
            animateTabOpacities(index);
          }
        }}
        contentContainerStyle={{
          width: measuredWidth * Math.max(1, tabs.length),
        }}
        style={styles.pages}
      >
        {pages.map((node, i) => (
          <View
            key={tabs[i]?.key ?? String(i)}
            style={{ width: measuredWidth, paddingHorizontal: 0 }}
          >
            {node}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
};

export default TabPager;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "red",

  },
  header: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
  },
  bottomBorder: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 0,
    borderBottomWidth: 1,
  },
  underline: {
    position: "absolute",
    height: 2,
    bottom: 0, // sits at the same vertical spot as the bottom border
    left: 0,
  },
  pages: {
    flex: 1,
  },
});
