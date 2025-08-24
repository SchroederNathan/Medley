import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { themes } from "../constants/colors";

export const ThemeContext = createContext({
  theme: themes.light,
  themeMode: "system", // "system", "light", or "dark"
  toggleTheme: () => {},
  updateThemeMode: (mode: string) => {},
});

const THEME_STORAGE_KEY = "@app_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState("system");
  const [theme, setTheme] = useState(() =>
    themes[(systemColorScheme || "light") as keyof typeof themes]
  );

  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Update theme when system color scheme changes and we're in system mode
  useEffect(() => {
    if (themeMode === "system" && systemColorScheme) {
      setTheme(themes[systemColorScheme as keyof typeof themes]);
    }
  }, [systemColorScheme, themeMode]);

  const loadSavedTheme = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      console.log('Loading saved theme mode:', savedThemeMode);
      console.log('System color scheme:', systemColorScheme);

      if (savedThemeMode) {
        setThemeMode(savedThemeMode);
        if (savedThemeMode === "system") {
          const selectedTheme = themes[(systemColorScheme || "light") as keyof typeof themes];
          console.log('Setting system theme:', selectedTheme);
          setTheme(selectedTheme);
        } else {
          const selectedTheme = themes[savedThemeMode as keyof typeof themes];
          console.log('Setting manual theme:', selectedTheme);
          setTheme(selectedTheme);
        }
      } else {
        // Default to system mode if no saved preference
        console.log('No saved theme, defaulting to system mode');
        setThemeMode("system");
        const defaultTheme = themes[(systemColorScheme || "light") as keyof typeof themes];
        console.log('Setting default theme:', defaultTheme);
        setTheme(defaultTheme);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === themes.light ? themes.dark : themes.light;
    setTheme(newTheme);
    const newThemeMode = newTheme === themes.light ? "light" : "dark";
    setThemeMode(newThemeMode); // Override system mode when user manually toggles
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeMode);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const updateThemeMode = async (mode: string) => {
    setThemeMode(mode);
    if (mode === "system") {
      setTheme(themes[(systemColorScheme || "light") as keyof typeof themes]);
    } else {
      setTheme(themes[mode as keyof typeof themes]);
    }
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, updateThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
