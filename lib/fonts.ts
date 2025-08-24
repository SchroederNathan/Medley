import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Font file paths
export const fontAssets = {
  // Plus Jakarta Sans fonts
  'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  'PlusJakartaSans-BoldItalic': require('../assets/fonts/PlusJakartaSans-BoldItalic.ttf'),
  'PlusJakartaSans-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  'PlusJakartaSans-ExtraBoldItalic': require('../assets/fonts/PlusJakartaSans-ExtraBoldItalic.ttf'),
  'PlusJakartaSans-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
  'PlusJakartaSans-ExtraLightItalic': require('../assets/fonts/PlusJakartaSans-ExtraLightItalic.ttf'),
  'PlusJakartaSans-Italic': require('../assets/fonts/PlusJakartaSans-Italic.ttf'),
  'PlusJakartaSans-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  'PlusJakartaSans-LightItalic': require('../assets/fonts/PlusJakartaSans-LightItalic.ttf'),
  'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
  'PlusJakartaSans-MediumItalic': require('../assets/fonts/PlusJakartaSans-MediumItalic.ttf'),
  'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
  'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  'PlusJakartaSans-SemiBoldItalic': require('../assets/fonts/PlusJakartaSans-SemiBoldItalic.ttf'),
  // Tanker font
  'Tanker-Regular': require('../assets/fonts/Tanker-Regular.otf'),
};

// Custom font family names for easier usage
export const fontFamily = {
  plusJakarta: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extraBold: 'PlusJakartaSans-ExtraBold',
    light: 'PlusJakartaSans-Light',
    extraLight: 'PlusJakartaSans-ExtraLight',
    italic: 'PlusJakartaSans-Italic',
    mediumItalic: 'PlusJakartaSans-MediumItalic',
    semiBoldItalic: 'PlusJakartaSans-SemiBoldItalic',
    boldItalic: 'PlusJakartaSans-BoldItalic',
    extraBoldItalic: 'PlusJakartaSans-ExtraBoldItalic',
    lightItalic: 'PlusJakartaSans-LightItalic',
    extraLightItalic: 'PlusJakartaSans-ExtraLightItalic',
  },
  tanker: {
    regular: 'Tanker-Regular',
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
export { CustomFontFamily as FontFamilyName } from './types';
