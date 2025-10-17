import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { themes } from "../constants/colors";

export const ThemeContext = createContext({
  theme: themes.dark,
  themeMode: "system", // "system", "light", or "dark"
  toggleTheme: () => {},
  updateThemeMode: (mode: string) => {},
});

const THEME_STORAGE_KEY = "@app_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState("system");
  const [theme, setTheme] = useState(
    () => themes[(systemColorScheme || "light") as keyof typeof themes],
  );

  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Update theme when system color scheme changes and we're in system mode
  useEffect(() => {
    if (themeMode === "system" && systemColorScheme) {
      const newTheme = themes[systemColorScheme as keyof typeof themes];
      // Only update if the theme actually changed to prevent unnecessary re-renders
      setTheme((currentTheme) =>
        currentTheme === newTheme ? currentTheme : newTheme,
      );
    }
  }, [systemColorScheme, themeMode]);

  const loadSavedTheme = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      if (savedThemeMode) {
        setThemeMode(savedThemeMode);
        if (savedThemeMode === "system") {
          const selectedTheme =
            themes[(systemColorScheme || "light") as keyof typeof themes];
          setTheme((currentTheme) =>
            currentTheme === selectedTheme ? currentTheme : selectedTheme,
          );
        } else {
          const selectedTheme = themes[savedThemeMode as keyof typeof themes];
          setTheme((currentTheme) =>
            currentTheme === selectedTheme ? currentTheme : selectedTheme,
          );
        }
      } else {
        // Default to system mode if no saved preference
        setThemeMode("system");
        const defaultTheme =
          themes[(systemColorScheme || "light") as keyof typeof themes];
        setTheme((currentTheme) =>
          currentTheme === defaultTheme ? currentTheme : defaultTheme,
        );
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === themes.light ? themes.dark : themes.light;
    setTheme((currentTheme) =>
      currentTheme === newTheme ? currentTheme : newTheme,
    );
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
      const newTheme =
        themes[(systemColorScheme || "light") as keyof typeof themes];
      setTheme((currentTheme) =>
        currentTheme === newTheme ? currentTheme : newTheme,
      );
    } else {
      const newTheme = themes[mode as keyof typeof themes];
      setTheme((currentTheme) =>
        currentTheme === newTheme ? currentTheme : newTheme,
      );
    }
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, toggleTheme, updateThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
