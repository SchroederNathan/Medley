import React, { useContext } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useUpdateChannel } from "../../hooks/use-update-channel";
import { fontFamily } from "../../lib/fonts";

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
      <Text style={[styles.text, { color: theme.text }]}>
        {busy ? "Returning..." : `Previewing "${activeChannel}", tap to return`}
      </Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  text: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
  },
});
