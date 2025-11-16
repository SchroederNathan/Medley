import React, { useContext } from "react";
import {
  DimensionValue,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface SegmentedPickerProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  /**
   * Optional fixed width for the whole control.
   * If not provided, it will size to its content / parent constraints.
   */
  width?: DimensionValue;
  /**
   * Height of the control.
   */
  height?: number;
  style?: ViewStyle;
}

const SegmentedPicker = ({
  items,
  value,
  onChange,
  width = "100%",
  height = 40,
  style,
}: SegmentedPickerProps) => {
  const { theme } = useContext(ThemeContext);

  const containerWidth = useSharedValue(0);

  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item === value)
  );

  // Keep track of animated index for smooth thumb transitions
  const animatedIndex = useSharedValue(selectedIndex);

  // Sync animated index when `value` changes externally
  useDerivedValue(() => {
    animatedIndex.value = withTiming(selectedIndex, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [selectedIndex]);

  const itemCount = items.length;
  const clampedCount = Math.min(Math.max(itemCount, 1), 5);

  // Padding between thumb and container edges
  const THUMB_PADDING = 4;

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
  };

  const thumbStyle = useAnimatedStyle(() => {
    const width = containerWidth.value;
    const count = clampedCount || 1;

    if (!width) {
      return {
        width: 0,
        transform: [{ translateX: 0 }],
      };
    }

    const segmentWidth = width / count;
    const clampedIndex = Math.max(0, Math.min(animatedIndex.value, count - 1));

    return {
      width: segmentWidth - THUMB_PADDING * 2,
      top: THUMB_PADDING,
      bottom: THUMB_PADDING,
      transform: [{ translateX: clampedIndex * segmentWidth + THUMB_PADDING }],
    };
  });

  return (
    <View style={[{ width, height }, style]}>
      <Animated.View
        onLayout={handleLayout}
        style={[
          styles.container,
          {
            borderColor: theme.border,
            backgroundColor: theme.inputBackground,
          },
        ]}
      >
        {/* Thumb */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              borderRadius: styles.container.borderRadius,
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
            thumbStyle,
          ]}
        />

        {/* Segments */}
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;

          const labelColor = isSelected ? theme.text : theme.secondaryText;

          return (
            <Pressable
              key={item}
              style={styles.segment}
              onPress={() => {
                if (!isSelected) {
                  onChange(item);
                }
              }}
            >
              <Animated.Text
                numberOfLines={1}
                style={[styles.label, { fontSize: 12, color: labelColor }]}
              >
                {item}
              </Animated.Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
};

export default SegmentedPicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
    borderCurve: "continuous",
    boxShadow: "rgba(10,10, 10, 0.5) 0 0 12px 0px inset",
  },
  thumb: {
    position: "absolute",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderCurve: "continuous",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: fontFamily.plusJakarta.medium,
  },
});
