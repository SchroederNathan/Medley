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

  // Animation values
  const labelScale = useSharedValue(1);
  const labelTranslateY = useSharedValue(0);
  const labelTranslateX = useSharedValue(0);
  const labelOpacity = useSharedValue(0.6);
  const multilineLabelScale = useSharedValue(1);
  const multilineLabelTranslateY = useSharedValue(0);
  const multilineLabelTranslateX = useSharedValue(0);
  const multilineLabelOpacity = useSharedValue(0.6);

  const isActive = isFocused || (value && value.length > 0);

  const handlePress = () => {
    textInputRef.current?.focus();
  };

  const handleContentSizeChange = (event: any) => {
    if (multiline) {
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, event.nativeEvent.contentSize.height + 16),
      );
      setContentHeight(newHeight);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    labelScale.value = withSpring(0.8);
    labelTranslateY.value = withSpring(-18);
    labelTranslateX.value = withSpring(-15);
    labelOpacity.value = withTiming(1, { duration: 100 });
  };

  const handleMultilineFocus = () => {
    setIsFocused(true);
    multilineLabelScale.value = withSpring(0.8);
    multilineLabelTranslateY.value = withSpring(-18);
    multilineLabelTranslateX.value = withSpring(-10);
    multilineLabelOpacity.value = withTiming(1, { duration: 100 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value || value.length === 0) {
      labelScale.value = withSpring(1);
      labelTranslateY.value = withSpring(0);
      labelTranslateX.value = withSpring(0);
      labelOpacity.value = withTiming(0.6, { duration: 100 });
      multilineLabelScale.value = withSpring(1);
      multilineLabelTranslateY.value = withSpring(0);
      multilineLabelTranslateX.value = withSpring(0);
      multilineLabelOpacity.value = withTiming(0.6, { duration: 100 });
    }
  };

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: labelScale.value },
        { translateY: labelTranslateY.value },
        { translateX: labelTranslateX.value },
      ],
      opacity: labelOpacity.value,
    };
  });

  const animatedMultilineLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: multilineLabelScale.value },
        { translateY: multilineLabelTranslateY.value },
        { translateX: multilineLabelTranslateX.value },
      ],
      opacity: multilineLabelOpacity.value,
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
      <BlurView intensity={20} tint="default" style={blurViewStyle}>
        {placeholder && (
          <Animated.Text
            style={[
              styles.floatingLabel,
              multiline && styles.multilineFloatingLabel,
              { color: theme.inputPlaceholderText },
              multiline ? animatedMultilineLabelStyle : animatedLabelStyle,
            ]}
          >
            {placeholder}
          </Animated.Text>
        )}
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
              {/* Dark tint matches app theme; actual blur amount is handled externally when needed. */}
              <BlurView tint="dark" style={StyleSheet.absoluteFill} />
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
          onFocus={multiline ? handleMultilineFocus : handleFocus}
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
    left: 16,
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.medium,
    zIndex: 3,
  },
  multilineInputText: {
    textAlignVertical: "top",
    paddingTop: 24,
    paddingBottom: 8,
  },
  multilineFloatingLabel: {
    top: 19,
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
