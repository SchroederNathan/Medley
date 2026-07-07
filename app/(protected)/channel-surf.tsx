import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/button";
import Input from "../../components/ui/input";
import { ThemeContext } from "../../contexts/theme-context";
import {
  BUILD_CHANNEL,
  useUpdateChannel,
} from "../../hooks/use-update-channel";
import { fontFamily } from "../../lib/fonts";

// Hidden screen, reached via the deep link posted on each PR:
// com.schroedernathan.medley://channel-surf?channel=<branch-name>
const ChannelSurfScreen = () => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const { channel: linkedChannel } = useLocalSearchParams<{
    channel?: string;
  }>();
  const {
    activeChannel,
    isSurfing,
    canSurf,
    busy,
    error,
    overrideChannel,
    surfTo,
    surfBack,
  } = useUpdateChannel();
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
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Channel surfing
        </Text>
        <TouchableOpacity onPress={close} hitSlop={8}>
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>
            Close
          </Text>
        </TouchableOpacity>
      </View>

      {!canSurf ? (
        <Text style={[styles.body, { color: theme.secondaryText }]}>
          Channel surfing only works in release preview builds.
        </Text>
      ) : (
        <>
          <Text style={[styles.body, { color: theme.secondaryText }]}>
            Current channel: {activeChannel}
            {isSurfing ? " (override active)" : ""}
          </Text>

          <Text
            testID="channel-surf-override-debug"
            style={[styles.body, { color: theme.secondaryText }]}
          >
            Pending override: {overrideChannel ?? "none"}
          </Text>

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
            <Text
              testID="channel-surf-error"
              style={[styles.body, { color: theme.destructive }]}
            >
              {error}
            </Text>
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
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  cancel: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  body: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },
});
