import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { Media } from "../../types/media";
import MediaCard from "./media-card";

const POSTER_WIDTH = 64;
const POSTER_HEIGHT = 96;

/**
 * One movie in the upcoming-releases list: small poster (keeps MediaCard's
 * long-press radial menu and save action) next to title, genres and synopsis.
 */
const UpcomingRow = ({ media }: { media: Media }) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  return (
    <View style={styles.row}>
      <MediaCard media={media} width={POSTER_WIDTH} height={POSTER_HEIGHT} />
      <Pressable
        style={styles.details}
        onPress={() => router.push(`/media-detail?id=${media.id}`)}
      >
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {media.title}
        </Text>
        {media.genres.length > 0 ? (
          <Text
            style={[styles.genres, { color: theme.secondaryText }]}
            numberOfLines={1}
          >
            {media.genres.slice(0, 3).join(" · ")}
          </Text>
        ) : null}
        {media.description ? (
          <Text
            style={[styles.description, { color: theme.secondaryText }]}
            numberOfLines={2}
          >
            {media.description}
          </Text>
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
    gap: 12,
    paddingVertical: 8,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  genres: {
    fontSize: 13,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  description: {
    fontSize: 13,
    fontFamily: fontFamily.plusJakarta.regular,
    lineHeight: 18,
  },
});
