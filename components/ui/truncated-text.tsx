import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React, { FC, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextLayoutLine,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type TruncatedTextProps = {
  text: string;
  numberOfLines?: number; // Maximum lines to show in truncated state
  textStyle?: object; // Style for the text
  containerStyle?: object; // Style for the container
  animated?: boolean; // Whether to use animated layout transitions
};

export const TruncatedText: FC<TruncatedTextProps> = ({
  text,
  numberOfLines = 2,
  textStyle,
  containerStyle,
  animated = true,
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
  const prevTextRef = useRef(text);

  useEffect(() => {
    // Reset layout measurements when text prop changes
    // Forces onTextLayout to recalculate line breaks for new content
    if (prevTextRef.current !== text && lines.length > 0) {
      setLines([]);
      setFullHeight(0);
      setTruncatedHeight(0);
      setIsTruncated(true);
      animatedHeight.value = 0;
      prevTextRef.current = text;
    }
  }, [text, lines.length, animatedHeight]);

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
  const showMask = isTruncated && lines.length > numberOfLines;

  // Animated style for height
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      overflow: "hidden" as const,
    };
  });

  return (
    <Container style={containerStyle}>
      {/* Entire description area is pressable for Instagram-style expand/collapse */}
      <Pressable
        style={styles.pressable}
        onPress={() => setIsTruncated(!isTruncated)}
      >
        <Animated.View
          style={[
            styles.textContainer,
            // Only apply height constraint after measurement completes
            lines.length > 0 && animated
              ? animatedContainerStyle
              : lines.length > 0
                ? { overflow: "hidden" }
                : undefined,
          ]}
        >
          <MaskedView
            style={styles.maskedView}
            maskElement={
              <LinearGradient
                style={StyleSheet.absoluteFill}
                colors={
                  showMask
                    ? [
                        "black",
                        "rgba(0, 0, 0, 0.9)",
                        "rgba(0, 0, 0, 0.7)",
                        "rgba(0, 0, 0, 0.3)",
                        "transparent",
                      ]
                    : ["black", "black", "black"]
                }
                locations={showMask ? [0, 0.5, 0.7, 0.85, 1] : [0, 0.5, 1]}
              />
            }
          >
            {/* Render text - fallback does measurement, then switches to line-by-line */}
            {lines.length > 0 ? (
              lines.map((line, index) => (
                <TruncatedTextLine
                  key={index}
                  line={line}
                  textStyle={textStyle}
                />
              ))
            ) : (
              // Fallback text - visible AND measures layout in one element
              <Text
                style={textStyle}
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
            )}
          </MaskedView>
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
  pressable: {
    flex: 1,
  },
  textContainer: {
    position: "relative",
    flex: 1,
  },
  maskedView: {
    width: "100%",
    height: "100%",
  },
});
