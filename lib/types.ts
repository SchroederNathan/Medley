import { TextStyle as RNTextStyle } from "react-native";

// Custom font family type
export type CustomFontFamily =
  | "PlusJakartaSans-Regular"
  | "PlusJakartaSans-Medium"
  | "PlusJakartaSans-SemiBold"
  | "PlusJakartaSans-Bold"
  | "PlusJakartaSans-ExtraBold"
  | "PlusJakartaSans-Light"
  | "PlusJakartaSans-ExtraLight"
  | "PlusJakartaSans-Italic"
  | "PlusJakartaSans-MediumItalic"
  | "PlusJakartaSans-SemiBoldItalic"
  | "PlusJakartaSans-BoldItalic"
  | "PlusJakartaSans-ExtraBoldItalic"
  | "PlusJakartaSans-LightItalic"
  | "PlusJakartaSans-ExtraLightItalic"
  | "Tanker-Regular"
  | "BespokeSerif-Regular"
  | "BespokeSerif-Italic"
  | "BespokeSerif-Light"
  | "BespokeSerif-LightItalic"
  | "BespokeSerif-Medium"
  | "BespokeSerif-MediumItalic"
  | "BespokeSerif-Bold"
  | "BespokeSerif-BoldItalic"
  | "BespokeSerif-Extrabold"
  | "BespokeSerif-ExtraboldItalic";

// Extended TextStyle with custom font support
export type TextStyle = RNTextStyle & {
  fontFamily?: CustomFontFamily | (string & {});
};
