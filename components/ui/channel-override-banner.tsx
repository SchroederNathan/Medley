import React, { useContext } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { useUpdateChannel } from "../../hooks/use-update-channel";
import { ThemedText } from "./themed-text";

// Shown whenever an EAS Update channel override is active (see
// hooks/use-update-channel.ts), so nobody forgets they are running PR code.
const ChannelOverrideBanner = () => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const { isSurfing, activeChannel, busy, surfBack } = useUpdateChannel();

  if (!isSurfing) {
    return null;
  }

  return (
    <Pressable
      onPress={() => void surfBack()}
      disabled={busy}
      style={[
        styles.banner,
        {
          top: insets.top + 4,
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <ThemedText variant="caption">
        {busy ? "Returning..." : `Previewing "${activeChannel}", tap to return`}
      </ThemedText>
    </Pressable>
  );
};

export default ChannelOverrideBanner;

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
});
