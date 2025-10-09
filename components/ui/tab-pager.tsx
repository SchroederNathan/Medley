import React, { useContext, useMemo, useRef } from "react";
import {
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  runOnUI,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

const { width: ScreenWidth } = Dimensions.get("window");

// tab indicator component
type TabIndicatorProps = {
  activeTabIndex: SharedValue<number>;
  tabWidths: SharedValue<number[]>;
  tabOffsets: SharedValue<number[]>;
  tabBarOffsetX: SharedValue<number>;
};

const TabIndicator: React.FC<TabIndicatorProps> = ({
  activeTabIndex,
  tabWidths,
  tabOffsets,
  tabBarOffsetX,
}) => {
  const { theme } = useContext(ThemeContext);

  const rIndicatorStyle = useAnimatedStyle(() => {
    const left = interpolate(
      activeTabIndex.value,
      Object.keys(tabOffsets.value).map(Number),
      tabOffsets.value,
    );

    const width = interpolate(
      activeTabIndex.value,
      Object.keys(tabWidths.value).map(Number),
      tabWidths.value,
    );

    return {
      left,
      width,
      transform: [
        {
          translateX: -tabBarOffsetX.value,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.indicator,
        { backgroundColor: theme.text },
        rIndicatorStyle,
      ]}
    />
  );
};

// Hook for measuring tab layouts
const useMeasureFlatListTabsLayout = ({
  tabsLength,
  sidePadding,
  gap,
}: {
  tabsLength: number;
  sidePadding: number;
  gap: number;
}) => {
  const tabWidths = useSharedValue<number[]>(new Array(tabsLength).fill(0));

  const tabOffsets = useDerivedValue(() => {
    return tabWidths.value.reduce<number[]>((acc, _width, index) => {
      const previousX = index === 0 ? sidePadding : acc[index - 1];
      const previousWidth = index === 0 ? 0 : tabWidths.value[index - 1];
      acc[index] = previousX + previousWidth + (index === 0 ? 0 : gap);
      return acc;
    }, []);
  });

  return { tabWidths, tabOffsets };
};

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

// animated tab pager with smooth indicator
const TabPager = ({
  tabs,
  selectedKey,
  onChange,
  style,
  pages,
}: TabPagerProps) => {
  const { theme } = useContext(ThemeContext);
  const { width: windowWidth } = useWindowDimensions();

  // Layout constants for tab bar spacing and indicator calculations
  const TAB_BAR_GAP = 32;

  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        tabs.findIndex((t) => t.key === selectedKey),
      ),
    [tabs, selectedKey],
  );

  // Animated ref enables programmatic scrolling for tab centering
  const listAnimatedRef = useAnimatedRef<FlatList>();

  // Tracks horizontal scroll position for indicator transform compensation
  const tabBarOffsetX = useSharedValue(0);

  // Shared values coordinate smooth tab transitions during user press
  const pressStartIndex = useSharedValue<number>(0);
  const pressEndIndex = useSharedValue<number | null>(null);

  // Create a shared value for the current tab index (fractional during swipes)
  const indexDecimal = useSharedValue(selectedIndex);

  // Update indexDecimal when selectedKey changes
  React.useEffect(() => {
    indexDecimal.value = selectedIndex;
  }, [selectedIndex]);

  // Worklet-optimized scroll handler tracks horizontal offset for indicator positioning
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      tabBarOffsetX.value = event.contentOffset.x;
    },
  });

  // Dynamic measurement system calculates tab positions and widths for responsive indicator
  const { tabWidths, tabOffsets } = useMeasureFlatListTabsLayout({
    tabsLength: tabs.length,
    sidePadding: 0,
    gap: TAB_BAR_GAP,
  });

  // Smart tab centering algorithm with smooth interpolation
  useDerivedValue(() => {
    "worklet";
    // Calculate center point of each tab for centering calculations
    const tabsCenter = tabs.map(
      (_, index) => tabOffsets.value[index] + tabWidths.value[index] / 2,
    );

    // Find first tab that can be centered (has enough space on left)
    const firstTabIndexCanBeCentered = tabs.findIndex(
      (_, index) => tabsCenter[index] > windowWidth / 2,
    );

    // Build output range: 0 for edge tabs, center-offset for others
    const outputRange = tabsCenter.map((center, index) => {
      if (index < firstTabIndexCanBeCentered) {
        return 0;
      }
      return center - windowWidth / 2;
    });

    // Handle user-initiated tab press with smooth transition
    if (pressEndIndex.value !== null) {
      const startIndex = pressStartIndex.value;
      const targetIndex = pressEndIndex.value;
      const inputRange = [startIndex, targetIndex];
      const output = [outputRange[startIndex], outputRange[targetIndex]];
      const offsetX = interpolate(indexDecimal.value, inputRange, output);
      scrollTo(listAnimatedRef, offsetX, 0, false);

      // Reset press state when transition completes
      if (indexDecimal.value === targetIndex) {
        pressEndIndex.value = null;
      }
    } else {
      // Normal scroll synchronization with tab view paging
      const offsetX = interpolate(
        indexDecimal.value,
        Object.keys(tabs).map(Number),
        outputRange,
      );
      scrollTo(listAnimatedRef, offsetX, 0, false);
    }
  });

  // Page scroll handling
  const [measuredWidth, setMeasuredWidth] = React.useState(0);
  const scrollRef = useRef<any>(null);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setMeasuredWidth(ScreenWidth);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        x: selectedIndex * ScreenWidth,
        animated: false,
      });
    }
  };

  const pageScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x;
      if (measuredWidth > 0) {
        const progress = x / measuredWidth;
        indexDecimal.value = progress;
      }
    },
  });

  // Tab item renderer with press handling and layout measurement
  const renderTabItem = ({ item, index }: { item: TabItem; index: number }) => {
    const onPress = () => {
      // Update shared values on UI thread for smooth transition coordination
      runOnUI(() => {
        "worklet";
        pressEndIndex.value = index;
        pressStartIndex.value = indexDecimal.value;
      })();
      onChange(item.key, index);
      if (measuredWidth && scrollRef.current) {
        scrollRef.current.scrollTo({
          x: index * measuredWidth,
          animated: true,
        });
      }
    };

    return (
      <TouchableOpacity
        key={item.key}
        onPress={onPress}
        style={styles.tab}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          tabWidths.modify((value) => {
            "worklet";
            value[index] = width;
            return value;
          });
        }}
      >
        <Text
          style={{
            color: theme.text,
            fontFamily: fontFamily.tanker.regular,
            fontSize: 20,
            letterSpacing: 0.3,
          }}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]} onLayout={onContainerLayout}>
      {/* Header section with tabs and indicator */}
      <View style={styles.header}>
        {/* Reanimated.FlatList enables worklet-optimized scroll handling */}
        <Animated.FlatList
          ref={listAnimatedRef}
          data={tabs}
          keyExtractor={(item) => item.key}
          renderItem={renderTabItem}
          horizontal
          contentContainerStyle={{
            gap: TAB_BAR_GAP,
          }}
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
        {/* Positioned below tabs for proper layering */}
        <TabIndicator
          activeTabIndex={indexDecimal}
          tabWidths={tabWidths}
          tabOffsets={tabOffsets}
          tabBarOffsetX={tabBarOffsetX}
        />
      </View>

      {/* Swipeable pages filling remaining space */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={pageScrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const index = measuredWidth ? Math.round(x / measuredWidth) : 0;
          const key = tabs[index]?.key;
          if (key && key !== selectedKey) {
            onChange(key, index);
          }
        }}
        contentContainerStyle={{
          width: measuredWidth * Math.max(1, tabs.length),
          paddingHorizontal: 20,
        }}
        style={styles.pages}
      >
        {pages.map((node, i) => (
          <View key={tabs[i]?.key ?? String(i)} style={{ width: ScreenWidth }}>
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
  },
  header: {
    position: "relative",
    marginHorizontal: 20,
  },
  tab: {
    paddingBottom: 8,
  },
  indicator: {
    position: "absolute",
    height: 2.5,
    bottom: 0,
    left: 0,
    borderRadius: 2.5,
  },
  pages: {
    flex: 1,
    overflow: "visible",
  },
});
