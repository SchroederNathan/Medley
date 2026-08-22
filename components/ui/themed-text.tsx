import React, { useContext } from "react";
import { Text, TextProps } from "react-native";
import { type, TypeVariant } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

type Weight = "regular" | "medium" | "semiBold" | "bold";

interface ThemedTextProps extends TextProps {
  variant?: TypeVariant;
  // Swaps the Plus Jakarta weight within a variant's size. Ignore for
  // display, which is Tanker.
  weight?: Weight;
  color?: "primary" | "secondary";
}

// The one place screens get text styles from. Callers may override layout
// via style (merged last); a color outside primary/secondary comes from the
// theme through style.
export function ThemedText({
  variant = "body",
  weight,
  color = "primary",
  style,
  ...props
}: ThemedTextProps) {
  const { theme } = useContext(ThemeContext);

  return (
    <Text
      style={[
        type[variant],
        weight && { fontFamily: fontFamily.plusJakarta[weight] },
        { color: color === "secondary" ? theme.secondaryText : theme.text },
        style,
      ]}
      {...props}
    />
  );
}
