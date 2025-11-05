import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Font file paths
export const fontAssets = {
  // Plus Jakarta Sans fonts
  "PlusJakartaSans-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
  "PlusJakartaSans-BoldItalic": require("../assets/fonts/PlusJakartaSans-BoldItalic.ttf"),
  "PlusJakartaSans-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
  "PlusJakartaSans-ExtraBoldItalic": require("../assets/fonts/PlusJakartaSans-ExtraBoldItalic.ttf"),
  "PlusJakartaSans-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
  "PlusJakartaSans-ExtraLightItalic": require("../assets/fonts/PlusJakartaSans-ExtraLightItalic.ttf"),
  "PlusJakartaSans-Italic": require("../assets/fonts/PlusJakartaSans-Italic.ttf"),
  "PlusJakartaSans-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  "PlusJakartaSans-LightItalic": require("../assets/fonts/PlusJakartaSans-LightItalic.ttf"),
  "PlusJakartaSans-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
  "PlusJakartaSans-MediumItalic": require("../assets/fonts/PlusJakartaSans-MediumItalic.ttf"),
  "PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
  "PlusJakartaSans-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  "PlusJakartaSans-SemiBoldItalic": require("../assets/fonts/PlusJakartaSans-SemiBoldItalic.ttf"),
  // Tanker font
  "Tanker-Regular": require("../assets/fonts/Tanker-Regular.otf"),
  // BespokeSerif fonts
  "BespokeSerif-Regular": require("../assets/fonts/BespokeSerif-Regular.otf"),
  "BespokeSerif-Italic": require("../assets/fonts/BespokeSerif-Italic.otf"),
  "BespokeSerif-Light": require("../assets/fonts/BespokeSerif-Light.otf"),
  "BespokeSerif-LightItalic": require("../assets/fonts/BespokeSerif-LightItalic.otf"),
  "BespokeSerif-Medium": require("../assets/fonts/BespokeSerif-Medium.otf"),
  "BespokeSerif-MediumItalic": require("../assets/fonts/BespokeSerif-MediumItalic.otf"),
  "BespokeSerif-Bold": require("../assets/fonts/BespokeSerif-Bold.otf"),
  "BespokeSerif-BoldItalic": require("../assets/fonts/BespokeSerif-BoldItalic.otf"),
  "BespokeSerif-Extrabold": require("../assets/fonts/BespokeSerif-Extrabold.otf"),
  "BespokeSerif-ExtraboldItalic": require("../assets/fonts/BespokeSerif-ExtraboldItalic.otf"),
};

// Custom font family names for easier usage
export const fontFamily = {
  plusJakarta: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semiBold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    extraBold: "PlusJakartaSans-ExtraBold",
    light: "PlusJakartaSans-Light",
    extraLight: "PlusJakartaSans-ExtraLight",
    italic: "PlusJakartaSans-Italic",
    mediumItalic: "PlusJakartaSans-MediumItalic",
    semiBoldItalic: "PlusJakartaSans-SemiBoldItalic",
    boldItalic: "PlusJakartaSans-BoldItalic",
    extraBoldItalic: "PlusJakartaSans-ExtraBoldItalic",
    lightItalic: "PlusJakartaSans-LightItalic",
    extraLightItalic: "PlusJakartaSans-ExtraLightItalic",
  },
  bespokeSerif: {
    regular: "BespokeSerif-Regular",
    italic: "BespokeSerif-Italic",
    light: "BespokeSerif-Light",
    lightItalic: "BespokeSerif-LightItalic",
    medium: "BespokeSerif-Medium",
    mediumItalic: "BespokeSerif-MediumItalic",
    bold: "BespokeSerif-Bold",
    boldItalic: "BespokeSerif-BoldItalic",
    extrabold: "BespokeSerif-Extrabold",
    extraboldItalic: "BespokeSerif-ExtraboldItalic",
  },
  tanker: {
    regular: "Tanker-Regular",
  },
};

// Hook to load fonts with splash screen
export const useAppFonts = () => {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  return {
    fontsLoaded: loaded,
    fontError: error,
    isLoading: !loaded && !error,
  };
};

// Import type from types.ts for consistency
export { CustomFontFamily as FontFamilyName } from "./types";
