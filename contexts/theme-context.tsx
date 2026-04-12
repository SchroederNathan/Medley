import React, { createContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { themes } from "../constants/colors";
import { getStoredThemeMode, setStoredThemeMode } from "../lib/storage";

export const ThemeContext = createContext({
  theme: themes.dark,
  themeMode: "system", // "system", "light", or "dark"
  toggleTheme: () => {},
  updateThemeMode: (mode: string) => {},
});

const resolveThemeMode = (mode: string, systemColorScheme: string | null) => {
  if (mode === "system") {
    return themes[(systemColorScheme || "light") as keyof typeof themes];
  }

  return themes[mode as keyof typeof themes];
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(
    () => getStoredThemeMode() ?? "system"
  );
  const [theme, setTheme] = useState(() =>
    resolveThemeMode(getStoredThemeMode() ?? "system", systemColorScheme)
  );

  // Update theme when system color scheme changes and we're in system mode
  useEffect(() => {
    if (themeMode === "system" && systemColorScheme) {
      const newTheme = themes[systemColorScheme as keyof typeof themes];
      // Only update if the theme actually changed to prevent unnecessary re-renders
      setTheme((currentTheme) =>
        currentTheme === newTheme ? currentTheme : newTheme
      );
    }
  }, [systemColorScheme, themeMode]);

  const toggleTheme = async () => {
    const newTheme = theme === themes.light ? themes.dark : themes.light;
    setTheme((currentTheme) =>
      currentTheme === newTheme ? currentTheme : newTheme
    );
    const newThemeMode = newTheme === themes.light ? "light" : "dark";
    setThemeMode(newThemeMode); // Override system mode when user manually toggles
    try {
      setStoredThemeMode(newThemeMode);
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
        currentTheme === newTheme ? currentTheme : newTheme
      );
    } else {
      const newTheme = themes[mode as keyof typeof themes];
      setTheme((currentTheme) =>
        currentTheme === newTheme ? currentTheme : newTheme
      );
    }
    try {
      setStoredThemeMode(mode);
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
