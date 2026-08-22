import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { ThemedText } from "../../components/ui/themed-text";
import { spacing } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import {
  BUILD_CHANNEL,
  useUpdateChannel,
} from "../../hooks/use-update-channel";

// Hidden screen, reached via the deep link posted on each PR:
// com.schroedernathan.medley://channel-surf?channel=<branch-name>
const ChannelSurfScreen = () => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const { channel: linkedChannel } = useLocalSearchParams<{
    channel?: string;
  }>();
  const { activeChannel, isSurfing, canSurf, busy, error, surfTo, surfBack } =
    useUpdateChannel();
  const [channel, setChannel] = useState(linkedChannel ?? "");
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(protected)/(tabs)/(home)");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.header}>
        <ThemedText variant="heading" weight="semiBold">
          Channel surfing
        </ThemedText>
        <TouchableOpacity onPress={close} hitSlop={8}>
          <ThemedText weight="medium" color="secondary">
            Close
          </ThemedText>
        </TouchableOpacity>
      </View>

      {!canSurf ? (
        <ThemedText variant="subhead" color="secondary">
          Channel surfing only works in release preview builds.
        </ThemedText>
      ) : (
        <>
          <ThemedText variant="subhead" color="secondary">
            Current channel: {activeChannel}
            {isSurfing ? " (override active)" : ""}
          </ThemedText>

          <Input
            placeholder="PR branch name"
            value={channel}
            onChangeText={setChannel}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title={busy ? "Switching..." : "Surf to channel"}
            onPress={() => void surfTo(channel.trim())}
            disabled={busy || channel.trim().length === 0}
          />

          {isSurfing && (
            <Button
              title={`Back to ${BUILD_CHANNEL}`}
              variant="secondary"
              onPress={() => void surfBack()}
              disabled={busy}
            />
          )}

          {busy && <ActivityIndicator color={theme.text} />}

          {error && (
            <ThemedText variant="subhead" style={{ color: theme.destructive }}>
              {error}
            </ThemedText>
          )}
        </>
      )}
    </View>
  );
};

export default ChannelSurfScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
