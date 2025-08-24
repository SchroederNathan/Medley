import { BlurView } from "expo-blur";
import React, { useContext } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface InputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  otherProps?: TextInputProps;
}

const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  ...otherProps
}: InputProps) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={[styles.inputContainer, { borderColor: theme.inputBorder }]}>
      <BlurView
        intensity={20}
        tint="default"
        style={[styles.blurView, { backgroundColor: theme.inputBackground }]}
      >
        <TextInput
          style={[styles.inputText, { color: theme.inputText }]}
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholderText}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          {...otherProps}
        />
      </BlurView>
    </View>
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
});
