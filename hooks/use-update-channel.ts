import * as Updates from "expo-updates";
import { useCallback, useState } from "react";

// Channel baked into the surfboard build's profile (eas.json build.preview).
export const BUILD_CHANNEL = "preview";

export const useUpdateChannel = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Channel of the build/update currently running. Unset in dev builds (the
  // docs say null, but dev clients report ""), where the expo-updates
  // override API is unavailable anyway.
  const activeChannel = Updates.channel ? Updates.channel : null;
  const isSurfing = activeChannel !== null && activeChannel !== BUILD_CHANNEL;
  const surfEnabled = process.env.EXPO_PUBLIC_CHANNEL_SURF === "1";
  const canSurf = !__DEV__ && surfEnabled && activeChannel !== null;

  const surfTo = useCallback(
    async (channel: string | null) => {
      setBusy(true);
      setError(null);
      try {
        Updates.setUpdateRequestHeadersOverride(
          channel ? { "expo-channel-name": channel } : null
        );
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable && channel) {
          // Nothing compatible on that channel: it is empty, or the PR changed
          // native code (fingerprint mismatch). Restore the previous override
          // instead of reloading into nothing.
          Updates.setUpdateRequestHeadersOverride(
            isSurfing && activeChannel
              ? { "expo-channel-name": activeChannel }
              : null
          );
          setError(
            `No compatible update on "${channel}". If the PR changed native code, install its build from the PR comment first.`
          );
          return;
        }
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
        }
        await Updates.reloadAsync();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [activeChannel, isSurfing]
  );

  const surfBack = useCallback(() => surfTo(null), [surfTo]);

  return { activeChannel, isSurfing, canSurf, busy, error, surfTo, surfBack };
};
