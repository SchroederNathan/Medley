import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { spacing } from "../../constants/theme";
import { Media } from "../../types/media";
import MediaCard from "./media-card";
import { ThemedText } from "./themed-text";

const POSTER_WIDTH = 64;
const POSTER_HEIGHT = 96;

/**
 * One movie in the upcoming-releases list: small poster (keeps MediaCard's
 * long-press radial menu and save action) next to title, genres and synopsis.
 */
const UpcomingRow = ({ media }: { media: Media }) => {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <MediaCard media={media} width={POSTER_WIDTH} height={POSTER_HEIGHT} />
      <Pressable
        style={styles.details}
        onPress={() => router.push(`/media-detail?id=${media.id}`)}
      >
        <ThemedText variant="headline" numberOfLines={2}>
          {media.title}
        </ThemedText>
        {media.genres.length > 0 ? (
          <ThemedText
            variant="footnote"
            weight="medium"
            color="secondary"
            numberOfLines={1}
          >
            {media.genres.slice(0, 3).join(" · ")}
          </ThemedText>
        ) : null}
        {media.description ? (
          <ThemedText
            variant="footnote"
            color="secondary"
            style={styles.description}
            numberOfLines={2}
          >
            {media.description}
          </ThemedText>
        ) : null}
      </Pressable>
    </View>
  );
};

export default UpcomingRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    lineHeight: 18,
  },
});
