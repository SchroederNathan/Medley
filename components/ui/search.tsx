import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { X as ClearIcon, Search as SearchIcon } from "lucide-react-native";
import React, { useContext, useRef } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface SearchProps extends TextInputProps {
  placeholder?: string;
  value?: string;
  style?: StyleProp<ViewStyle>;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
}

const Search = ({
  placeholder = "Search",
  value,
  onChangeText,
  onClear,
  style,
  returnKeyType = "search",
  autoCapitalize = "none",
  autoCorrect = false,
  ...otherProps
}: SearchProps) => {
  const { theme } = useContext(ThemeContext);
  const textInputRef = useRef<TextInput>(null);

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // Animated style for the scale transformation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleClear = () => {
    onChangeText && onChangeText("");
    onClear && onClear();
  };

  const handleContainerPress = () => {
    textInputRef.current?.focus();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: theme.inputBorder },
        animatedStyle,
        style,
      ]}
    >
      <TouchableOpacity
        onPressIn={() => {
          scale.value = withSpring(0.95);
          Haptics.selectionAsync();
          handleContainerPress();
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        activeOpacity={1}
        style={styles.touchableContent}
      >
        <BlurView
          intensity={20}
          tint="default"
          style={[styles.blurView, { backgroundColor: theme.inputBackground }]}
        >
          <SearchIcon size={18} color={theme.inputPlaceholderText} />
          <TextInput
            ref={textInputRef}
            style={[styles.inputText, { color: theme.inputText }]}
            placeholder={placeholder}
            placeholderTextColor={theme.inputPlaceholderText}
            value={value}
            onChangeText={onChangeText}
            returnKeyType={returnKeyType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            clearButtonMode="never"
            onPressIn={() => {
              scale.value = withSpring(0.95);
              Haptics.selectionAsync();
            }}
            onPressOut={() => {
              scale.value = withSpring(1, {
                damping: 40,
                stiffness: 300,
              });
            }}
            {...otherProps}
          />
          {Boolean(value && value.length > 0) && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ClearIcon size={16} color={theme.inputPlaceholderText} />
            </TouchableOpacity>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: -32,
    right: -32,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  touchableContent: {
    width: "100%",
    height: "100%",
  },
});
