export const themes = {
  light: {
    mode: "light" as const,
    background: "#FFFFFF",

    text: "#171717",
    secondaryText: "#737373",

    primary: "#007AFF",
    secondary: "#5856D6",
    border: "#E5E5EA",
    destructive: "#FF3B30",
    card: "#F2F2F7",

    modalBackground: "rgba(255, 255, 255, 0.9)",

    buttonBackground: "rgba(255, 255, 255, 0.75)",
    buttonBorder: "rgba(0, 0, 0, 0.15)",
    secondaryButtonBackground: "#171717",
    secondaryButtonBorder: "#404040",

    fabButtonBackground: "rgba(255, 255, 255, 0.75)",

    inputBackground: "rgba(120, 120, 128, 0.12)",
    inputPlaceholderText: "#8E8E93",
    inputText: "#171717",
    inputBorder: "rgba(0, 0, 0, 0.12)",

    // Ranking colors
    gold: "#FFCB6B",
    goldDark: "#B8860B",
    silver: "#C0C0C0",
    silverDark: "#808080",
    bronze: "#CD7F32",
    bronzeDark: "#8B4513",
  },
  dark: {
    mode: "dark" as const,
    background: "#0A0A0A",
    text: "#E5E5E5",
    secondaryText: "#737373",
    destructive: "#FF3B30",
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    border: "#262626",
    card: "#1C1C1E",

    modalBackground: "rgba(23, 23, 23, 0.9)",

    buttonBackground: "rgba(28, 28, 28, 0.8)",
    buttonBorder: "rgba(64, 64, 64, 0.5)",
    secondaryButtonBackground: "#F5F5F5",
    secondaryButtonBorder: "#737373",

    fabButtonBackground: "rgba(38, 38, 38, 0.7)",

    inputBackground: "rgba(28, 28, 28, 0.3)",
    inputPlaceholderText: "#737373",
    inputText: "#E5E5E5",
    inputBorder: "rgba(64, 64, 64, 0.3)",

    // Ranking colors
    gold: "#FFCB6B",
    goldDark: "#4D3200",
    silver: "#E8F7FF",
    silverDark: "#293840",
    bronze: "#FEBDA3",
    bronzeDark: "#65240A",
  },
};

export type Theme = (typeof themes)[keyof typeof themes];
