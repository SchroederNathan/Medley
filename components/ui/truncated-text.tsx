import React, { FC, useEffect, useState } from "react";
import {
  Pressable,
  TextLayoutLine,
  Text,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type TruncatedTextProps = {
  text: string;
  numberOfLines?: number; // Maximum lines to show in truncated state
  textStyle?: object; // Style for the text
  containerStyle?: object; // Style for the container
  animated?: boolean; // Whether to use animated layout transitions
  backgroundColor?: string; // Background color for gradient fade (defaults to transparent)
};

export const TruncatedText: FC<TruncatedTextProps> = ({
  text,
  numberOfLines = 2,
  textStyle,
  containerStyle,
  animated = true,
  backgroundColor = "transparent",
}) => {
  // TextLayoutLine array contains precise text measurement data for each line
  // Enables accurate truncation without guessing character counts
  const [lines, setLines] = useState<TextLayoutLine[]>([]);
  const [fullHeight, setFullHeight] = useState<number>(0);
  const [truncatedHeight, setTruncatedHeight] = useState<number>(0);

  // Controls expand/collapse state - starts truncated for Instagram-style UX
  const [isTruncated, setIsTruncated] = useState<boolean>(true);

  // Animated value for height
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    // Reset layout measurements when text prop changes
    // Forces onTextLayout to recalculate line breaks for new content
    if (lines.length > 0) {
      setLines([]);
      setFullHeight(0);
      setTruncatedHeight(0);
      setIsTruncated(true);
      animatedHeight.value = 0;
    }
  }, [text]);

  useEffect(() => {
    // Update animated height when truncation state or measurements change
    if (truncatedHeight > 0 && fullHeight > 0) {
      const targetHeight = isTruncated ? truncatedHeight : fullHeight;
      if (animated) {
        animatedHeight.value = withSpring(targetHeight);
      } else {
        animatedHeight.value = targetHeight;
      }
    }
  }, [isTruncated, truncatedHeight, fullHeight, animated, animatedHeight]);

  const Container = animated ? Animated.View : View;
  const showGradient = isTruncated && lines.length > numberOfLines;

  // Animated style for height
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      overflow: "hidden" as const,
    };
  });

  // Convert color to rgba for gradient
  const getGradientColors = () => {
    if (backgroundColor === "transparent") {
      return ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"];
    }

    // If already rgba format, extract and reuse
    if (backgroundColor.startsWith("rgba(")) {
      const rgbaMatch = backgroundColor.match(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/,
      );
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch;
        return [`rgba(${r}, ${g}, ${b}, 0)`, `rgba(${r}, ${g}, ${b}, 1)`];
      }
    }

    // Parse hex color and convert to rgba
    const hex = backgroundColor.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [`rgba(${r}, ${g}, ${b}, 0)`, `rgba(${r}, ${g}, ${b}, 1)`];
    }

    // Fallback to transparent if parsing fails
    return ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"];
  };

  return (
    <Container style={containerStyle}>
      {/* Entire description area is pressable for Instagram-style expand/collapse */}
      <Pressable onPress={() => setIsTruncated(!isTruncated)}>
        <Animated.View
          style={[
            styles.textContainer,
            animated ? animatedContainerStyle : { overflow: "hidden" },
          ]}
        >
          {/* Hidden measurement text - gets precise line break data without visual impact */}
          <Text
            style={[styles.measurementText, textStyle]}
            onTextLayout={(e) => {
              // Only measure once to prevent infinite re-renders
              if (lines.length === 0) {
                const measuredLines = e.nativeEvent.lines;
                setLines(measuredLines);

                // Calculate heights from measured lines
                const calculateHeight = (lineCount: number) => {
                  if (measuredLines.length === 0) return 0;
                  const visibleLines = measuredLines.slice(0, lineCount);
                  if (visibleLines.length === 0) return 0;

                  // Get the last line's bottom position
                  const lastLine = visibleLines[visibleLines.length - 1];
                  return lastLine.y + lastLine.height;
                };

                const full = calculateHeight(measuredLines.length);
                const truncated = calculateHeight(numberOfLines);
                setFullHeight(full);
                setTruncatedHeight(truncated);

                // Set initial height
                animatedHeight.value = truncated;
              }
            }}
          >
            {text}
          </Text>

          {/* Render all text lines - container height controls visibility */}
          {lines.map((line, index) => (
            <TruncatedTextLine key={index} line={line} textStyle={textStyle} />
          ))}

          {/* Gradient fade overlay - only shown when truncated */}
          {showGradient && (
            <Animated.View
              entering={animated ? FadeIn.duration(200) : undefined}
              exiting={animated ? FadeOut.duration(200) : undefined}
              style={styles.gradientOverlay}
              pointerEvents="none"
            >
              <LinearGradient
                style={StyleSheet.absoluteFill}
                colors={getGradientColors()}
                locations={[0, 1]}
                pointerEvents="none"
              />
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Container>
  );
};

type TruncatedTextLineProps = {
  line: TextLayoutLine; // Contains text, width, height, x, y measurements
  textStyle?: object; // Style for the text
};

const TruncatedTextLine: FC<TruncatedTextLineProps> = ({ line, textStyle }) => {
  // Standard line rendering - uses precise TextLayoutLine.text to maintain exact line breaks
  // Layout animation is handled by the parent TextContainer
  return <Text style={textStyle}>{line.text.trim()}</Text>;
};

const styles = StyleSheet.create({
  textContainer: {
    position: "relative",
  },
  measurementText: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    pointerEvents: "none",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40, // Height of the gradient fade
  },
});
