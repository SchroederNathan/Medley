import PlaySolidIcon from "@hugeicons-pro/core-solid-standard/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useCallback, useContext } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { motion, radius, spacing } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { MediaTrailer } from "../../types/media";
import { ThemedText } from "./themed-text";

const TrailerThumbnail = ({ trailer }: { trailer: MediaTrailer }) => {
  const { theme } = useContext(ThemeContext);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
  }, [trailer.key]);

  return (
    <View>
      <ThemedText variant="heading" style={styles.title}>
        Trailer
      </ThemedText>
      <Pressable
        onPress={handlePress}
        style={[styles.container, { borderColor: theme.border }]}
      >
        <Image
          source={{
            uri: `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`,
          }}
          cachePolicy="memory-disk"
          transition={motion.quick}
          contentFit="cover"
          style={styles.thumbnail}
        />
        <View style={styles.overlay}>
          <View
            style={[
              styles.playButton,
              {
                backgroundColor: theme.buttonBackground,
                borderColor: theme.buttonBorder,
              },
            ]}
          >
            <HugeiconsIcon icon={PlaySolidIcon} size={24} color={theme.text} />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default TrailerThumbnail;

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  container: {
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: "hidden",
    width: 230,
    height: 128.75,
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
