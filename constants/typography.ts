import { TextStyle } from "react-native";
import { fontFamily } from "../lib/fonts";

// Named text styles. The app bundles static font files, so weight comes from
// fontFamily — never set fontWeight (iOS would synthesize the weight).
// Colors are not baked in: they are theme-dependent (light/dark) and applied
// at render time by ThemedText from ThemeContext.
export const type = {
  // Tanker: hero and screen chrome.
  display: { fontSize: 40, fontFamily: fontFamily.tanker.regular },
  displaySm: { fontSize: 32, fontFamily: fontFamily.tanker.regular },
  screenTitle: { fontSize: 24, fontFamily: fontFamily.tanker.regular },
  // Plus Jakarta Sans: content.
  title: { fontSize: 24, fontFamily: fontFamily.plusJakarta.bold },
  heading: { fontSize: 20, fontFamily: fontFamily.plusJakarta.bold },
  titleSm: { fontSize: 18, fontFamily: fontFamily.plusJakarta.bold },
  headline: { fontSize: 16, fontFamily: fontFamily.plusJakarta.semiBold },
  body: { fontSize: 16, fontFamily: fontFamily.plusJakarta.regular },
  subhead: { fontSize: 14, fontFamily: fontFamily.plusJakarta.regular },
  footnote: { fontSize: 13, fontFamily: fontFamily.plusJakarta.regular },
  caption: { fontSize: 12, fontFamily: fontFamily.plusJakarta.medium },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
