import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SEARCHBAR_HEIGHT } from "../contexts/home-animation-context";

export const useHeaderHeight = () => {
  const insets = useSafeAreaInsets();

  return {
    // Net header height is the interactive content height (searchbar)
    netHeight: SEARCHBAR_HEIGHT,
    // Gross height = safe top inset + chrome (approx 58) to position elements below status bar
    grossHeight: insets.top + 58,
    // Extra 8px top inset provides breathing room and touch comfort
    insetTop: insets.top + 8,
  };
};
