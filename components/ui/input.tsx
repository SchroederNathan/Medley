import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useRef, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface InputProps extends TextInputProps {
  placeholder?: string;
  value?: string;
  style?: StyleProp<ViewStyle>;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  multiline = false,
  minHeight = 60,
  maxHeight = 200,
  style,
  ...otherProps
}: InputProps) => {
  const { theme } = useContext(ThemeContext);
  const textInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);

  // Constants for consistent positioning - all in pixels, no percentages
  const BLUR_VIEW_PADDING_LEFT = 16;
  const INPUT_TEXT_PADDING_TOP = 8;
  const FLOATING_PADDING_TOP = 6; // Exactly 4px from container top edge

  // Font sizes
  const INITIAL_FONT_SIZE = 16;
  const FLOATING_FONT_SIZE = 12; // Smaller font when floating

  // Animation values - only vertical translation and fontSize
  const labelTranslateY = useSharedValue(0);
  const labelFontSize = useSharedValue(INITIAL_FONT_SIZE);
  const labelOpacity = useSharedValue(0.6);

  const isActive = isFocused || (value && value.length > 0);

  // Calculate initial vertical position
  // For single-line: center vertically to match TextInput text (BlurView centers content)
  // For multiline: use padding top
  const initialLabelLeft = BLUR_VIEW_PADDING_LEFT; // Aligned with text input start
  const initialLabelTop = multiline
    ? INPUT_TEXT_PADDING_TOP // Multiline: top-aligned with padding
    : minHeight / 2 - INITIAL_FONT_SIZE / 2 - 6; // Single-line: vertically centered with slight upward adjustment

  // Floating position: translate up, keep same left position
  const floatingLabelTop = FLOATING_PADDING_TOP; // 4px from container top
  const translateYOffset = floatingLabelTop - initialLabelTop; // How much to move up

  const handlePress = () => {
    textInputRef.current?.focus();
  };

  const handleContentSizeChange = (event: any) => {
    if (multiline) {
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, event.nativeEvent.contentSize.height + 16)
      );
      setContentHeight(newHeight);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Translate up only, no horizontal movement
    labelTranslateY.value = withSpring(translateYOffset);
    // Reduce font size (not scale)
    labelFontSize.value = withSpring(FLOATING_FONT_SIZE);
    labelOpacity.value = withTiming(1, { duration: 100 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value || value.length === 0) {
      // Return to initial position
      labelTranslateY.value = withSpring(0);
      labelFontSize.value = withSpring(INITIAL_FONT_SIZE);
      labelOpacity.value = withTiming(0.6, { duration: 100 });
    }
  };

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: labelTranslateY.value }],
      fontSize: labelFontSize.value,
      opacity: labelOpacity.value,
    };
  });

  const containerStyle = [
    styles.inputContainer,
    { borderColor: theme.inputBorder },
    multiline && { height: contentHeight },
    style,
  ];

  const blurViewStyle = [
    styles.blurView,
    { backgroundColor: theme.inputBackground },
    multiline && { height: contentHeight },
  ];

  const inputTextStyle = [
    styles.inputText,
    { color: theme.inputText },
    multiline && styles.multilineInputText,
  ];

  return (
    <Pressable style={containerStyle} onPress={handlePress}>
      {placeholder && (
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              color: theme.inputPlaceholderText,
              top: initialLabelTop,
              left: initialLabelLeft,
            },
            animatedLabelStyle,
          ]}
        >
          {placeholder}
        </Animated.Text>
      )}
      <BlurView intensity={20} tint="default" style={blurViewStyle}>
        {multiline && placeholder && (
          <View style={styles.gradientContainer}>
            <MaskedView
              maskElement={
                <LinearGradient
                  locations={[0.5, 1]}
                  colors={["black", "transparent"]}
                  style={StyleSheet.absoluteFill}
                />
              }
              style={[StyleSheet.absoluteFill]}
            >
              <LinearGradient
                locations={[0.5, 1]}
                colors={["rgba(10, 10, 10, 0.5)", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              {/* Dark tint matches app theme; actual blur amount is handled externally when needed. */}
              <BlurView tint="dark" style={[StyleSheet.absoluteFill]} />
            </MaskedView>
          </View>
        )}
        <TextInput
          ref={textInputRef}
          style={inputTextStyle}
          placeholder={isActive ? "" : placeholder}
          placeholderTextColor="transparent"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          onContentSizeChange={handleContentSizeChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...otherProps}
        />
      </BlurView>
    </Pressable>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: "rgba(204, 219, 232, 0.01) 0 1px 8px 0 inset",
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  inputText: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    width: "100%",
    height: "100%",
    paddingTop: 8,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  floatingLabel: {
    position: "absolute",
    fontFamily: fontFamily.plusJakarta.medium,
    zIndex: 3,
  },
  multilineInputText: {
    textAlignVertical: "top",
    paddingTop: 24,
    paddingBottom: 8,
  },
  gradientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 2,
    pointerEvents: "none",
  },
});
